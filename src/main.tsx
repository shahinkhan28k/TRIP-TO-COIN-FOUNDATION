import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SecurityGuard } from './components/SecurityGuard.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecurityGuard>
      <App />
    </SecurityGuard>
  </StrictMode>,
);
