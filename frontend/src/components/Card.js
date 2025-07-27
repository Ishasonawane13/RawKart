import React from 'react';

const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
    {children}
  </div>
);

export { Card }; // Export as named export