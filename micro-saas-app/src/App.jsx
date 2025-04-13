import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './features/auth/Login';
import LinkForm from './features/links/LinkForm';
import AnalyticsDashboard from './features/analytics/AnalyticsDashboard';
import QrCodePage from './features/QrCodePage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/create" element={<LinkForm />} />
        <Route path="/dashboard" element={<AnalyticsDashboard />} />
        <Route path="/qr/:shortUrl" element={<QrCodePage />} />
      </Routes>
    </Router>
  );
};

export default App;
