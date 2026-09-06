import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA support and offline access only in production
if (import.meta.env.PROD && 'serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('PrimeWay PWA Service Worker registrado com sucesso:', registration.scope);
      })
      .catch((error) => {
        console.warn('Falha ao registrar Service Worker do PrimeWay PWA:', error);
      });
  });
} else if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  // In development, unregister any stale service workers to prevent cached chunk conflicts
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
