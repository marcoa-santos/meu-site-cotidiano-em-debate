import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Setup axios interceptor for token handling
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      // Token expired or invalid
      localStorage.removeItem('token');
      alert('Sua sessão expirou. Por favor, faça login novamente.');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Product types
const PRODUCT_TYPES = [
  'Articles',
  'Extended Abstracts', 
  'Projects',
  'Books',
  'Book Chapters',
  'Videocasts'
];

// Components
const Header = ({ currentView, setCurrentView, isAuthenticated, logout }) => (
  <header className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white shadow-lg">
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <h1 className="text-3xl font-bold mb-4 md:mb-0 cursor-pointer" 
            onClick={() => setCurrentView('home')}>
          📚 Repositório Cotidiano em Debate
        </h1>
        <nav className="flex flex-wrap gap-2 md:gap-4">
          <button
            onClick={() => setCurrentView('home')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'home' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
            }`}
          >
            Início
          </button>
          <button
            onClick={() => setCurrentView('ensino')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'ensino' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
            }`}
          >
            📚 ENSINO
          </button>
          <button
            onClick={() => setCurrentView('products')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'products' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
            }`}
          >
            🔬 PESQUISA
          </button>
          <button
            onClick={() => setCurrentView('extensao')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'extensao' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
            }`}
          >
            🤝 EXTENSÃO
          </button>
          <a
            href="https://open.spotify.com/show/7mesJaWQRoziSPuBdl2UGJ"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg transition-colors hover:bg-blue-800 flex items-center gap-1"
          >
            🎙️ PODCAST
          </a>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'admin' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
                }`}
              >
                Admin
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <button
              onClick={() => setCurrentView('login')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentView === 'login' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
              }`}
            >
              Login Admin
            </button>
          )}
        </nav>
      </div>
    </div>
  </header>
);

const SearchFilter = ({ filters, setFilters, onSearch }) => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <input
        type="text"
        placeholder="Buscar por título, resumo ou palavras-chave..."
        value={filters.search}
        onChange={(e) => setFilters({...filters, search: e.target.value})}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <select
        value={filters.productType}
        onChange={(e) => setFilters({...filters, productType: e.target.value})}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Todos os tipos</option>
        {PRODUCT_TYPES.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Autor..."
        value={filters.author}
        onChange={(e) => setFilters({...filters, author: e.target.value})}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <input
        type="number"
        placeholder="Ano..."
        value={filters.year}
        onChange={(e) => setFilters({...filters, year: e.target.value})}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <button
      onClick={onSearch}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Buscar
    </button>
  </div>
);

const EnsinoCard = ({ ensinoItem, onClick }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
    {ensinoItem.image_file && (
      <div className="h-48 overflow-hidden">
        <img 
          src={`${API_URL}/api/image/${ensinoItem.image_file}`}
          alt={ensinoItem.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
    )}
    <div className="p-6">
      <div className="flex justify-between items-start mb-3">
        <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
          {ensinoItem.tipo}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(ensinoItem.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{ensinoItem.title}</h3>
      <p className="text-gray-700 mb-3 line-clamp-3">
        {ensinoItem.description}
      </p>
      <div className="text-sm text-gray-500">
        Matéria: {ensinoItem.subject}
      </div>
    </div>
  </div>
);

const ExtensaoCard = ({ extensaoItem, onClick }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
    {extensaoItem.image_file && (
      <div className="h-48 overflow-hidden">
        <img 
          src={`${API_URL}/api/image/${extensaoItem.image_file}`}
          alt={extensaoItem.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
    )}
    <div className="p-6">
      <div className="flex justify-between items-start mb-3">
        <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full">
          {extensaoItem.tipo}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(extensaoItem.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{extensaoItem.title}</h3>
      <p className="text-gray-700 mb-3 line-clamp-3">
        {extensaoItem.description}
      </p>
      <div className="text-sm text-gray-500">
        Local: {extensaoItem.location}
      </div>
    </div>
  </div>
);

const NewsCard = ({ newsItem, onClick }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
    {newsItem.image_file && (
      <div className="h-48 overflow-hidden">
        <img 
          src={`${API_URL}/api/image/${newsItem.image_file}`}
          alt={newsItem.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
    )}
    <div className="p-6">
      <div className="flex justify-between items-start mb-3">
        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
          {newsItem.category}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(newsItem.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{newsItem.title}</h3>
      <p className="text-gray-700 mb-3 line-clamp-3">
        {newsItem.content}
      </p>
      <div className="text-sm text-gray-500">
        Por: {newsItem.author}
      </div>
    </div>
  </div>
);

const EnsinoDetail = ({ ensino, onBack }) => (
  <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
    <button
      onClick={onBack}
      className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
    >
      ← Voltar
    </button>
    
    <div className="mb-6">
      <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
        {ensino.tipo}
      </span>
    </div>
    
    <h1 className="text-3xl font-bold mb-4 text-gray-800">{ensino.title}</h1>
    
    {ensino.image_file && (
      <div className="mb-6">
        <img 
          src={`${API_URL}/api/image/${ensino.image_file}`}
          alt={ensino.title}
          className="w-full max-h-96 object-cover rounded-lg shadow-md"
        />
      </div>
    )}
    
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Matéria:</h3>
      <p className="text-gray-600">{ensino.subject}</p>
    </div>
    
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Descrição:</h3>
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {ensino.description}
      </div>
    </div>
    
    {ensino.file && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">📁 Material:</h3>
        <a
          href={`${API_URL}/api/download-ensino/${ensino.id}`}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 inline-flex"
          download
        >
          📥 Baixar Material
        </a>
      </div>
    )}
    
    {ensino.video_url && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">🎥 Vídeo:</h3>
        <a
          href={ensino.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 inline-flex"
        >
          🎬 Assistir Vídeo
        </a>
      </div>
    )}
    
    <div className="border-t pt-6 flex justify-between items-center text-sm text-gray-500">
      <span>📅 Criado em: {new Date(ensino.created_at).toLocaleDateString('pt-BR')}</span>
    </div>
  </div>
);

const ExtensaoDetail = ({ extensao, onBack }) => (
  <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
    <button
      onClick={onBack}
      className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
    >
      ← Voltar
    </button>
    
    <div className="mb-6">
      <span className="bg-orange-100 text-orange-800 text-sm font-semibold px-3 py-1 rounded-full">
        {extensao.tipo}
      </span>
    </div>
    
    <h1 className="text-3xl font-bold mb-4 text-gray-800">{extensao.title}</h1>
    
    {extensao.image_file && (
      <div className="mb-6">
        <img 
          src={`${API_URL}/api/image/${extensao.image_file}`}
          alt={extensao.title}
          className="w-full max-h-96 object-cover rounded-lg shadow-md"
        />
      </div>
    )}
    
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Local:</h3>
      <p className="text-gray-600">{extensao.location}</p>
    </div>
    
    {extensao.event_date && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Data do Evento:</h3>
        <p className="text-gray-600">{new Date(extensao.event_date).toLocaleDateString('pt-BR')}</p>
      </div>
    )}
    
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Descrição:</h3>
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {extensao.description}
      </div>
    </div>
    
    {extensao.file && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">📁 Material:</h3>
        <a
          href={`${API_URL}/api/download-extensao/${extensao.id}`}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 inline-flex"
          download
        >
          📥 Baixar Material
        </a>
      </div>
    )}
    
    {extensao.video_url && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">🎥 Vídeo:</h3>
        <a
          href={extensao.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 inline-flex"
        >
          🎬 Assistir Vídeo
        </a>
      </div>
    )}
    
    {/* Social Sharing Section */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">📢 Compartilhar:</h3>
      <div className="flex flex-wrap gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(extensao.title)}&url=${encodeURIComponent(window.location.href)}&hashtags=extensao,academico`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          🐦 Twitter
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
        >
          📘 Facebook
        </a>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: extensao.title,
                text: extensao.description.substring(0, 100) + '...',
                url: window.location.href
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copiado para a área de transferência!');
            }
          }}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          🔗 Copiar Link
        </button>
      </div>
    </div>
    
    <div className="border-t pt-6 flex justify-between items-center text-sm text-gray-500">
      <span>📅 Criado em: {new Date(extensao.created_at).toLocaleDateString('pt-BR')}</span>
    </div>
  </div>
);

const NewsDetail = ({ news, onBack }) => (
  <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
    <button
      onClick={onBack}
      className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
    >
      ← Voltar
    </button>
    
    <div className="mb-6">
      <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
        {news.category}
      </span>
    </div>
    
    <h1 className="text-3xl font-bold mb-4 text-gray-800">{news.title}</h1>
    
    {news.image_file && (
      <div className="mb-6">
        <img 
          src={`${API_URL}/api/image/${news.image_file}`}
          alt={news.title}
          className="w-full max-h-96 object-cover rounded-lg shadow-md"
        />
      </div>
    )}
    
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Autor:</h3>
      <p className="text-gray-600">{news.author}</p>
    </div>
    
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Data de Publicação:</h3>
      <p className="text-gray-600">{new Date(news.created_at).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
    </div>
    
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Conteúdo:</h3>
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {news.content}
      </div>
    </div>
    
    {/* Social Sharing Section */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">📢 Compartilhar:</h3>
      <div className="flex flex-wrap gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(news.title)}&url=${encodeURIComponent(window.location.href)}&hashtags=academico,noticias`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          🐦 Twitter
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
        >
          📘 Facebook
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          💼 LinkedIn
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(news.title + ' - ' + window.location.href)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          📱 WhatsApp
        </a>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: news.title,
                text: news.content.substring(0, 100) + '...',
                url: window.location.href
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copiado para a área de transferência!');
            }
          }}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          🔗 Copiar Link
        </button>
      </div>
    </div>
    
    <div className="border-t pt-6 flex justify-between items-center text-sm text-gray-500">
      <span>📅 Criado em: {new Date(news.created_at).toLocaleDateString('pt-BR')}</span>
      <span>✏️ Atualizado em: {new Date(news.updated_at).toLocaleDateString('pt-BR')}</span>
    </div>
  </div>
);

const ProductCard = ({ product, onClick }) => (
  <div 
    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
    onClick={() => onClick(product)}
  >
    <div className="flex justify-between items-start mb-3">
      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
        {product.product_type}
      </span>
      {product.doi && (
        <span className="text-xs text-gray-500">DOI: {product.doi}</span>
      )}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-800">{product.title}</h3>
    <p className="text-gray-600 mb-3 line-clamp-3">
      {product.authors.join(', ')}
    </p>
    <p className="text-gray-700 mb-4 line-clamp-3">
      {product.abstract}
    </p>
    <div className="flex justify-between items-center text-sm text-gray-500">
      <span>👁 {product.view_count} visualizações</span>
      <span>📥 {product.download_count} downloads</span>
      {product.publication_year && <span>{product.publication_year}</span>}
    </div>
  </div>
);

const ProductDetail = ({ product, onBack }) => (
  <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
    <button
      onClick={onBack}
      className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
    >
      ← Voltar
    </button>
    
    <div className="mb-6">
      <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
        {product.product_type}
      </span>
    </div>
    
    <h1 className="text-3xl font-bold mb-4 text-gray-800">{product.title}</h1>
    
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Autores:</h3>
      <p className="text-gray-600">{product.authors.join(', ')}</p>
    </div>
    
    {product.doi && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">DOI:</h3>
        <a href={`https://doi.org/${product.doi}`} target="_blank" rel="noopener noreferrer"
           className="text-blue-600 hover:text-blue-800 transition-colors">
          {product.doi}
        </a>
      </div>
    )}
    
    {product.journal && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Revista/Conferência:</h3>
        <p className="text-gray-600">{product.journal}</p>
      </div>
    )}
    
    {product.publication_year && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Ano de Publicação:</h3>
        <p className="text-gray-600">{product.publication_year}</p>
      </div>
    )}
    
    {product.url && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">URL Externa:</h3>
        <a href={product.url} target="_blank" rel="noopener noreferrer"
           className="text-blue-600 hover:text-blue-800 transition-colors break-all">
          {product.url}
        </a>
      </div>
    )}
    
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Resumo:</h3>
      <p className="text-gray-700 leading-relaxed">{product.abstract}</p>
    </div>
    
    {product.keywords && product.keywords.length > 0 && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Palavras-chave:</h3>
        <div className="flex flex-wrap gap-2">
          {product.keywords.map((keyword, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
              {keyword}
            </span>
          ))}
        </div>
      </div>
    )}
    
    {/* Social Sharing Section */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">📢 Compartilhar:</h3>
      <div className="flex flex-wrap gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.title)}&url=${encodeURIComponent(window.location.href)}&hashtags=pesquisa,academico`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          🐦 Twitter
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
        >
          📘 Facebook
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          💼 LinkedIn
        </a>
        <a
          href={`https://www.researchgate.net/share.ShareRequest.html?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(product.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          🔬 ResearchGate
        </a>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: product.title,
                text: product.abstract.substring(0, 100) + '...',
                url: window.location.href
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copiado para a área de transferência!');
            }
          }}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          🔗 Copiar Link
        </button>
      </div>
    </div>

    {/* Audio Player Section */}
    {product.audio_file && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">🎵 Áudio do Produto:</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <audio 
            controls 
            className="w-full mb-3"
            preload="metadata"
          >
            <source src={`${API_URL}/api/download/${product.id}/audio`} type="audio/wav" />
            <source src={`${API_URL}/api/download/${product.id}/audio`} type="audio/mpeg" />
            Seu navegador não suporta o elemento de áudio.
          </audio>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Formato: WAV</span>
            <a
              href={`${API_URL}/api/download/${product.id}/audio`}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              download
            >
              📥 Baixar Áudio
            </a>
          </div>
        </div>
      </div>
    )}
    
    <div className="flex flex-wrap gap-4 mb-6">
      {product.document_file && (
        <a
          href={`${API_URL}/api/download/${product.id}/document`}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          download
        >
          📄 Baixar Documento
        </a>
      )}
      {product.url && (
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          🔗 Ver Online
        </a>
      )}
    </div>
    
    <div className="border-t pt-6 flex justify-between items-center text-sm text-gray-500">
      <span>👁 {product.view_count} visualizações</span>
      <span>📥 {product.download_count} downloads</span>
      <span>Criado em: {new Date(product.created_at).toLocaleDateString('pt-BR')}</span>
    </div>
  </div>
);

const LoginForm = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
      localStorage.setItem('token', response.data.access_token);
      onLogin(response.data.access_token);
    } catch (error) {
      setError('Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login Administrativo</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Usuário
          </label>
          <input
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Senha
          </label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

const ProductForm = ({ product, onSave, onCancel, token }) => {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    authors: product?.authors || [''],
    abstract: product?.abstract || '',
    product_type: product?.product_type || '',
    doi: product?.doi || '',
    publication_year: product?.publication_year || '',
    journal: product?.journal || '',
    keywords: product?.keywords || [''],
    url: product?.url || ''
  });
  const [files, setFiles] = useState({
    document_file: null,
    audio_file: null
  });
  const [loading, setLoading] = useState(false);
  const [doiLoading, setDoiLoading] = useState(false);

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({...formData, [field]: newArray});
  };

  const addArrayItem = (field) => {
    setFormData({...formData, [field]: [...formData[field], '']});
  };

  const removeArrayItem = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({...formData, [field]: newArray});
  };

  const fetchDoiMetadata = async () => {
    if (!formData.doi) return;
    
    setDoiLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/doi-metadata/${encodeURIComponent(formData.doi)}`);
      const metadata = response.data;
      
      setFormData({
        ...formData,
        title: metadata.title || formData.title,
        authors: metadata.authors.length > 0 ? metadata.authors : formData.authors,
        journal: metadata.journal || formData.journal,
        publication_year: metadata.publication_year || formData.publication_year,
        abstract: metadata.abstract || formData.abstract,
        url: metadata.url || formData.url
      });
    } catch (error) {
      alert('Erro ao buscar metadados do DOI. Verifique se o DOI está correto.');
    } finally {
      setDoiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('authors', JSON.stringify(formData.authors.filter(a => a.trim())));
      formDataToSend.append('abstract', formData.abstract);
      formDataToSend.append('product_type', formData.product_type);
      if (formData.doi) formDataToSend.append('doi', formData.doi);
      if (formData.publication_year) formDataToSend.append('publication_year', formData.publication_year);
      if (formData.journal) formDataToSend.append('journal', formData.journal);
      formDataToSend.append('keywords', JSON.stringify(formData.keywords.filter(k => k.trim())));
      if (formData.url) formDataToSend.append('url', formData.url);
      
      if (files.document_file) formDataToSend.append('document_file', files.document_file);
      if (files.audio_file) formDataToSend.append('audio_file', files.audio_file);

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (product) {
        // Update existing product (simplified - just create new for demo)
        await axios.post(`${API_URL}/api/products`, formDataToSend, config);
      } else {
        await axios.post(`${API_URL}/api/products`, formDataToSend, config);
      }

      onSave();
    } catch (error) {
      alert('Erro ao salvar produto: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {product ? 'Editar Produto' : 'Novo Produto'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DOI (opcional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.doi}
              onChange={(e) => setFormData({...formData, doi: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10.1000/182"
            />
            <button
              type="button"
              onClick={fetchDoiMetadata}
              disabled={doiLoading || !formData.doi}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {doiLoading ? '🔄' : '🔍'} Buscar Metadados
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Produto *
          </label>
          <select
            value={formData.product_type}
            onChange={(e) => setFormData({...formData, product_type: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Selecione um tipo</option>
            {PRODUCT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Autores *
          </label>
          {formData.authors.map((author, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={author}
                onChange={(e) => handleArrayChange('authors', index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do autor"
              />
              {formData.authors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('authors', index)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  ❌
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('authors')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Adicionar Autor
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resumo *
          </label>
          <textarea
            value={formData.abstract}
            onChange={(e) => setFormData({...formData, abstract: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={6}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ano de Publicação
            </label>
            <input
              type="number"
              value={formData.publication_year}
              onChange={(e) => setFormData({...formData, publication_year: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1900"
              max="2030"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Revista/Conferência
            </label>
            <input
              type="text"
              value={formData.journal}
              onChange={(e) => setFormData({...formData, journal: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Palavras-chave
          </label>
          {formData.keywords.map((keyword, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => handleArrayChange('keywords', index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Palavra-chave"
              />
              {formData.keywords.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('keywords', index)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  ❌
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('keywords')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Adicionar Palavra-chave
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL Externa
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({...formData, url: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo do Documento (PDF, DOC, DOCX - Max 10MB)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFiles({...files, document_file: e.target.files[0]})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo de Áudio (WAV - Max 10MB)
            </label>
            <input
              type="file"
              accept=".wav"
              onChange={(e) => setFiles({...files, audio_file: e.target.files[0]})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Produto'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

const NewsForm = ({ news, onSave, onCancel, token }) => {
  const [formData, setFormData] = useState({
    title: news?.title || '',
    content: news?.content || '',
    category: news?.category || 'Geral',
    author: news?.author || 'Cotidiano em Debate'
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('author', formData.author);
      
      if (imageFile) {
        formDataToSend.append('image_file', imageFile);
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (news) {
        // Update existing news (if needed in the future)
        await axios.put(`${API_URL}/api/news/${news.id}`, formDataToSend, config);
      } else {
        await axios.post(`${API_URL}/api/news`, formDataToSend, config);
      }

      onSave();
    } catch (error) {
      console.error('Error saving news:', error);
      
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        window.location.reload();
      } else {
        const errorMessage = error.response?.data?.detail || error.message || 'Erro desconhecido';
        alert('Erro ao salvar notícia: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Geral',
    'Tecnologia', 
    'Funcionalidade',
    'Evento',
    'Publicação',
    'Atualização'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {news ? 'Editar Notícia' : 'Nova Notícia'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            placeholder="Título da notícia"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Autor *
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({...formData, author: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Nome do autor"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📷 Imagem da Notícia (JPG, PNG - Max 5MB)
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.gif"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Opcional: Adicione uma imagem para ilustrar a notícia
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conteúdo *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            rows={8}
            required
            placeholder="Escreva o conteúdo da notícia aqui..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Notícia'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

const EnsinoForm = ({ ensino, onSave, onCancel, token }) => {
  const [formData, setFormData] = useState({
    title: ensino?.title || '',
    description: ensino?.description || '',
    subject: ensino?.subject || '',
    tipo: ensino?.tipo || 'Slides',
    video_url: ensino?.video_url || ''
  });
  const [files, setFiles] = useState({
    material_file: null,
    image_file: null
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('tipo', formData.tipo);
      if (formData.video_url) formDataToSend.append('video_url', formData.video_url);
      
      if (files.material_file) formDataToSend.append('material_file', files.material_file);
      if (files.image_file) formDataToSend.append('image_file', files.image_file);

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      await axios.post(`${API_URL}/api/ensino`, formDataToSend, config);
      onSave();
    } catch (error) {
      alert('Erro ao salvar material: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const tipos = ['Slides', 'Videoaula', 'Material Complementar', 'Exercícios', 'Apostila'];

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {ensino ? 'Editar Material de Ensino' : 'Novo Material de Ensino'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Título do material"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matéria *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Nome da matéria/disciplina"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Material *
          </label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({...formData, tipo: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {tipos.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            rows={4}
            required
            placeholder="Descrição do material educacional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🎬 URL do Vídeo (YouTube, Vimeo, etc.)
          </label>
          <input
            type="url"
            value={formData.video_url}
            onChange={(e) => setFormData({...formData, video_url: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-sm text-gray-500 mt-1">
            Opcional: Link para videoaula ou material complementar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📁 Arquivo do Material (PDF, PPT, DOC - Max 10MB)
            </label>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
              onChange={(e) => setFiles({...files, material_file: e.target.files[0]})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🖼️ Imagem de Capa (JPG, PNG - Max 5MB)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif"
              onChange={(e) => setFiles({...files, image_file: e.target.files[0]})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Material'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

const ExtensaoForm = ({ extensao, onSave, onCancel, token }) => {
  const [formData, setFormData] = useState({
    title: extensao?.title || '',
    description: extensao?.description || '',
    location: extensao?.location || '',
    tipo: extensao?.tipo || 'Projeto Social',
    event_date: extensao?.event_date ? extensao.event_date.split('T')[0] : '',
    video_url: extensao?.video_url || ''
  });
  const [files, setFiles] = useState({
    material_file: null,
    image_file: null
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('tipo', formData.tipo);
      if (formData.event_date) formDataToSend.append('event_date', formData.event_date);
      if (formData.video_url) formDataToSend.append('video_url', formData.video_url);
      
      if (files.material_file) formDataToSend.append('material_file', files.material_file);
      if (files.image_file) formDataToSend.append('image_file', files.image_file);

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      await axios.post(`${API_URL}/api/extensao`, formDataToSend, config);
      onSave();
    } catch (error) {
      alert('Erro ao salvar atividade: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const tipos = ['Projeto Social', 'Evento', 'Workshop', 'Palestra', 'Curso', 'Consultoria'];

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {extensao ? 'Editar Atividade de Extensão' : 'Nova Atividade de Extensão'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Título da atividade"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Local *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Local do evento/atividade"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Atividade *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {tipos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data do Evento
            </label>
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({...formData, event_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            rows={4}
            required
            placeholder="Descrição da atividade de extensão"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🎬 URL do Vídeo (YouTube, Vimeo, etc.)
          </label>
          <input
            type="url"
            value={formData.video_url}
            onChange={(e) => setFormData({...formData, video_url: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-sm text-gray-500 mt-1">
            Opcional: Link para vídeo da atividade
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📁 Material da Atividade (PDF, PPT, DOC - Max 10MB)
            </label>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
              onChange={(e) => setFiles({...files, material_file: e.target.files[0]})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Opcional: Arquivo com materiais da atividade
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🖼️ Imagem da Atividade (JPG, PNG - Max 5MB)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif"
              onChange={(e) => setFiles({...files, image_file: e.target.files[0]})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Opcional: Foto da atividade ou evento
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Atividade'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

const PasswordChangeForm = ({ token }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (formData.new_password !== formData.confirm_password) {
      setError('As senhas não conferem');
      setLoading(false);
      return;
    }

    if (formData.new_password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios.post(`${API_URL}/api/auth/change-password`, {
        current_password: formData.current_password,
        new_password: formData.new_password
      }, config);

      setMessage('Senha alterada com sucesso!');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.response?.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.reload();
        }, 2000);
      } else if (error.response?.status === 400) {
        setError('Senha atual incorreta');
      } else {
        const errorMessage = error.response?.data?.detail || error.message || 'Erro desconhecido';
        setError('Erro ao alterar senha: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">Alterar Senha</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha Atual *
          </label>
          <input
            type="password"
            value={formData.current_password}
            onChange={(e) => setFormData({...formData, current_password: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nova Senha *
          </label>
          <input
            type="password"
            value={formData.new_password}
            onChange={(e) => setFormData({...formData, new_password: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            minLength={6}
          />
          <p className="text-sm text-gray-500 mt-1">Mínimo de 6 caracteres</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Nova Senha *
          </label>
          <input
            type="password"
            value={formData.confirm_password}
            onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {message && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </form>
    </div>
  );
};

const AdminPanel = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [news, setNews] = useState([]);
  const [ensino, setEnsino] = useState([]);
  const [extensao, setExtensao] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingEnsino, setEditingEnsino] = useState(null);
  const [showEnsinoForm, setShowEnsinoForm] = useState(false);
  const [editingExtensao, setEditingExtensao] = useState(null);
  const [showExtensaoForm, setShowExtensaoForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, newsRes, ensinoRes, extensaoRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`),
        axios.get(`${API_URL}/api/news`),
        axios.get(`${API_URL}/api/ensino`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/extensao`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/stats`)
      ]);
      
      setProducts(productsRes.data);
      setNews(newsRes.data);
      setEnsino(ensinoRes.data);
      setExtensao(extensaoRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      await axios.delete(`${API_URL}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      alert('Erro ao excluir produto: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteNews = async (newsId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta notícia?')) return;

    try {
      await axios.delete(`${API_URL}/api/news/${newsId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      alert('Erro ao excluir notícia: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteEnsino = async (ensinoId) => {
    if (!window.confirm('Tem certeza que deseja excluir este material de ensino?')) return;

    try {
      await axios.delete(`${API_URL}/api/ensino/${ensinoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      alert('Erro ao excluir material: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteExtensao = async (extensaoId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta atividade de extensão?')) return;

    try {
      await axios.delete(`${API_URL}/api/extensao/${extensaoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      alert('Erro ao excluir atividade: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleProductSave = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    loadData();
  };

  const handleNewsSave = () => {
    setShowNewsForm(false);
    setEditingNews(null);
    loadData();
  };

  const handleEnsinoSave = () => {
    setShowEnsinoForm(false);
    setEditingEnsino(null);
    loadData();
  };

  const handleExtensaoSave = () => {
    setShowExtensaoForm(false);
    setEditingExtensao(null);
    loadData();
  };

  // Check if token is still valid
  const checkTokenValidity = async () => {
    try {
      await axios.get(`${API_URL}/api/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        window.location.reload();
        return false;
      }
      return true;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="text-xl">Carregando...</div>
    </div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Painel Administrativo</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentTab('ensino')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentTab === 'ensino' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📚 Ensino
          </button>
          <button
            onClick={() => setCurrentTab('products')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔬 Pesquisa
          </button>
          <button
            onClick={() => setCurrentTab('extensao')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentTab === 'extensao' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🤝 Extensão
          </button>
          <button
            onClick={() => setCurrentTab('news')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentTab === 'news' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Notícias
          </button>
          <button
            onClick={() => setCurrentTab('settings')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Configurações
          </button>
        </div>
      </div>

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleProductSave}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          token={token}
        />
      )}

      {showNewsForm && (
        <NewsForm
          news={editingNews}
          onSave={handleNewsSave}
          onCancel={() => {
            setShowNewsForm(false);
            setEditingNews(null);
          }}
          token={token}
        />
      )}

      {showEnsinoForm && (
        <EnsinoForm
          ensino={editingEnsino}
          onSave={handleEnsinoSave}
          onCancel={() => {
            setShowEnsinoForm(false);
            setEditingEnsino(null);
          }}
          token={token}
        />
      )}

      {showExtensaoForm && (
        <ExtensaoForm
          extensao={editingExtensao}
          onSave={handleExtensaoSave}
          onCancel={() => {
            setShowExtensaoForm(false);
            setEditingExtensao(null);
          }}
          token={token}
        />
      )}

      {!showProductForm && !showNewsForm && !showEnsinoForm && !showExtensaoForm && (
        <>
          {currentTab === 'dashboard' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Total de Produtos</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.total_products}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Total de Notícias</h3>
                <p className="text-3xl font-bold text-green-600">{stats.total_news}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Tipos de Produtos</h3>
                <div className="space-y-1">
                  {Object.entries(stats.product_types).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-gray-600">{type}:</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">Gerenciar Produtos</h3>
                <button
                  onClick={() => setShowProductForm(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Novo Produto
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Autores
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Visualizações
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {product.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {product.product_type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 line-clamp-1">
                              {product.authors.join(', ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.view_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setShowProductForm(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'ensino' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">📚 Gerenciar Materiais de Ensino</h3>
                <button 
                  onClick={() => setShowEnsinoForm(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  + Novo Material
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Matéria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ensino.map((ensinoItem) => (
                        <tr key={ensinoItem.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {ensinoItem.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {ensinoItem.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {ensinoItem.subject}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(ensinoItem.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingEnsino(ensinoItem);
                                setShowEnsinoForm(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteEnsino(ensinoItem.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {ensino.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-600">Nenhum material criado</h3>
                    <p className="text-gray-500 mb-4">
                      Crie seu primeiro material de ensino clicando no botão acima.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === 'extensao' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">🤝 Gerenciar Atividades de Extensão</h3>
                <button 
                  onClick={() => setShowExtensaoForm(true)}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  + Nova Atividade
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Local
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {extensao.map((extensaoItem) => (
                        <tr key={extensaoItem.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {extensaoItem.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              {extensaoItem.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {extensaoItem.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {extensaoItem.event_date ? new Date(extensaoItem.event_date).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingExtensao(extensaoItem);
                                setShowExtensaoForm(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteExtensao(extensaoItem.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {extensao.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🤝</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-600">Nenhuma atividade criada</h3>
                    <p className="text-gray-500 mb-4">
                      Crie sua primeira atividade de extensão clicando no botão acima.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === 'news' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">Gerenciar Notícias</h3>
                <button 
                  onClick={() => setShowNewsForm(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Nova Notícia
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Autor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {news.map((newsItem) => (
                        <tr key={newsItem.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {newsItem.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {newsItem.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {newsItem.author}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(newsItem.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingNews(newsItem);
                                setShowNewsForm(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteNews(newsItem.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {news.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📰</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-600">Nenhuma notícia criada</h3>
                    <p className="text-gray-500 mb-4">
                      Crie sua primeira notícia clicando no botão acima.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === 'settings' && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Configurações do Sistema</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <PasswordChangeForm token={token} />
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h4 className="text-xl font-semibold mb-4 text-gray-800">Informações do Sistema</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Repositório:</span>
                      <span className="font-semibold">Cotidiano em Debate</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Versão:</span>
                      <span className="font-semibold">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Usuário Logado:</span>
                      <span className="font-semibold">marc0_santos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última Atualização:</span>
                      <span className="font-semibold">{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h5 className="text-lg font-semibold mb-3 text-gray-800">Funcionalidades Ativas</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">Sistema de Upload de Arquivos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">Integração DOI CrossRef</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">Player de Áudio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">Compartilhamento Social</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">Sistema de Notícias com Imagens</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [news, setNews] = useState([]);
  const [ensino, setEnsino] = useState([]);
  const [selectedEnsino, setSelectedEnsino] = useState(null);
  const [extensao, setExtensao] = useState([]);
  const [selectedExtensao, setSelectedExtensao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [filters, setFilters] = useState({
    search: '',
    productType: '',
    author: '',
    year: ''
  });

  useEffect(() => {
    if (currentView === 'products' || currentView === 'home') {
      loadProducts();
    }
    if (currentView === 'home') {
      loadNews();
    }
    if (currentView === 'ensino') {
      loadEnsino();
    }
    if (currentView === 'extensao') {
      loadExtensao();
    }
  }, [currentView]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        params: {
          product_type: filters.productType || undefined,
          search: filters.search || undefined,
          author: filters.author || undefined,
          year: filters.year || undefined
        }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNews = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/news`);
      setNews(response.data);
    } catch (error) {
      console.error('Error loading news:', error);
    }
  };

  const loadEnsino = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ensino`);
      setEnsino(response.data);
    } catch (error) {
      console.error('Error loading ensino:', error);
    }
  };

  const loadExtensao = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/extensao`);
      setExtensao(response.data);
    } catch (error) {
      console.error('Error loading extensao:', error);
    }
  };

  const handleSearch = () => {
    loadProducts();
  };

  const handleLogin = (newToken) => {
    setToken(newToken);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentView('home');
  };

  const handleProductClick = async (product) => {
    try {
      const response = await axios.get(`${API_URL}/api/products/${product.id}`);
      setSelectedProduct(response.data);
    } catch (error) {
      console.error('Error loading product details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAuthenticated={!!token}
        logout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8">
        {currentView === 'home' && (
          <div>
            {selectedProduct ? (
              <ProductDetail
                product={selectedProduct}
                onBack={() => setSelectedProduct(null)}
              />
            ) : selectedNews ? (
              <NewsDetail
                news={selectedNews}
                onBack={() => setSelectedNews(null)}
              />
            ) : (
              <div>
                {/* News Section - PRIMEIRO */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📰 Últimas Notícias e Atualizações</h2>
                  </div>
                  {news.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {news.slice(0, 6).map((newsItem) => (
                        <NewsCard key={newsItem.id} newsItem={newsItem} onClick={() => setSelectedNews(newsItem)} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <div className="text-gray-400 text-6xl mb-4">📰</div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-600">Nenhuma notícia ainda</h3>
                      <p className="text-gray-500">
                        As últimas atualizações e notícias serão publicadas aqui.
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent Products - SEGUNDO (mais embaixo) */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Produtos Recentes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.slice(0, 6).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={handleProductClick}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'products' && (
          <div>
            {selectedProduct ? (
              <ProductDetail
                product={selectedProduct}
                onBack={() => setSelectedProduct(null)}
              />
            ) : (
              <div>
                {/* Hero Section transferida da página inicial */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-8 mb-8">
                  <div className="max-w-3xl">
                    <h1 className="text-4xl font-bold mb-4">
                      Repositório Cotidiano em Debate
                    </h1>
                    <p className="text-xl mb-6">
                      Explore nossa coleção de artigos científicos, projetos, livros e outros produtos acadêmicos.
                      Navegue por categoria, busque por palavras-chave ou autores.
                    </p>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Produtos Acadêmicos</h1>
                
                {/* Product Types Grid */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4 text-gray-700">Explorar por Categoria</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {PRODUCT_TYPES.map((type, index) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilters({...filters, productType: type});
                          loadProducts();
                        }}
                        className={`bg-white rounded-lg p-4 text-center hover:shadow-lg transition-shadow border border-gray-200 ${
                          filters.productType === type ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                      >
                        <div className="text-2xl mb-2">
                          {['📄', '📝', '🔬', '📚', '📖', '🎥'][index]}
                        </div>
                        <div className="text-sm font-medium text-gray-700">{type}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <SearchFilter
                  filters={filters}
                  setFilters={setFilters}
                  onSearch={handleSearch}
                />

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-xl">Carregando...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={handleProductClick}
                      />
                    ))}
                  </div>
                )}

                {products.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">
                      Nenhum produto encontrado. Ajuste seus filtros ou try again.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentView === 'ensino' && (
          <div>
            {selectedEnsino ? (
              <EnsinoDetail
                ensino={selectedEnsino}
                onBack={() => setSelectedEnsino(null)}
              />
            ) : (
              <div>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-2xl p-8 mb-8">
                  <div className="max-w-3xl">
                    <h1 className="text-4xl font-bold mb-4">
                      📚 Materiais de Ensino
                    </h1>
                    <p className="text-xl mb-6">
                      Acesse slides, videoaulas e outros materiais educacionais desenvolvidos pelo pesquisador. 
                      Recursos organizados por disciplina e tema para facilitar o aprendizado.
                    </p>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Materiais Educacionais</h1>
                
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-xl">Carregando...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ensino.map((ensinoItem) => (
                      <EnsinoCard
                        key={ensinoItem.id}
                        ensinoItem={ensinoItem}
                        onClick={() => setSelectedEnsino(ensinoItem)}
                      />
                    ))}
                  </div>
                )}

                {ensino.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-600">Nenhum material ainda</h3>
                    <p className="text-gray-500 text-lg">
                      Os materiais de ensino serão publicados aqui.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentView === 'extensao' && (
          <div>
            {selectedExtensao ? (
              <ExtensaoDetail
                extensao={selectedExtensao}
                onBack={() => setSelectedExtensao(null)}
              />
            ) : (
              <div>
                <div className="bg-gradient-to-r from-orange-600 to-red-700 text-white rounded-2xl p-8 mb-8">
                  <div className="max-w-3xl">
                    <h1 className="text-4xl font-bold mb-4">
                      🤝 Atividades de Extensão
                    </h1>
                    <p className="text-xl mb-6">
                      Conheça as atividades de extensão, projetos sociais, eventos e outras iniciativas 
                      que conectam a universidade com a comunidade.
                    </p>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Projetos e Atividades</h1>
                
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-xl">Carregando...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {extensao.map((extensaoItem) => (
                      <ExtensaoCard
                        key={extensaoItem.id}
                        extensaoItem={extensaoItem}
                        onClick={() => setSelectedExtensao(extensaoItem)}
                      />
                    ))}
                  </div>
                )}

                {extensao.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🤝</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-600">Nenhuma atividade ainda</h3>
                    <p className="text-gray-500 text-lg">
                      As atividades de extensão serão publicadas aqui.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentView === 'login' && (
          <LoginForm onLogin={handleLogin} />
        )}

        {currentView === 'admin' && token && (
          <AdminPanel token={token} />
        )}
      </main>
    </div>
  );
}

export default App;