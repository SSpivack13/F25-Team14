import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { appInfo } from '../appInfo';

//Home page function with dynamic information taken from the database
function HomePage() {
  const [aboutInfo, setAboutInfo] = useState(null);
  const [error, setError] = useState('');

  //Grabs information from the database for the about page, otherwise throws an error if unsuccessful
  useEffect(() => {
    const fetchAboutInfo = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API}/about`);
        if (response.data.status === 'success') {
          setAboutInfo(response.data.data);
        } else {
          setError(response.data.message || 'Could not fetch project information.');
        }
      } catch (err) {
        setError('Failed to connect to the server. Please try again later.');
        console.error('Error fetching about info:', err);
      }
    };

    fetchAboutInfo();
  }, []);

  return (
    <div className="template-content">
      {error && <div className="template-card"><p className="template-alert template-alert-error">{error}</p></div>}
      {!aboutInfo && !error && <div className="template-card"><p>Loading project information...</p></div>}
      {aboutInfo && (
        <div className="template-card">
          <h2>{aboutInfo.PROD_NAME}</h2>
          <p>{aboutInfo.PROD_DESC}</p>
          <br />
          <p>
            <strong>Version:</strong> {aboutInfo.SPRINT} <br />
            <strong>Release Date:</strong> {new Date(aboutInfo.RELEASE_DATE).toLocaleDateString()} <br />
            <strong>Team:</strong> #{aboutInfo.TEAM}
          </p>
        </div>
      )}
      <div className="template-card">
        <h2>Team 14 Members:</h2>
        <p>
          {appInfo.teamMembers.map((member, index) => (
            <span key={index}>
              {member}
              {index < appInfo.teamMembers.length - 1 && <br />}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

export default HomePage;
