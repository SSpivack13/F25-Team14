import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import './Template.css';
import Banner from './components/Banner';

function CatalogPage() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      <Banner />
      <div className="template-content">
        <div className="template-card">
          <h1>Catalog</h1>
          <p>Catalog content coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default CatalogPage;
