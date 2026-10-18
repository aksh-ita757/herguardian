// ============================================
// HerGuardian — React App Entry Point
// Technology: React 18 + React Router v6
// ============================================

import './config.js';            // must load first: sets the API base URL
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './assets/css/global.css';
import { AuthProvider } from './context/AuthContext.jsx';

// ReactDOM.createRoot is the React 18 way to mount your app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter enables React Router navigation */}
    <BrowserRouter>
      {/* AuthProvider gives all components access to login state */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
