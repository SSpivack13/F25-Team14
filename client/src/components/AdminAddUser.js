import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
      const response = await axios.post(`${process.env.REACT_APP_API}/users/add`, {
        username,
        password,
        userType,
        f_name,
        l_name
      });
      if (response.data.status === 'success') {
        setMessage('User created successfully!');
        setMessageType('success');
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
  );
}

export default AdminAddUser;
