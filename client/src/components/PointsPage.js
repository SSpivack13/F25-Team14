import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PointsPage() {
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = JSON.parse(localStorage.getItem('user'));
  useEffect(() => {
    if (!isLoggedIn || !user) {
      navigate('/login');
      return;
    }
    const fetchPoints = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}/users/${user.USER_ID}/points`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch points');
        }
        const data = await response.json();
        if (data.status === 'success') {
          setPointsData(data.data);
        } else {
          throw new Error(data.message || 'An unknown error occurred');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, [isLoggedIn, user, navigate]);
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    navigate('/');
  };
  if (loading) {
    return <div>Loading points...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}} >
      <h1>Your Points</h1>
      <h2>You currently have <strong>{pointsData?.points ?? 0}</strong> points.</h2>
      <button onClick={() => navigate('/profile')}>Profile</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default PointsPage;
