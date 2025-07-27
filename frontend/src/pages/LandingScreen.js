import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button'; // Assuming you move Button to a components folder

// Helper Button component (if not already in a dedicated components folder)
// If you already have Button defined in App.js and want to keep it there,
// then remove this local definition and ensure App.js passes it as a prop or context.
// For a cleaner structure, create src/components/Button.js and move it there.
// For this example, I'll assume Button is in src/components/Button.js

const LandingScreen = () => {
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    navigate('/register', { state: { initialRole: role } });
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Join RawKart</h2>
      <p className="text-gray-600 mb-8">Are you a Street Vendor or a Supplier?</p>
      <div className="space-y-4">
        <Button onClick={() => handleSelectRole('vendor')}>
          I'm a Street Vendor
        </Button>
        <Button onClick={() => handleSelectRole('supplier')} type="secondary">
          I'm a Raw Material Supplier
        </Button>
      </div>
    </div>
  );
};

export default LandingScreen;