from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
import jwt
import hashlib
import aiofiles
import uuid
import requests
from pathlib import Path
import json

app = FastAPI(title="Academic Repository API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://7a8d90a0-f471-4d33-9da2-4d2ccc8accda.preview.emergentagent.com",
        "https://cotidianoemdebate.page.gd",
        "http://cotidianoemdebate.page.gd"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "academic_repository")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
products_collection = db.products
news_collection = db.news
ensino_collection = db.ensino
extensao_collection = db.extensao
users_collection = db.users

# JWT Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

security = HTTPBearer()

# File upload configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_AUDIO_EXTENSIONS = {".wav"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif"}

# Mount static files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Pydantic models
class User(BaseModel):
    username: str
    password: str

class UserInDB(BaseModel):
    username: str
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class ProductCreate(BaseModel):
    title: str
    authors: List[str]
    abstract: str
    product_type: str  # Articles, Extended Abstracts, Projects, Books, Book Chapters, Videocasts
    doi: Optional[str] = None
    publication_year: Optional[int] = None
    journal: Optional[str] = None
    keywords: List[str] = []
    url: Optional[str] = None

class Product(BaseModel):
    id: str
    title: str
    authors: List[str]
    abstract: str
    product_type: str
    doi: Optional[str] = None
    publication_year: Optional[int] = None
    journal: Optional[str] = None
    keywords: List[str] = []
    url: Optional[str] = None
    document_file: Optional[str] = None
    audio_file: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    view_count: int = 0
    download_count: int = 0

class NewsCreate(BaseModel):
    title: str
    content: str
    category: str
    author: str

class News(BaseModel):
    id: str
    title: str
    content: str
    category: str
    author: str
    image_file: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class EnsinoCreate(BaseModel):
    title: str
    description: str
    subject: str
    tipo: str  # Slides, Videoaula, Material Complementar, Exercícios
    video_url: Optional[str] = None

class Ensino(BaseModel):
    id: str
    title: str
    description: str
    subject: str
    tipo: str
    video_url: Optional[str] = None
    file: Optional[str] = None
    image_file: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ExtensaoCreate(BaseModel):
    title: str
    description: str
    location: str
    tipo: str  # Projeto Social, Evento, Workshop, Palestra
    event_date: Optional[datetime] = None
    video_url: Optional[str] = None

class Extensao(BaseModel):
    id: str
    title: str
    description: str
    location: str
    tipo: str
    event_date: Optional[datetime] = None
    video_url: Optional[str] = None
    file: Optional[str] = None
    image_file: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    return hash_password(password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await users_collection.find_one({"username": username})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_doi_metadata(doi: str) -> Dict[str, Any]:
    """Fetch metadata from CrossRef API"""
    try:
        url = f"https://api.crossref.org/works/{doi}"
        headers = {"Accept": "application/json"}
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            work = data["message"]
            
            # Extract relevant information
            metadata = {
                "title": work.get("title", [""])[0] if work.get("title") else "",
                "authors": [],
                "journal": work.get("container-title", [""])[0] if work.get("container-title") else "",
                "publication_year": work.get("published-print", {}).get("date-parts", [[None]])[0][0] or 
                                  work.get("published-online", {}).get("date-parts", [[None]])[0][0],
                "abstract": work.get("abstract", ""),
                "url": work.get("URL", "")
            }
            
            # Extract authors
            if work.get("author"):
                for author in work["author"]:
                    given = author.get("given", "")
                    family = author.get("family", "")
                    full_name = f"{given} {family}".strip()
                    if full_name:
                        metadata["authors"].append(full_name)
            
            return metadata
        else:
            return None
    except Exception as e:
        print(f"Error fetching DOI metadata: {e}")
        return None

# Authentication endpoints
@app.post("/api/auth/login", response_model=Token)
async def login(user: User):
    # Check if user exists
    db_user = await users_collection.find_one({"username": user.username})
    
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/register")
async def register(user: User, current_user: dict = Depends(get_current_user)):
    # Only allow existing users to create new users
    existing_user = await users_collection.find_one({"username": user.username})
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = hash_password(user.password)
    await users_collection.insert_one({
        "username": user.username,
        "hashed_password": hashed_password
    })
    
    return {"message": "User created successfully"}

@app.post("/api/auth/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_user)):
    # Verify current password
    if not verify_password(password_data.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update with new password
    new_hashed_password = hash_password(password_data.new_password)
    await users_collection.update_one(
        {"username": current_user["username"]},
        {"$set": {"hashed_password": new_hashed_password}}
    )
    
    return {"message": "Password changed successfully"}

# DOI metadata endpoint
@app.get("/api/doi-metadata/{doi:path}")
async def get_doi_info(doi: str):
    metadata = await get_doi_metadata(doi)
    if metadata:
        return metadata
    else:
        raise HTTPException(status_code=404, detail="DOI not found or invalid")

# Product endpoints
@app.post("/api/products", response_model=Product)
async def create_product(
    title: str = Form(...),
    authors: str = Form(...),  # JSON string of authors array
    abstract: str = Form(...),
    product_type: str = Form(...),
    doi: Optional[str] = Form(None),
    publication_year: Optional[int] = Form(None),
    journal: Optional[str] = Form(None),
    keywords: str = Form("[]"),  # JSON string of keywords array
    url: Optional[str] = Form(None),
    document_file: Optional[UploadFile] = File(None),
    audio_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        authors_list = json.loads(authors)
        keywords_list = json.loads(keywords)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for authors or keywords")
    
    # Generate unique ID
    product_id = str(uuid.uuid4())
    
    # Handle file uploads
    document_filename = None
    audio_filename = None
    
    if document_file:
        if document_file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Document file too large")
        
        file_extension = Path(document_file.filename).suffix.lower()
        if file_extension not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid document file type")
        
        document_filename = f"{product_id}_document{file_extension}"
        document_path = UPLOAD_DIR / document_filename
        
        async with aiofiles.open(document_path, 'wb') as f:
            content = await document_file.read()
            await f.write(content)
    
    if audio_file:
        if audio_file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Audio file too large")
        
        file_extension = Path(audio_file.filename).suffix.lower()
        if file_extension not in ALLOWED_AUDIO_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid audio file type")
        
        audio_filename = f"{product_id}_audio{file_extension}"
        audio_path = UPLOAD_DIR / audio_filename
        
        async with aiofiles.open(audio_path, 'wb') as f:
            content = await audio_file.read()
            await f.write(content)
    
    # Create product document
    now = datetime.utcnow()
    product_doc = {
        "id": product_id,
        "title": title,
        "authors": authors_list,
        "abstract": abstract,
        "product_type": product_type,
        "doi": doi,
        "publication_year": publication_year,
        "journal": journal,
        "keywords": keywords_list,
        "url": url,
        "document_file": document_filename,
        "audio_file": audio_filename,
        "created_at": now,
        "updated_at": now,
        "view_count": 0,
        "download_count": 0
    }
    
    await products_collection.insert_one(product_doc)
    return Product(**product_doc)

@app.get("/api/products", response_model=List[Product])
async def get_products(
    product_type: Optional[str] = None,
    search: Optional[str] = None,
    author: Optional[str] = None,
    year: Optional[int] = None,
    skip: int = 0,
    limit: int = 20
):
    query = {}
    
    if product_type:
        query["product_type"] = product_type
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"abstract": {"$regex": search, "$options": "i"}},
            {"keywords": {"$regex": search, "$options": "i"}}
        ]
    
    if author:
        query["authors"] = {"$regex": author, "$options": "i"}
    
    if year:
        query["publication_year"] = year
    
    cursor = products_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    products = await cursor.to_list(length=limit)
    
    return [Product(**product) for product in products]

@app.get("/api/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await products_collection.find_one({"id": product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Increment view count
    await products_collection.update_one(
        {"id": product_id},
        {"$inc": {"view_count": 1}}
    )
    
    product["view_count"] += 1
    return Product(**product)

@app.put("/api/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_data: ProductCreate,
    current_user: dict = Depends(get_current_user)
):
    product = await products_collection.find_one({"id": product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await products_collection.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    updated_product = await products_collection.find_one({"id": product_id})
    return Product(**updated_product)

@app.delete("/api/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await products_collection.find_one({"id": product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete associated files
    if product.get("document_file"):
        document_path = UPLOAD_DIR / product["document_file"]
        if document_path.exists():
            document_path.unlink()
    
    if product.get("audio_file"):
        audio_path = UPLOAD_DIR / product["audio_file"]
        if audio_path.exists():
            audio_path.unlink()
    
    await products_collection.delete_one({"id": product_id})
    return {"message": "Product deleted successfully"}

@app.get("/api/image/{filename}")
async def serve_image(filename: str):
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Determine media type based on file extension
    file_extension = file_path.suffix.lower()
    media_type_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif'
    }
    
    media_type = media_type_map.get(file_extension, 'image/jpeg')
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={"Cache-Control": "max-age=3600"}
    )

@app.get("/api/download/{product_id}/{file_type}")
async def download_file(product_id: str, file_type: str):
    product = await products_collection.find_one({"id": product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    filename = None
    media_type = 'application/octet-stream'
    
    if file_type == "document" and product.get("document_file"):
        filename = product["document_file"]
        if filename.lower().endswith('.pdf'):
            media_type = 'application/pdf'
        elif filename.lower().endswith(('.doc', '.docx')):
            media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    elif file_type == "audio" and product.get("audio_file"):
        filename = product["audio_file"]
        if filename.lower().endswith('.wav'):
            media_type = 'audio/wav'
        elif filename.lower().endswith('.mp3'):
            media_type = 'audio/mpeg'
    
    if not filename:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Increment download count
    await products_collection.update_one(
        {"id": product_id},
        {"$inc": {"download_count": 1}}
    )
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type,
        headers={"Accept-Ranges": "bytes"}  # Enable streaming
    )

# News endpoints
@app.post("/api/news", response_model=News)
async def create_news(
    title: str = Form(...),
    content: str = Form(...),
    category: str = Form(...),
    author: str = Form(...),
    image_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    news_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Handle image upload
    image_filename = None
    if image_file:
        if image_file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Image file too large")
        
        file_extension = Path(image_file.filename).suffix.lower()
        if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid image file type")
        
        image_filename = f"{news_id}_image{file_extension}"
        image_path = UPLOAD_DIR / image_filename
        
        async with aiofiles.open(image_path, 'wb') as f:
            content_bytes = await image_file.read()
            await f.write(content_bytes)
    
    news_doc = {
        "id": news_id,
        "title": title,
        "content": content,
        "category": category,
        "author": author,
        "image_file": image_filename,
        "created_at": now,
        "updated_at": now
    }
    
    await news_collection.insert_one(news_doc)
    return News(**news_doc)

@app.get("/api/news", response_model=List[News])
async def get_news(category: Optional[str] = None, skip: int = 0, limit: int = 10):
    query = {}
    if category:
        query["category"] = category
    
    cursor = news_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    news_list = await cursor.to_list(length=limit)
    
    return [News(**news) for news in news_list]

@app.get("/api/news/{news_id}", response_model=News)
async def get_news_item(news_id: str):
    news = await news_collection.find_one({"id": news_id})
    
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    return News(**news)

@app.delete("/api/news/{news_id}")
async def delete_news(news_id: str, current_user: dict = Depends(get_current_user)):
    result = await news_collection.delete_one({"id": news_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    
    return {"message": "News deleted successfully"}

# Ensino endpoints
@app.post("/api/ensino", response_model=Ensino)
async def create_ensino(
    title: str = Form(...),
    description: str = Form(...),
    subject: str = Form(...),
    tipo: str = Form(...),
    video_url: Optional[str] = Form(None),
    material_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    ensino_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Handle material file upload
    material_filename = None
    if material_file:
        if material_file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Material file too large")
        
        file_extension = Path(material_file.filename).suffix.lower()
        allowed_extensions = {".pdf", ".ppt", ".pptx", ".doc", ".docx", ".zip"}
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid material file type")
        
        material_filename = f"{ensino_id}_material{file_extension}"
        material_path = UPLOAD_DIR / material_filename
        
        async with aiofiles.open(material_path, 'wb') as f:
            content = await material_file.read()
            await f.write(content)
    
    # Handle image upload
    image_filename = None
    if image_file:
        if image_file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Image file too large")
        
        file_extension = Path(image_file.filename).suffix.lower()
        if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid image file type")
        
        image_filename = f"{ensino_id}_image{file_extension}"
        image_path = UPLOAD_DIR / image_filename
        
        async with aiofiles.open(image_path, 'wb') as f:
            content = await image_file.read()
            await f.write(content)
    
    ensino_doc = {
        "id": ensino_id,
        "title": title,
        "description": description,
        "subject": subject,
        "tipo": tipo,
        "video_url": video_url,
        "file": material_filename,
        "image_file": image_filename,
        "created_at": now,
        "updated_at": now
    }
    
    await ensino_collection.insert_one(ensino_doc)
    return Ensino(**ensino_doc)

@app.get("/api/ensino", response_model=List[Ensino])
async def get_ensino():
    cursor = ensino_collection.find({}).sort("created_at", -1)
    ensino_list = await cursor.to_list(length=100)
    return [Ensino(**ensino) for ensino in ensino_list]

@app.delete("/api/ensino/{ensino_id}")
async def delete_ensino(ensino_id: str, current_user: dict = Depends(get_current_user)):
    ensino = await ensino_collection.find_one({"id": ensino_id})
    
    if not ensino:
        raise HTTPException(status_code=404, detail="Material not found")
    
    # Delete associated files
    if ensino.get("file"):
        file_path = UPLOAD_DIR / ensino["file"]
        if file_path.exists():
            file_path.unlink()
    
    if ensino.get("image_file"):
        image_path = UPLOAD_DIR / ensino["image_file"]
        if image_path.exists():
            image_path.unlink()
    
    await ensino_collection.delete_one({"id": ensino_id})
    return {"message": "Material deleted successfully"}

# Extensão endpoints  
@app.post("/api/extensao", response_model=Extensao)
async def create_extensao(
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    tipo: str = Form(...),
    event_date: Optional[str] = Form(None),
    video_url: Optional[str] = Form(None),
    material_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    extensao_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Parse event_date if provided
    parsed_event_date = None
    if event_date:
        try:
            parsed_event_date = datetime.fromisoformat(event_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid event date format")
    
    # Handle material file upload
    material_filename = None
    if material_file:
        if material_file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Material file too large")
        
        file_extension = Path(material_file.filename).suffix.lower()
        allowed_extensions = {".pdf", ".ppt", ".pptx", ".doc", ".docx", ".zip"}
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid material file type")
        
        material_filename = f"{extensao_id}_material{file_extension}"
        material_path = UPLOAD_DIR / material_filename
        
        async with aiofiles.open(material_path, 'wb') as f:
            content = await material_file.read()
            await f.write(content)
    
    # Handle image upload
    image_filename = None
    if image_file:
        if image_file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Image file too large")
        
        file_extension = Path(image_file.filename).suffix.lower()
        if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid image file type")
        
        image_filename = f"{extensao_id}_image{file_extension}"
        image_path = UPLOAD_DIR / image_filename
        
        async with aiofiles.open(image_path, 'wb') as f:
            content = await image_file.read()
            await f.write(content)
    
    extensao_doc = {
        "id": extensao_id,
        "title": title,
        "description": description,
        "location": location,
        "tipo": tipo,
        "event_date": parsed_event_date,
        "video_url": video_url,
        "file": material_filename,
        "image_file": image_filename,
        "created_at": now,
        "updated_at": now
    }
    
    await extensao_collection.insert_one(extensao_doc)
    return Extensao(**extensao_doc)

@app.get("/api/extensao", response_model=List[Extensao])
async def get_extensao():
    cursor = extensao_collection.find({}).sort("created_at", -1)
    extensao_list = await cursor.to_list(length=100)
    return [Extensao(**extensao) for extensao in extensao_list]

@app.delete("/api/extensao/{extensao_id}")
async def delete_extensao(extensao_id: str, current_user: dict = Depends(get_current_user)):
    extensao = await extensao_collection.find_one({"id": extensao_id})
    
    if not extensao:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Delete associated files
    if extensao.get("file"):
        file_path = UPLOAD_DIR / extensao["file"]
        if file_path.exists():
            file_path.unlink()
    
    if extensao.get("image_file"):
        image_path = UPLOAD_DIR / extensao["image_file"]
        if image_path.exists():
            image_path.unlink()
    
    await extensao_collection.delete_one({"id": extensao_id})
    return {"message": "Activity deleted successfully"}

# Download endpoint for ensino materials
@app.get("/api/download-ensino/{ensino_id}")
async def download_ensino_material(ensino_id: str):
    ensino = await ensino_collection.find_one({"id": ensino_id})
    
    if not ensino or not ensino.get("file"):
        raise HTTPException(status_code=404, detail="Material file not found")
    
    file_path = UPLOAD_DIR / ensino["file"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine media type
    file_extension = file_path.suffix.lower()
    media_type_map = {
        '.pdf': 'application/pdf',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.zip': 'application/zip'
    }
    
    media_type = media_type_map.get(file_extension, 'application/octet-stream')
    
    return FileResponse(
        path=file_path,
        filename=ensino["file"],
        media_type=media_type
    )

# Download endpoint for extensão materials
@app.get("/api/download-extensao/{extensao_id}")
async def download_extensao_material(extensao_id: str):
    extensao = await extensao_collection.find_one({"id": extensao_id})
    
    if not extensao or not extensao.get("file"):
        raise HTTPException(status_code=404, detail="Material file not found")
    
    file_path = UPLOAD_DIR / extensao["file"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine media type
    file_extension = file_path.suffix.lower()
    media_type_map = {
        '.pdf': 'application/pdf',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.zip': 'application/zip'
    }
    
    media_type = media_type_map.get(file_extension, 'application/octet-stream')
    
    return FileResponse(
        path=file_path,
        filename=extensao["file"],
        media_type=media_type
    )

# Statistics endpoint update
@app.get("/api/stats")
async def get_stats():
    total_products = await products_collection.count_documents({})
    total_news = await news_collection.count_documents({})
    total_ensino = await ensino_collection.count_documents({})
    total_extensao = await extensao_collection.count_documents({})
    
    # Count by product type
    product_types = await products_collection.aggregate([
        {"$group": {"_id": "$product_type", "count": {"$sum": 1}}}
    ]).to_list(length=None)
    
    # Count by ensino type
    ensino_types = await ensino_collection.aggregate([
        {"$group": {"_id": "$tipo", "count": {"$sum": 1}}}
    ]).to_list(length=None)
    
    # Count by extensao type
    extensao_types = await extensao_collection.aggregate([
        {"$group": {"_id": "$tipo", "count": {"$sum": 1}}}
    ]).to_list(length=None)
    
    # Recent items
    recent_products = await products_collection.find({}).sort("created_at", -1).limit(3).to_list(length=3)
    recent_ensino = await ensino_collection.find({}).sort("created_at", -1).limit(3).to_list(length=3)
    recent_extensao = await extensao_collection.find({}).sort("created_at", -1).limit(3).to_list(length=3)
    
    return {
        "total_products": total_products,
        "total_news": total_news,
        "total_ensino": total_ensino,
        "total_extensao": total_extensao,
        "product_types": {item["_id"]: item["count"] for item in product_types},
        "ensino_types": {item["_id"]: item["count"] for item in ensino_types},
        "extensao_types": {item["_id"]: item["count"] for item in extensao_types},
        "recent_products": [{"id": p["id"], "title": p["title"], "created_at": p["created_at"]} for p in recent_products],
        "recent_ensino": [{"id": e["id"], "title": e["title"], "created_at": e["created_at"]} for e in recent_ensino],
        "recent_extensao": [{"id": e["id"], "title": e["title"], "created_at": e["created_at"]} for e in recent_extensao]
    }

# Initialize default admin user and sample news
@app.on_event("startup")
async def startup_event():
    # Always ensure the correct admin user exists with the right credentials
    await users_collection.update_one(
        {"username": "marc0_santos"},
        {"$set": {
            "username": "marc0_santos",
            "hashed_password": hash_password("tda-8maq9")
        }},
        upsert=True
    )
    
    # Also remove any old admin users that might exist
    await users_collection.delete_many({"username": {"$ne": "marc0_santos"}})
    
    print("Admin user ensured: marc0_santos/tda-8maq9")
    
    # Create sample news if no news exist
    news_count = await news_collection.count_documents({})
    if news_count == 0:
        now = datetime.utcnow()
        sample_news = [
            {
                "id": str(uuid.uuid4()),
                "title": "Bem-vindos ao Repositório Cotidiano em Debate",
                "content": "Estamos orgulhosos de apresentar nossa nova plataforma digital para compartilhamento de produção acadêmica. Aqui você encontrará artigos, projetos, livros e outros materiais de pesquisa.",
                "category": "Geral",
                "author": "Cotidiano em Debate",
                "image_file": None,
                "created_at": now - timedelta(days=2),
                "updated_at": now - timedelta(days=2)
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Nova Funcionalidade: Player de Áudio",
                "content": "Implementamos um player nativo para reprodução de arquivos de áudio diretamente no navegador. Agora você pode ouvir podcasts e gravações acadêmicas sem precisar fazer download.",
                "category": "Tecnologia",
                "author": "Cotidiano em Debate",
                "image_file": None,
                "created_at": now - timedelta(days=1),
                "updated_at": now - timedelta(days=1)
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Integração com DOI CrossRef",
                "content": "Nossa plataforma agora possui integração automática com a API CrossRef, permitindo o preenchimento automático de metadados através do DOI. Isso facilita o cadastro de artigos e garante maior precisão das informações.",
                "category": "Funcionalidade",
                "author": "Cotidiano em Debate",
                "image_file": None,
                "created_at": now,
                "updated_at": now
            }
        ]
        
        await news_collection.insert_many(sample_news)
        print("Sample news created")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Academic Repository API is running"}