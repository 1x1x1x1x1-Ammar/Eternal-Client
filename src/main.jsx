import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import './v05.css';
import './release.css';
import './beta6.css';
import './beta6-core.css';
import './beta7-core.css';
import './beta8.css';
import './beta8-polish.css';
import './premium.css';
import './v1.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><HashRouter><App /></HashRouter></React.StrictMode>
);
