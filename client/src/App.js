import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { appInfo } from './appInfo';
import './Template.css';
import axios from 'axios';
function Banner() {
  const navigate = useNavigate();

  return (
    <div className="banner">
          <h1>Talladega Nights</h1>
          <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => navigate('/login')}>Manager Profile</button>
              <button onClick={() => navigate('/admin')}>Admin Profile</button>
          </div>
    </div>
  );
}

function HomePage() {
  return (
    <div className="template-content">
      <div className="template-card">
        <h2>{appInfo.projectName}</h2>
      </div>
      <div className="template-card">
        <h2>Current Sprint: {appInfo.currentSprint}</h2>
        <p>
          Project Version: {appInfo.version}<br />
        </p>
      </div>
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
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setLoginForm(prev => ({
      ...prev,
      [field]: value
    }));
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
        
        setTimeout(() => {
          navigate('/profile');
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
          <h1>Manager Login</h1>
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

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '0.9rem', color: '#666' }}>
            <strong>Demo Credentials:</strong><br />
            Username: manager<br />
            Password: password
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

function PointsPage() {
    const points = 123321;
    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        navigate('/login');
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        navigate('/');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}} >
            <h1>Your Points</h1>
            <h2>You currently have <strong>{points}</strong> points.</h2>
            <button onClick={() => navigate('/profile')}>Profile</button>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}

function AdminPage() {
    const navigate = useNavigate();
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
                </div>
            </div>
            <button onClick={() => navigate('/admin/adduser')}>Add User</button>
        </div>
    )
}

function AdminAddUser() {
    const navigate = useNavigate();


    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState("driver");
    const [submittedData, setSubmittedData] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Just save locally for proof-of-concept display
        setSubmittedData({ username, password, userType });

        // Clear fields if you want
        setUsername("");
        setPassword("");
        setUserType("driver");
    }

    return (
        <div style={{ padding: "20px" }}>
            <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "10px", width: "250px" }}
            >
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

            {submittedData && (
                <div style={{ marginTop: "20px" }}>
                    <h3>Preview:</h3>
                    <p><strong>Username:</strong> {submittedData.username}</p>
                    <p><strong>Password:</strong> {submittedData.password}</p>
                    <p><strong>User Type:</strong> {submittedData.userType}</p>
                </div>
            )}
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
          <Route path="/points" element={<PointsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/adduser" element={<AdminAddUser />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
