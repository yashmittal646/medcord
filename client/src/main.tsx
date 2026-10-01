import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import { loadLanguage } from './i18n/index.js';

// Start downloading the saved language's dictionary before React even starts
try {
  const saved = localStorage.getItem('FollowUp_language');
  if (saved) void loadLanguage(saved as any).catch(() => undefined);
} catch {
  /* storage blocked: English until the visitor picks a language */
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
