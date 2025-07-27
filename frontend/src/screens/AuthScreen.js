import React, { useState } from 'react';
import Button from '../components/Button'; // Make sure this path is correct

const AuthScreen = ({ role, onBack, onGoToLogin, onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Registering...');

    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
      
      setMessage(`Success! User ${data.name} registered.`);
      // Call onAuthSuccess to update App state and move to dashboard
      onAuthSuccess(data); 

    } catch (error) {
      console.error('Registration failed:', error);
      setMessage(error.message);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="text-yellow-600 hover:underline mb-4">&larr; Back</button>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Register as a <span className="capitalize text-yellow-500">{role}</span>
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
          <input type="tel" name="mobile" placeholder="Enter your 10-digit mobile number" value={formData.mobile} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" name="password" placeholder="Create a password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" />
        </div>
        <Button isSubmit={true} className="mt-2">Register</Button>
      </form>
      {message && <p className="text-center text-sm text-gray-600 mt-4">{message}</p>}
      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?
        <button type="button" onClick={onGoToLogin} className="font-medium text-yellow-600 hover:underline ml-1">
          Log In
        </button>
      </p>
    </div>
  );
};

export default AuthScreen;
