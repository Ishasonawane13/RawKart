// LoginScreen.js
import React, { useState } from 'react';

// Helper Button component (can be moved to a separate UI components file if many)
const Button = ({ children, onClick, className = '', type = 'primary', isSubmit = false }) => {
  const baseClasses = 'w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-75 transition duration-150 ease-in-out';
  const typeClasses = {
    primary: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
  };
  return (
    <button type={isSubmit ? 'submit' : 'button'} onClick={onClick} className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      {children}
    </button>
  );
};

const LoginScreen = ({ onBack }) => {
  const [formData, setFormData] = useState({
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
    setMessage('Logging in...');

    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } else {
          const errorText = await response.text();
          console.error('Non-JSON server response:', errorText);
          throw new Error(`Server responded with an unexpected format (status: ${response.status}). Please check if your backend server is running and configured correctly.`);
        }
      }

      const data = await response.json();

      setMessage(`Welcome back, ${data.user.name}!`);
    } catch (error) {
      console.error('Login failed:', error);
      setMessage(error.message);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="text-yellow-600 hover:underline mb-4">&larr; Back</button>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Log In to RawKart
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
          <input type="tel" name="mobile" placeholder="Enter your 10-digit mobile number" value={formData.mobile} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" />
        </div>
        <Button isSubmit={true} className="mt-2">Log In</Button>
      </form>
      {message && <p className="text-center text-sm text-gray-600 mt-4">{message}</p>}
    </div>
  );
};

export default LoginScreen;
