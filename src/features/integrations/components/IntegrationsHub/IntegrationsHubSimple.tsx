// Simple debug version to isolate React hooks issue
import React, { useState } from 'react';

console.log('IntegrationsHubSimple: file loaded');

export const IntegrationsHubSimple: React.FC = () => {
  console.log('IntegrationsHubSimple: component render started');
  
  try {
    const [test, setTest] = useState('working');
    console.log('IntegrationsHubSimple: useState worked, value:', test);
    
    return (
      <div>
        <h1>Simple Test Component</h1>
        <p>State value: {test}</p>
        <button onClick={() => setTest('clicked')}>Test Button</button>
      </div>
    );
  } catch (error) {
    console.error('IntegrationsHubSimple: Error in component:', error);
    return <div>Error in simple component: {String(error)}</div>;
  }
};