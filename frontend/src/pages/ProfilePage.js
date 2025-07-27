import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = ({ user }) => {
  const navigate = useNavigate();

  if (!user) {
    return <p className="text-center text-red-500">User information not available. Please log in.</p>;
  }

  return (
    <div className="text-center">
      <button onClick={() => navigate('/home')} className="text-yellow-600 hover:underline mb-4">&larr; Back to Dashboard</button>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Profile</h2>
      <div className="bg-gray-100 p-6 rounded-lg shadow-sm text-left mx-auto max-w-sm">
        <p className="text-lg font-semibold text-gray-800 mb-2">Name: <span className="font-normal">{user.name}</span></p>
        <p className="text-lg font-semibold text-gray-800 mb-2">Role: <span className="font-normal capitalize">{user.role}</span></p>
        {user.mobile && <p className="text-lg font-semibold text-gray-800">Mobile: <span className="font-normal">{user.mobile}</span></p>}
        {/* Add more profile details as needed from user object */}
      </div>
      <p className="text-gray-500 text-sm mt-4">
        This is a basic profile. More details and editing options coming soon!
      </p>
    </div>
  );
};

export default ProfilePage;