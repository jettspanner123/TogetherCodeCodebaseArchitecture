import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/Index.css';

const rootElement = document.getElementById('Root');
if (!rootElement) {
  throw new Error('Failed to find Root container element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
