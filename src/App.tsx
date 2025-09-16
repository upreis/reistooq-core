import React from 'react';
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Routes>
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">REISTOQ</h1>
              <p className="text-gray-600">Sistema funcionando...</p>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;