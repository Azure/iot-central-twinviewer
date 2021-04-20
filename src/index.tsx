import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Twin from './pages/twin';
import { AuthProvider } from './context/authContext';
import { DeviceProvider } from './context/deviceContext';

import { initializeIcons } from '@fluentui/react/lib/Icons';
initializeIcons();

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider >
      <DeviceProvider>
        <Twin />
      </DeviceProvider>
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
