import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/Button'; // Assuming Button is now in components

const AuthScreen = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialRole = location.state?.initialRole || 'vendor'; // Get initial role from state or default

  const [role, setRole] = useState(initialRole); // Use initialRole for state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  // Update state when user types in an input field
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Registering...');

    try {
      // Simulate API call for registration
      // In a real app, this would be your actual fetch to http://localhost:5000/api/users/register
      // For demonstration, we simulate success and call onRegisterSuccess
      const response = await new Promise(resolve => setTimeout(() => {
        // Simulate a successful registration response
        if (formData.name && formData.mobile && formData.password) {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              message: 'User registered successfully!',
              user: { name: formData.name, role: role, mobile: formData.mobile }
            }),
          });
        } else {
          // Simulate an error
          resolve({
            ok: false,
            json: () => Promise.resolve({
              message: 'Please fill all fields.',
            }),
          });
        }
      }, 1000));


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setMessage(`Success! User ${data.user.name} registered.`);
      // Call the prop function to update App.js state with user info
      onRegisterSuccess({ name: formData.name, role: role });
      // Redirect to home page after successful registration
      navigate('/home');

    } catch (error) {
      console.error('Registration failed:', error);
      setMessage(error.message);
    }
  };

  const handleBack = () => {
    navigate('/'); // Go back to landing screen
  }

  return (
    <div>
      <button onClick={handleBack} className="text-yellow-600 hover:underline mb-4">&larr; Back</button>
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
        Already have an account? <a href="#" className="font-medium text-yellow-600 hover:underline">Log In</a>
      </p>
    </div>
  );
};

export default AuthScreen;