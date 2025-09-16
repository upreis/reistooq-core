import React from 'react';

// Emergency fallback App without any providers or hooks
function FallbackApp() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '1rem 2rem',
        borderBottom: '1px solid #404040'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>REISTOQ</h1>
      </div>
      
      <div style={{ 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center' as const,
        padding: '2rem'
      }}>
        <div>
          <div style={{ 
            fontSize: '4rem',
            marginBottom: '1rem',
            color: '#ef4444'
          }}>⚠️</div>
          <h2 style={{ 
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: '#ffffff'
          }}>Sistema em Manutenção</h2>
          <p style={{ 
            color: '#a0a0a0',
            maxWidth: '500px',
            lineHeight: 1.6
          }}>
            O sistema está temporariamente indisponível devido a problemas técnicos. 
            Nossa equipe está trabalhando para resolver o problema o mais rápido possível.
          </p>
          <div style={{ 
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            border: '1px solid #404040'
          }}>
            <strong>Status:</strong> Detectado problema com o contexto React<br/>
            <strong>Ação:</strong> Reinicialização do sistema em andamento
          </div>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: '#2a2a2a',
        padding: '1rem 2rem',
        borderTop: '1px solid #404040',
        textAlign: 'center' as const,
        color: '#a0a0a0',
        fontSize: '0.875rem'
      }}>
        © 2024 REISTOQ - Sistema de Gestão de Estoque
      </div>
    </div>
  );
}

export default FallbackApp;