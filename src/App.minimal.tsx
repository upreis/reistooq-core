import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

// Componente minimalista para testar se React funciona
function TestPage() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f172a', 
      color: '#ffffff',
      padding: '2rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <nav style={{ marginBottom: '2rem', borderBottom: '1px solid #374151', paddingBottom: '1rem' }}>
        <Link to="/" style={{ color: '#3b82f6', marginRight: '1rem', textDecoration: 'none' }}>Home</Link>
        <Link to="/test" style={{ color: '#3b82f6', marginRight: '1rem', textDecoration: 'none' }}>Test</Link>
        <Link to="/admin" style={{ color: '#3b82f6', textDecoration: 'none' }}>Admin</Link>
      </nav>
      
      <h1>✅ REISTOQ - Sistema Funcionando</h1>
      <p>Rota atual: {location.pathname}</p>
      <p>Contador: {count}</p>
      
      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={() => setCount(c => c + 1)}
          style={{ 
            padding: '0.5rem 1rem', 
            marginRight: '1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Incrementar (+)
        </button>
        
        <button 
          onClick={() => navigate('/admin')}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Ir para Admin
        </button>
      </div>
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#1e293b', 
        borderRadius: '8px',
        border: '1px solid #374151'
      }}>
        <h3>Status do Sistema:</h3>
        <p>✅ React Hooks: Funcionando</p>
        <p>✅ React Router: Funcionando</p>
        <p>✅ Estado Local: Funcionando</p>
        <p>✅ Navegação: Funcionando</p>
      </div>
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f172a', 
      color: '#ffffff',
      padding: '2rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <nav style={{ marginBottom: '2rem', borderBottom: '1px solid #374151', paddingBottom: '1rem' }}>
        <Link to="/" style={{ color: '#3b82f6', marginRight: '1rem', textDecoration: 'none' }}>Home</Link>
        <Link to="/test" style={{ color: '#3b82f6', marginRight: '1rem', textDecoration: 'none' }}>Test</Link>
        <Link to="/admin" style={{ color: '#3b82f6', textDecoration: 'none' }}>Admin</Link>
      </nav>
      
      <h1>🛡️ Painel Administrativo</h1>
      <p>Esta é a página de administração simplificada.</p>
      
      <button 
        onClick={() => navigate('/')}
        style={{ 
          padding: '0.5rem 1rem', 
          marginTop: '1rem',
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Voltar ao Home
      </button>
    </div>
  );
}

export default function AppMinimal() {
  return (
    <Routes>
      <Route path="/" element={<TestPage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<TestPage />} />
    </Routes>
  );
}