import * as React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const SimpleRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<div>Simple Router Working!</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default SimpleRouter;