import React from 'react';

// Simple debug app to test React hooks without any dependencies
export default function DebugApp() {
  console.log('DebugApp: React object:', React);
  console.log('DebugApp: useState function:', React.useState);
  console.log('DebugApp: useEffect function:', React.useEffect);
  
  try {
    const [count, setCount] = React.useState(0);
    
    React.useEffect(() => {
      console.log('DebugApp: useEffect executed successfully');
    }, []);

    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#1a1a1a', 
        color: '#ffffff',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <h1>✅ React Debug App</h1>
        <p>React hooks are working correctly!</p>
        <p>Count: {count}</p>
        <button 
          onClick={() => setCount(c => c + 1)}
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
          Increment Count
        </button>
      </div>
    );
  } catch (error) {
    console.error('DebugApp: React hooks failed:', error);
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#dc2626', 
        color: '#ffffff',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <h1>❌ React Hooks Failed</h1>
        <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}