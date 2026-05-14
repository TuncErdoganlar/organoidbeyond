// src/main.tsx
// -----------------------------------------------------------------------------
// React entrypoint. In Step 1 this only mounts a placeholder <App/>; in Step 2
// we'll wrap it with providers (e.g., a QueryClientProvider, ThemeProvider).
// -----------------------------------------------------------------------------

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
