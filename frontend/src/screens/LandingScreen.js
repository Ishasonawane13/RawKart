import React from 'react';
import Button from '../components/Button'; // Import the button

const LandingScreen = ({ onSelectRole }) => (
  <div className="text-center">
    <h2 className="text-3xl font-bold text-gray-800 mb-2">Join RawKart</h2>
    <p className="text-gray-600 mb-8">Are you a Street Vendor or a Supplier?</p>
    <div className="space-y-4">
      <Button onClick={() => onSelectRole('vendor')}>
        I'm a Street Vendor
      </Button>
      <Button onClick={() => onSelectRole('supplier')} type="secondary">
        I'm a Raw Material Supplier
      </Button>
    </div>
  </div>
);

export default LandingScreen;