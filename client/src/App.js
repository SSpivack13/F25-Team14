import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { appInfo } from './appInfo';
import './Template.css';
import axios from 'axios';
function Banner() {
  const navigate = useNavigate();
  const goManager = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login', { state: { redirectTo: '/profile' } });
    }
  };
  const goSponsor = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/sponsor');
    } else {
      navigate('/login', { state: { redirectTo: '/sponsor' } });
    }
  };
  const goAdmin = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/admin');
    } else {
      navigate('/login', { state: { redirectTo: '/admin' } });
    }
  };

  return (
    <div className="banner">
          <h1>Talladega Nights</h1>
          <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => navigate('/')}>Home</button>
              <button onClick={goManager}>Manager Profile</button>
              <button onClick={goSponsor}>Sponsor Profile</button>
              <button onClick={goAdmin}>Admin Profile</button>
          </div>
    </div>
  );
}

function HomePage() {
  const [aboutInfo, setAboutInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAboutInfo = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/about');
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

function LoginPage() {
  const location = useLocation();
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  // Derive title based on where user is coming from
  const intendedRoute = location.state?.redirectTo;
  const loginTitle = intendedRoute === '/profile'
    ? 'Manager Login'
    : intendedRoute === '/sponsor'
      ? 'Sponsor Login'
      : intendedRoute === '/admin'
        ? 'Admin Login'
        : 'Login';
  const expectedRole = intendedRoute === '/profile' ? 'manager'
    : intendedRoute === '/sponsor' ? 'sponsor'
    : intendedRoute === '/admin'? 'admin'
    : undefined;

  // Client-side demo users for showcasing functionality
  const demoUsers = {
    manager: { password: 'password', USER_TYPE: 'manager' },
    sponsor: { password: 'password', USER_TYPE: 'sponsor' },
    admin: { password: 'password', USER_TYPE: 'admin' },
  };

  const handleInputChange = (field, value) => {
    setLoginForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Convenience: demo autofill helpers
  const useManagerDemo = () => {
    setLoginForm({ username: 'manager', password: 'password' });
  };
  const useSponsorDemo = () => {
    setLoginForm({ username: 'sponsor', password: 'password' });
  };
  const useAdminDemo = () => {
    setLoginForm({ username: 'admin', password: 'password' });
  };

  const handleLogin = async () => {
    // really simple and bare bone login feature
    if (!loginForm.username.trim()) {
      setMessage('Username is required');
      setMessageType('error');
      return;
    }

    if (!loginForm.password.trim()) {
      setMessage('Password is required');
      setMessageType('error');
      return;
    }

    // If credentials match demo users, bypass backend for demo
    const demo = demoUsers[loginForm.username];
    if (demo && loginForm.password === demo.password) {
      // Enforce role separation for demo logins
      if (expectedRole && demo.USER_TYPE !== expectedRole) {
        setMessage(`Please use ${expectedRole} demo credentials on this page.`);
        setMessageType('error');
        return;
      }
      setMessage('Login successful!');
      setMessageType('success');

      const user = { USERNAME: loginForm.username, USER_TYPE: demo.USER_TYPE };
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(user));

      const redirectTo = location.state?.redirectTo
        || (user?.USER_TYPE === 'sponsor' ? '/sponsor'
            : user?.USER_TYPE === 'admin' ? '/admin'
            : '/profile');
      setTimeout(() => {
        navigate(redirectTo);
      }, 800);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/login', {
        username: loginForm.username,
        password: loginForm.password
      });

      if (response.data.status === 'success') {
        setMessage('Login successful!');
        setMessageType('success');
        
        // Store login state and user data
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        const user = response.data.user;
        const redirectTo = location.state?.redirectTo
          || (user?.USER_TYPE === 'sponsor' ? '/sponsor'
              : user?.USER_TYPE === 'admin' ? '/admin'
              : '/profile');
        setTimeout(() => {
          navigate(redirectTo);
        }, 1000);
      }
    } catch (error) {
      if (error.response) {
        // The server responded with an error (e.g., 401, 400, 500)
        setMessage(error.response.data.message || 'An error occurred during login.');
      } else if (error.request) {
        // The request was made but no response was received
        setMessage('Could not connect to the server. Please try again later.');
      } else {
        // Something else happened while setting up the request
        setMessage('An unexpected error occurred.');
      }
      setMessageType('error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div>
      <Banner />
      <div className="profile-container">
        <div className="profile-header">
          <h1>{loginTitle}</h1>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="profile-edit">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password"
            />
          </div>

          <div className="form-actions">
            <button className="save-btn" onClick={handleLogin}>
              Login
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '0.9rem', color: '#666', display: 'grid', gap: '0.75rem' }}>
            {(loginTitle === 'Login' || loginTitle === 'Manager Login') && (
              <div>
                <strong>Manager Demo:</strong><br />
                Username: <code>manager</code><br />
                Password: <code>password</code><br />
                <button className="save-btn" style={{ marginTop: '0.5rem' }} onClick={useManagerDemo}>
                  Use Manager Demo
                </button>
              </div>
            )}
            {(loginTitle === 'Login' || loginTitle === 'Sponsor Login') && (
              <div>
                <strong>Sponsor Demo:</strong><br />
                Username: <code>sponsor</code><br />
                Password: <code>password</code><br />
                <button className="save-btn" style={{ marginTop: '0.5rem' }} onClick={useSponsorDemo}>
                  Use Sponsor Demo
                </button>
              </div>
            )}
            {(loginTitle === 'Login' || loginTitle === 'Admin Login') && (
              <div>
                <strong>Admin Demo:</strong><br />
                Username: <code>admin</code><br />
                Password: <code>password</code><br />
                <button className="save-btn" style={{ marginTop: '0.5rem' }} onClick={useAdminDemo}>
                  Use Admin Demo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({
    username: 'manager123',
    password: 'password123',
    email: 'manager@talladeganights.com'
  });
  
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });

  // check if user is actually logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  const handleEdit = () => {
    setEditForm({
      username: profile.username,
      password: '',
      confirmPassword: '',
      email: profile.email
    });
    setIsEditing(true);
    setMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      username: '',
      password: '',
      confirmPassword: '',
      email: ''
    });
    setMessage('');
  };

  const handleSave = () => {
    // Validation
    if (!editForm.username.trim()) {
      setMessage('Username is required');
      setMessageType('error');
      return;
    }

    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    if (editForm.email && !editForm.email.includes('@')) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    // Update profile
    const updatedProfile = {
      username: editForm.username,
      password: editForm.password || profile.password,
      email: editForm.email
    };

    setProfile(updatedProfile);
    setIsEditing(false);
    setMessage('Profile updated successfully!');
    setMessageType('success');
    
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div>
      <div className="banner">
              <h1>React App</h1>
              <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleLogout}>Logout</button>
                  <button onClick={() => navigate('/points')}>Points</button>
                </div>
      </div>
      <div className="profile-container">
        <div className="profile-header">
          <h1>Manager Profile</h1>
          {!isEditing && (
            <button className="edit-btn" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-field">
              <label>Username</label>
              <div className="field-value">{profile.username}</div>
            </div>

            <div className="profile-field">
              <label>Password</label>
              <div className="password-field">
                <div className="field-value">
                  {showPassword ? profile.password : '••••••••••'}
                </div>
                <button 
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="profile-field">
              <label>Email</label>
              <div className="field-value">{profile.email || 'Not provided'}</div>
            </div>
          </div>
        ) : (
          <div className="profile-edit">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="password-section">
              <h3>Change Password</h3>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter new password (leave blank to keep current)"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={editForm.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SponsorProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    username: 'sponsor123',
    password: 'password123',
    email: 'sponsor@talladeganights.com',
    phone: ''
  });

  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: ''
  });

  // check if user is actually logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  const handleEdit = () => {
    setEditForm({
      username: profile.username,
      password: '',
      confirmPassword: '',
      email: profile.email,
      phone: profile.phone || ''
    });
    setIsEditing(true);
    setMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      phone: ''
    });
    setMessage('');
  };

  const handleSave = () => {
    // Validation
    if (!editForm.username.trim()) {
      setMessage('Username is required');
      setMessageType('error');
      return;
    }

    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    if (editForm.email && !editForm.email.includes('@')) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    // Optional basic phone validation (digits and common symbols)
    if (editForm.phone && !/^[-+()\s\d]{7,}$/.test(editForm.phone)) {
      setMessage('Please enter a valid phone number');
      setMessageType('error');
      return;
    }

    // Update profile
    const updatedProfile = {
      username: editForm.username,
      password: editForm.password || profile.password,
      email: editForm.email,
      phone: editForm.phone
    };

    setProfile(updatedProfile);
    setIsEditing(false);
    setMessage('Profile updated successfully!');
    setMessageType('success');

    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div>
      <div className="banner">
              <h1>Talladega Nights</h1>
              <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleLogout}>Logout</button>
                  <button onClick={() => navigate('/points')}>Points</button>
                </div>
      </div>
      <div className="profile-container">
        <div className="profile-header">
          <h1>Sponsor Profile</h1>
          {!isEditing && (
            <button className="edit-btn" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-field">
              <label>Username</label>
              <div className="field-value">{profile.username}</div>
            </div>

            <div className="profile-field">
              <label>Password</label>
              <div className="password-field">
                <div className="field-value">
                  {showPassword ? profile.password : '••••••••••'}
                </div>
                <button 
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="profile-field">
              <label>Email</label>
              <div className="field-value">{profile.email || 'Not provided'}</div>
            </div>

            <div className="profile-field">
              <label>Phone</label>
              <div className="field-value">{profile.phone || 'Not provided'}</div>
            </div>
          </div>
        ) : (
          <div className="profile-edit">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="password-section">
              <h3>Change Password</h3>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter new password (leave blank to keep current)"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={editForm.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
                const response = await fetch(`http://localhost:3001/api/users/${user.USER_ID}/points`);
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
    )
}

function AdminProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    username: 'admin123',
    password: 'password123',
    email: 'admin@talladeganights.com',
    phone: ''
  });

  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: ''
  });

  // check if user is actually logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  const handleEdit = () => {
    setEditForm({
      username: profile.username,
      password: '',
      confirmPassword: '',
      email: profile.email,
      phone: profile.phone || ''
    });
    setIsEditing(true);
    setMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      phone: ''
    });
    setMessage('');
  };

  const handleSave = () => {
    // Validation
    if (!editForm.username.trim()) {
      setMessage('Username is required');
      setMessageType('error');
      return;
    }

    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    if (editForm.email && !editForm.email.includes('@')) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    // Optional basic phone validation (digits and common symbols)
    if (editForm.phone && !/^[-+()\s\d]{7,}$/.test(editForm.phone)) {
      setMessage('Please enter a valid phone number');
      setMessageType('error');
      return;
    }

    // Update profile
    const updatedProfile = {
      username: editForm.username,
      password: editForm.password || profile.password,
      email: editForm.email,
      phone: editForm.phone
    };

    setProfile(updatedProfile);
    setIsEditing(false);
    setMessage('Profile updated successfully!');
    setMessageType('success');

    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div>
      <div className="banner">
        <h1>Talladega Nights</h1>
        <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleLogout}>Logout</button>
          <button onClick={() => navigate('/points')}>Points</button>
        </div>
      </div>
      <div className="profile-container">
        <div className="profile-header">
          <h1>Admin Profile</h1>
          {!isEditing && (
            <button className="edit-btn" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-field">
              <label>Username</label>
              <div className="field-value">{profile.username}</div>
            </div>

            <div className="profile-field">
              <label>Password</label>
              <div className="password-field">
                <div className="field-value">
                  {showPassword ? profile.password : '••••••••••'}
                </div>
                <button 
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="profile-field">
              <label>Email</label>
              <div className="field-value">{profile.email || 'Not provided'}</div>
            </div>

            <div className="profile-field">
              <label>Phone</label>
              <div className="field-value">{profile.phone || 'Not provided'}</div>
            </div>
          </div>
        ) : (
          <div className="profile-edit">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="password-section">
              <h3>Change Password</h3>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter new password (leave blank to keep current)"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={editForm.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      <button onClick={() => navigate('/admin/adduser')}>Add User</button>
    </div>
  );
}

/*function AdminPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      navigate('/');
  };

  return (
    <div>
      <div className="banner">
        <h1>React App</h1>
        <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/points')}>Points</button>
        </div>
      </div>
      <div className="profile-container">
        <div className="profile-header">
          <h1>Admin Profile</h1>
          <div className="profile-field">
            <label>Username</label>
            <div className="field-value">{user?.USERNAME || 'Not logged in'}</div>
          </div>
        </div>
      </div>
      <button onClick={() => navigate('/admin/adduser')}>Add User</button>
    </div>
  )
}
*/

function AdminAddUser() {
    const navigate = useNavigate();

    const [f_name, setf_name] = useState("");
    const [l_name, setl_name] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState("driver");
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        try {
            const response = await axios.post('http://localhost:3001/api/users/add', {
                username,
                password,
                userType,
                f_name,
                l_name
            });

            if (response.data.status === 'success') {
                setMessage('User created successfully!');
                setMessageType('success');

                // Clear fields after successful creation
                setf_name("");
                setl_name("");
                setUsername("");
                setPassword("");
                setUserType("driver");
            }
        } catch (error) {
            if (error.response) {
                setMessage(error.response.data.message || 'An error occurred while creating the user.');
            } else if (error.request) {
                setMessage('Could not connect to the server. Please try again later.');
            } else {
                setMessage('An unexpected error occurred.');
            }
            setMessageType('error');
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <button onClick={() => navigate('/admin')}>Back to Admin</button>
            <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "10px", width: "250px", marginTop: '1rem' }}
            >
                <h2>Create New User</h2>

                {message && (
                    <div className={`message ${messageType}`} style={{ marginBottom: '1rem' }}>
                        {message}
                    </div>
                )}
                <input
                    type="text"
                    placeholder="First Name"
                    value={f_name}
                    onChange={(e) => setf_name(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Last Name"
                    value={l_name}
                    onChange={(e) => setl_name(e.target.value)}
                    required
                />

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <select value={userType} onChange={(e) => setUserType(e.target.value)}>
                    <option value="driver">Driver</option>
                    <option value="sponsor">Sponsor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                </select>

                <button type="submit">Create User</button>
            </form>
        </div>
    )
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <div>
              <Banner />
              <HomePage />
            </div>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sponsor" element={<SponsorProfilePage />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/admin" element={<AdminProfilePage />} />
          <Route path="/admin/adduser" element={<AdminAddUser />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
