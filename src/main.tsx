import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize theme immediately on load
const savedTheme = localStorage.getItem('nado_prazdnik_theme') || localStorage.getItem('nado_holiday_theme') || localStorage.getItem('evently_theme');
if (savedTheme === 'dark' || (savedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
  document.documentElement.setAttribute('data-theme', 'dark');
} else {
  document.documentElement.classList.remove('dark');
  document.documentElement.setAttribute('data-theme', 'light');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
