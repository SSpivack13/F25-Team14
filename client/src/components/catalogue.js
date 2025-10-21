import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { appInfo } from '../appInfo';
import Banner from './Banner';

function Catalogue() {
  const [catalogue, setCatalogue] = useState([]);
  const [error, setError] = useState('');
  const dollartopointrate = 100;

  useEffect(() => {
    let mounted = true;
    async function fetchProducts() {
      try {
        const res = await axios.get('https://fakestoreapi.com/products');
        if (mounted) setCatalogue(res.data || []);
      } catch (err) {
        console.error('Failed to fetch products', err);
        if (mounted) setError('Failed to load products');
      }
    }
    fetchProducts();
    return () => { mounted = false; };
  }, []);

  return (
    
    <div style={{ padding: '1rem' }}>
        <Banner />
      <h1>Catalogue</h1>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {catalogue.map(product => (
          <div key={product.id} style={{
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: '0.75rem',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            <div style={{ flex: '0 0 150px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <img src={product.image} alt={product.title} style={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain' }} />
            </div>
            <h3 style={{ fontSize: '1rem', margin: '0.25rem 0' }}>{product.title}</h3>
            <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{product.category}</div>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{Number(product.price).toFixed(2)*dollartopointrate} points</div>
            <p style={{ fontSize: '0.9rem', color: '#333', marginTop: 'auto' }}>{product.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Catalogue;