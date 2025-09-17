import React from 'react';
import { Routes, Route } from "react-router-dom";

function MinimalApp() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: '#ffffff',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <h1>🚀 Sistema Carregando</h1>
      <p>Aplicação em modo minimal para resolver conflitos do React.</p>
      <div style={{ marginTop: '2rem' }}>
        <p>Rota atual: {window.location.pathname}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '0.5rem 1rem', 
            marginTop: '1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Recarregar Sistema
        </button>
      </div>
    </div>
  );
}

export default MinimalApp;