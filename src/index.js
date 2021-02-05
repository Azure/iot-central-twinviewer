import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Twin from './twin';
import { AuthProvider } from './shared/authContext';

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider >
      <Twin />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
