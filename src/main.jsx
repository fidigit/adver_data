import React from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './styles.css';
import { Application } from './App.jsx';
createRoot(document.getElementById('root')).render(<Application />);
