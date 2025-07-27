import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="text-center py-10">
      <h2 className="text-6xl font-bold text-gray-800 mb-4">404</h2>
      <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
      <Link to="/" className="text-yellow-600 hover:underline text-lg">Go to Home</Link>
    </div>
  );
};

export default NotFoundPage;