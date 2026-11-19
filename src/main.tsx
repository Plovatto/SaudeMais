import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@app/App';
import { startAnalytics } from '@lib/analytics';
import { followSystemTheme } from '@lib/theme';
import '@/styles/index.css';

followSystemTheme();
startAnalytics();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
