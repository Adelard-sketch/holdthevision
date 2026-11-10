import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Join from './pages/Join.jsx';
import Host from './pages/Host.jsx';
import Player from './pages/Player.jsx';
import Debrief from './pages/Debrief.jsx';
import './styles.css';

// Hash routes (#/host/ABCDE) work from any folder without server rewrites.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join/:code" element={<Join />} />
        <Route path="/host/:code" element={<Host />} />
        <Route path="/play/:code" element={<Player />} />
        <Route path="/debrief/:code" element={<Debrief />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
