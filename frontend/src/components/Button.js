import React from 'react';

const Button = ({ children, onClick, className = '', type = 'primary', isSubmit = false }) => {
  const baseClasses = 'w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-75 transition duration-150 ease-in-out';
  
  const typeClasses = {
    primary: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
  };

  return (
    <button 
      type={isSubmit ? 'submit' : 'button'} 
      onClick={onClick} 
      className={`${baseClasses} ${typeClasses[type]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
