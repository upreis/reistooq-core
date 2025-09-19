import * as React from 'react';

function MinimalApp() {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('Minimal app loaded successfully');
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Minimal React Test</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
      <p>If you see this, React is working!</p>
    </div>
  );
}

export default MinimalApp;