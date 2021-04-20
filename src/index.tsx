import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Twin from './pages/twin';
import { AuthProvider } from './shared/authContext';

import { initializeIcons } from '@fluentui/react/lib/Icons';
initializeIcons();

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider >
      <Twin />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
