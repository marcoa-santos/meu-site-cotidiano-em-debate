#!/usr/bin/env python3
"""
Academic Repository Backend API Testing Suite
Tests all backend endpoints and functionality
"""

import requests
import sys
import json
from datetime import datetime
import time

class AcademicRepositoryTester:
    def __init__(self, base_url="https://7a8d90a0-f471-4d33-9da2-4d2ccc8accda.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_product_id = None
        self.created_ensino_id = None
        self.created_extensao_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for multipart/form-data
                    if 'Content-Type' in test_headers:
                        del test_headers['Content-Type']
                    response = requests.post(url, data=data, files=files, headers=test_headers, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                # Handle file downloads (non-JSON responses)
                if endpoint.startswith('api/download-') or 'download' in endpoint:
                    details += " | File download successful"
                else:
                    try:
                        response_data = response.json()
                        if isinstance(response_data, dict) and len(str(response_data)) < 200:
                            details += f" | Response: {response_data}"
                        elif isinstance(response_data, list):
                            details += f" | Items: {len(response_data)}"
                    except:
                        details += " | Response: Non-JSON"
            else:
                try:
                    error_data = response.json()
                    details += f" | Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" | Error: {response.text[:100]}"

            return self.log_test(name, success, details), response.json() if success and not (endpoint.startswith('api/download-') or 'download' in endpoint) else {}

        except Exception as e:
            return self.log_test(name, False, f"Exception: {str(e)}"), {}

    def test_health_check(self):
        """Test API health endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": "marc0_santos", "password": "tda-8maq9"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   🔑 Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_doi_metadata(self):
        """Test DOI metadata retrieval"""
        # Test with a valid DOI
        test_doi = "10.1038/nature12373"
        success, response = self.run_test(
            f"DOI Metadata ({test_doi})",
            "GET",
            f"api/doi-metadata/{test_doi}",
            200
        )
        
        if success:
            expected_fields = ['title', 'authors', 'journal', 'publication_year']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                print(f"   📄 Title: {response.get('title', 'N/A')[:50]}...")
                print(f"   👥 Authors: {len(response.get('authors', []))} found")
        
        return success

    def test_products_list(self):
        """Test products listing"""
        return self.run_test("Products List", "GET", "api/products", 200)

    def test_products_with_filters(self):
        """Test products with various filters"""
        filters = [
            ("search", "test"),
            ("product_type", "Articles"),
            ("author", "Smith"),
            ("year", "2023")
        ]
        
        all_passed = True
        for filter_name, filter_value in filters:
            success, _ = self.run_test(
                f"Products Filter ({filter_name}={filter_value})",
                "GET",
                f"api/products?{filter_name}={filter_value}",
                200
            )
            all_passed = all_passed and success
        
        return all_passed

    def test_create_product(self):
        """Test product creation"""
        if not self.token:
            return self.log_test("Create Product", False, "No authentication token")

        # Prepare form data for multipart/form-data
        form_data = {
            'title': 'Test Academic Product',
            'authors': json.dumps(['Dr. Test Author', 'Prof. Second Author']),
            'abstract': 'This is a test abstract for the academic product testing suite.',
            'product_type': 'Articles',
            'doi': '10.1000/test123',
            'publication_year': '2024',
            'journal': 'Test Journal of Academic Research',
            'keywords': json.dumps(['testing', 'academic', 'repository']),
            'url': 'https://example.com/test-paper'
        }

        # Use requests directly for multipart form data
        url = f"{self.base_url}/api/products"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        print(f"\n🔍 Testing Create Product...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                response_data = response.json()
                details = f"Status: {response.status_code}"
                if 'id' in response_data:
                    self.created_product_id = response_data['id']
                    details += f" | Product ID: {self.created_product_id}"
                    print(f"   🆔 Created product ID: {self.created_product_id}")
            else:
                try:
                    error_data = response.json()
                    details = f"Status: {response.status_code} | Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details = f"Status: {response.status_code} | Error: {response.text[:100]}"
            
            return self.log_test("Create Product", success, details)
            
        except Exception as e:
            return self.log_test("Create Product", False, f"Exception: {str(e)}")

    def test_get_product_detail(self):
        """Test getting product details"""
        if not self.created_product_id:
            return self.log_test("Get Product Detail", False, "No product ID available")
        
        success, response = self.run_test(
            "Get Product Detail",
            "GET",
            f"api/products/{self.created_product_id}",
            200
        )
        
        if success:
            print(f"   📊 View count: {response.get('view_count', 0)}")
        
        return success

    def test_stats_endpoint(self):
        """Test statistics endpoint"""
        success, response = self.run_test("Statistics", "GET", "api/stats", 200)
        
        if success:
            print(f"   📈 Total products: {response.get('total_products', 0)}")
            print(f"   📰 Total news: {response.get('total_news', 0)}")
            product_types = response.get('product_types', {})
            if product_types:
                print(f"   📊 Product types: {product_types}")
        
        return success

    def test_news_endpoints(self):
        """Test news endpoints"""
        # Test getting news (should work without auth)
        success1, _ = self.run_test("Get News", "GET", "api/news", 200)
        
        # Test creating news (requires auth) - use form data
        if self.token:
            news_data = {
                "title": "Test News Article",
                "content": "This is a test news article content.",
                "category": "General",
                "author": "Test Admin"
            }
            
            url = f"{self.base_url}/api/news"
            headers = {'Authorization': f'Bearer {self.token}'}
            
            try:
                response = requests.post(url, data=news_data, headers=headers, timeout=10)
                success2 = response.status_code == 200
                details = f"Status: {response.status_code}"
                
                if success2:
                    response_data = response.json()
                    if 'id' in response_data:
                        details += f" | News ID: {response_data['id']}"
                else:
                    try:
                        error_data = response.json()
                        details += f" | Error: {error_data.get('detail', 'Unknown error')}"
                    except:
                        details += f" | Error: {response.text[:100]}"
                
                success2 = self.log_test("Create News", success2, details)
                
            except Exception as e:
                success2 = self.log_test("Create News", False, f"Exception: {str(e)}")
        else:
            success2 = self.log_test("Create News", False, "No authentication token")
        
        return success1 and success2

    def test_delete_product(self):
        """Test product deletion"""
        if not self.created_product_id or not self.token:
            return self.log_test("Delete Product", False, "No product ID or token available")
        
        return self.run_test(
            "Delete Product",
            "DELETE",
            f"api/products/{self.created_product_id}",
            200
        )[0]

    def test_invalid_endpoints(self):
        """Test invalid endpoints and error handling"""
        error_tests = [
            ("Invalid Product ID", "GET", "api/products/invalid-id", 404),
            ("Invalid DOI", "GET", "api/doi-metadata/invalid.doi", 404),
            ("Unauthorized Product Creation", "POST", "api/products", 403)  # Without token
        ]
        
        # Temporarily remove token for unauthorized test
        temp_token = self.token
        self.token = None
        
        all_passed = True
        for test_name, method, endpoint, expected_status in error_tests:
            if test_name == "Unauthorized Product Creation":
                success, _ = self.run_test(
                    test_name,
                    method,
                    endpoint,
                    expected_status,
                    data={"title": "test", "authors": "[]", "abstract": "test", "product_type": "Articles"}
                )
            else:
                success, _ = self.run_test(test_name, method, endpoint, expected_status)
            all_passed = all_passed and success
        
        # Restore token
        self.token = temp_token
        return all_passed

    def test_ensino_endpoints(self):
        """Test ensino (teaching materials) endpoints"""
        if not self.token:
            return self.log_test("Ensino Endpoints", False, "No authentication token")

        # Test getting ensino list
        success1, _ = self.run_test("Get Ensino List", "GET", "api/ensino", 200)
        
        # Test creating ensino with file upload
        form_data = {
            'title': 'Aula de Matemática Básica',
            'description': 'Material didático sobre conceitos fundamentais de matemática',
            'subject': 'Matemática',
            'tipo': 'Slides',
            'video_url': 'https://youtube.com/watch?v=example'
        }

        # Create a test PDF file
        test_pdf_content = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF'
        
        files = {
            'material_file': ('test_material.pdf', test_pdf_content, 'application/pdf')
        }

        url = f"{self.base_url}/api/ensino"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        print(f"\n🔍 Testing Create Ensino with File...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, data=form_data, files=files, headers=headers, timeout=10)
            success2 = response.status_code == 200
            
            if success2:
                response_data = response.json()
                details = f"Status: {response.status_code}"
                if 'id' in response_data:
                    self.created_ensino_id = response_data['id']
                    details += f" | Ensino ID: {self.created_ensino_id}"
                    print(f"   🆔 Created ensino ID: {self.created_ensino_id}")
                    # Check if file field is present
                    if response_data.get('file'):
                        print(f"   📁 File uploaded: {response_data['file']}")
            else:
                try:
                    error_data = response.json()
                    details = f"Status: {response.status_code} | Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details = f"Status: {response.status_code} | Error: {response.text[:100]}"
            
            success2 = self.log_test("Create Ensino with File", success2, details)
            
        except Exception as e:
            success2 = self.log_test("Create Ensino with File", False, f"Exception: {str(e)}")

        # Test download ensino material
        success3 = True
        if self.created_ensino_id:
            success3, _ = self.run_test(
                "Download Ensino Material",
                "GET",
                f"api/download-ensino/{self.created_ensino_id}",
                200
            )
        else:
            success3 = self.log_test("Download Ensino Material", False, "No ensino ID available")
        
        return success1 and success2 and success3

    def test_extensao_file_upload(self):
        """Test extensão file upload functionality - MAIN FOCUS"""
        if not self.token:
            return self.log_test("Extensão File Upload", False, "No authentication token")

        print("\n" + "="*50)
        print("🎯 TESTING EXTENSÃO FILE UPLOAD FUNCTIONALITY")
        print("="*50)

        # Test 1: Get extensão list
        success1, _ = self.run_test("Get Extensão List", "GET", "api/extensao", 200)
        
        # Test 2: Create extensão with material file upload
        form_data = {
            'title': 'Workshop de Sustentabilidade Ambiental',
            'description': 'Atividade de extensão focada em práticas sustentáveis para a comunidade local',
            'location': 'Campus Universitário - Auditório Principal',
            'tipo': 'Workshop',
            'event_date': '2024-12-15T14:00:00',
            'video_url': 'https://youtube.com/watch?v=sustainability-workshop'
        }

        # Create test files for upload
        test_pdf_content = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF'
        
        test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'material_file': ('workshop_materials.pdf', test_pdf_content, 'application/pdf'),
            'image_file': ('workshop_image.png', test_image_content, 'image/png')
        }

        url = f"{self.base_url}/api/extensao"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        print(f"\n🔍 Testing Create Extensão with Files...")
        print(f"   URL: {url}")
        print(f"   📁 Material file: workshop_materials.pdf ({len(test_pdf_content)} bytes)")
        print(f"   🖼️  Image file: workshop_image.png ({len(test_image_content)} bytes)")
        
        try:
            response = requests.post(url, data=form_data, files=files, headers=headers, timeout=15)
            success2 = response.status_code == 200
            
            if success2:
                response_data = response.json()
                details = f"Status: {response.status_code}"
                if 'id' in response_data:
                    self.created_extensao_id = response_data['id']
                    details += f" | Extensão ID: {self.created_extensao_id}"
                    print(f"   🆔 Created extensão ID: {self.created_extensao_id}")
                    
                    # Verify file fields are present
                    if response_data.get('file'):
                        print(f"   📁 Material file uploaded: {response_data['file']}")
                    else:
                        print(f"   ⚠️  Material file field missing or empty")
                    
                    if response_data.get('image_file'):
                        print(f"   🖼️  Image file uploaded: {response_data['image_file']}")
                    else:
                        print(f"   ⚠️  Image file field missing or empty")
                    
                    # Verify other fields
                    print(f"   📅 Event date: {response_data.get('event_date')}")
                    print(f"   🎥 Video URL: {response_data.get('video_url')}")
                    
            else:
                try:
                    error_data = response.json()
                    details = f"Status: {response.status_code} | Error: {error_data.get('detail', 'Unknown error')}"
                    print(f"   ❌ Error details: {error_data}")
                except:
                    details = f"Status: {response.status_code} | Error: {response.text[:200]}"
                    print(f"   ❌ Raw error: {response.text[:200]}")
            
            success2 = self.log_test("Create Extensão with Files", success2, details)
            
        except Exception as e:
            success2 = self.log_test("Create Extensão with Files", False, f"Exception: {str(e)}")

        # Test 3: Download extensão material file
        success3 = True
        if self.created_extensao_id:
            print(f"\n🔍 Testing Download Extensão Material...")
            success3, response = self.run_test(
                "Download Extensão Material",
                "GET",
                f"api/download-extensao/{self.created_extensao_id}",
                200
            )
            if success3:
                print(f"   ✅ File download endpoint working")
        else:
            success3 = self.log_test("Download Extensão Material", False, "No extensão ID available")

        # Test 4: File validation - test invalid file type
        print(f"\n🔍 Testing File Validation (Invalid Type)...")
        invalid_files = {
            'material_file': ('invalid.txt', b'This is a text file', 'text/plain')
        }
        
        try:
            response = requests.post(url, data=form_data, files=invalid_files, headers=headers, timeout=10)
            success4 = response.status_code == 400  # Should reject invalid file type
            details = f"Status: {response.status_code}"
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    details += f" | Error: {error_data.get('detail', 'Unknown error')}"
                    print(f"   ✅ Correctly rejected invalid file type: {error_data.get('detail')}")
                except:
                    details += " | Error: Invalid file type rejected"
            else:
                details += " | Expected 400 status for invalid file type"
            
            success4 = self.log_test("File Type Validation", success4, details)
            
        except Exception as e:
            success4 = self.log_test("File Type Validation", False, f"Exception: {str(e)}")

        # Test 5: File size validation - test oversized file (simulate)
        print(f"\n🔍 Testing File Size Validation...")
        # Create a large file content (simulate > 10MB)
        large_content = b'x' * (11 * 1024 * 1024)  # 11MB
        large_files = {
            'material_file': ('large_file.pdf', large_content, 'application/pdf')
        }
        
        try:
            response = requests.post(url, data=form_data, files=large_files, headers=headers, timeout=20)
            success5 = response.status_code == 413  # Should reject oversized file
            details = f"Status: {response.status_code}"
            if response.status_code == 413:
                try:
                    error_data = response.json()
                    details += f" | Error: {error_data.get('detail', 'Unknown error')}"
                    print(f"   ✅ Correctly rejected oversized file: {error_data.get('detail')}")
                except:
                    details += " | Error: File too large rejected"
            else:
                details += " | Expected 413 status for oversized file"
            
            success5 = self.log_test("File Size Validation", success5, details)
            
        except Exception as e:
            success5 = self.log_test("File Size Validation", False, f"Exception: {str(e)}")

        # Test 6: Create extensão without files (should still work)
        print(f"\n🔍 Testing Create Extensão without Files...")
        form_data_no_files = {
            'title': 'Palestra sobre Inovação Tecnológica',
            'description': 'Evento de extensão sobre tendências em tecnologia',
            'location': 'Laboratório de Informática',
            'tipo': 'Palestra',
            'event_date': '2024-12-20T16:00:00',
            'video_url': 'https://youtube.com/watch?v=tech-innovation'
        }
        
        try:
            response = requests.post(url, data=form_data_no_files, headers=headers, timeout=10)
            success6 = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success6:
                response_data = response.json()
                if 'id' in response_data:
                    details += f" | Extensão ID: {response_data['id']}"
                    print(f"   ✅ Created extensão without files: {response_data['id']}")
                    # Verify file fields are None/empty
                    if not response_data.get('file') and not response_data.get('image_file'):
                        print(f"   ✅ File fields correctly empty when no files uploaded")
                    else:
                        print(f"   ⚠️  Unexpected file fields: file={response_data.get('file')}, image_file={response_data.get('image_file')}")
            else:
                try:
                    error_data = response.json()
                    details += f" | Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" | Error: {response.text[:100]}"
            
            success6 = self.log_test("Create Extensão without Files", success6, details)
            
        except Exception as e:
            success6 = self.log_test("Create Extensão without Files", False, f"Exception: {str(e)}")

        print("\n" + "="*50)
        print("📊 EXTENSÃO FILE UPLOAD TEST SUMMARY")
        print("="*50)
        
        all_success = success1 and success2 and success3 and success4 and success5 and success6
        
        if all_success:
            print("🎉 ALL EXTENSÃO FILE UPLOAD TESTS PASSED!")
        else:
            failed_tests = []
            if not success1: failed_tests.append("Get List")
            if not success2: failed_tests.append("Create with Files")
            if not success3: failed_tests.append("Download Material")
            if not success4: failed_tests.append("File Type Validation")
            if not success5: failed_tests.append("File Size Validation")
            if not success6: failed_tests.append("Create without Files")
            print(f"❌ Failed tests: {', '.join(failed_tests)}")
        
        return all_success

    def test_cleanup_created_items(self):
        """Clean up created test items"""
        if not self.token:
            return True
        
        success_count = 0
        total_count = 0
        
        # Delete created extensão
        if self.created_extensao_id:
            total_count += 1
            success, _ = self.run_test(
                "Delete Test Extensão",
                "DELETE",
                f"api/extensao/{self.created_extensao_id}",
                200
            )
            if success:
                success_count += 1
        
        # Delete created ensino
        if self.created_ensino_id:
            total_count += 1
            success, _ = self.run_test(
                "Delete Test Ensino",
                "DELETE",
                f"api/ensino/{self.created_ensino_id}",
                200
            )
            if success:
                success_count += 1
        
        return success_count == total_count if total_count > 0 else True

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Academic Repository Backend API Tests")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Authentication
        if not self.test_login():
            print("❌ Login failed - some tests will be skipped")
        
        # Core functionality tests
        test_methods = [
            self.test_doi_metadata,
            self.test_products_list,
            self.test_products_with_filters,
            self.test_create_product,
            self.test_get_product_detail,
            self.test_stats_endpoint,
            self.test_news_endpoints,
            self.test_ensino_endpoints,
            self.test_extensao_file_upload,  # Main focus test
            self.test_invalid_endpoints,
            self.test_delete_product,
            self.test_cleanup_created_items
        ]
        
        for test_method in test_methods:
            try:
                test_method()
                time.sleep(0.5)  # Small delay between tests
            except Exception as e:
                print(f"❌ Test {test_method.__name__} failed with exception: {e}")
        
        # Final results
        print("\n" + "=" * 60)
        print(f"📊 FINAL RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test execution"""
    print("Academic Repository Backend API Test Suite")
    print("Testing against: https://7a8d90a0-f471-4d33-9da2-4d2ccc8accda.preview.emergentagent.com")
    
    tester = AcademicRepositoryTester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())