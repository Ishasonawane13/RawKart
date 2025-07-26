import React, { useState } from 'react';

// --- Helper Components for UI (No changes here) ---

const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
    {children}
  </div>
);

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

// --- Main Application Screens ---

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

// Screen 2: Login/Registration (NOW FUNCTIONAL)
const AuthScreen = ({ role, onBack }) => {
  // State to hold the form data
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
  });
  const [message, setMessage] = useState(''); // To show success/error messages

  // Update state when user types in an input field
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission which reloads the page
    setMessage('Registering...');

    try {
      // The backend API endpoint we will create
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, role }), // Send form data and the selected role
      });

      const data = await response.json();

      if (!response.ok) {
        // If server responds with an error
        throw new Error(data.message || 'Something went wrong');
      }

      setMessage(`Success! User ${data.user.name} registered.`);
      // Here you would typically redirect the user or clear the form

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
        Already have an account? <a href="#" className="font-medium text-yellow-600 hover:underline">Log In</a>
      </p>
    </div>
  );
};


// --- Main App Component (No changes here) ---

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [userRole, setUserRole] = useState(null);

  const handleSelectRole = (role) => {
    setUserRole(role);
    setCurrentScreen('auth');
  };

  const handleBackToLanding = () => {
    setCurrentScreen('landing');
    setUserRole(null);
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen role={userRole} onBack={handleBackToLanding} />;
      case 'landing':
      default:
        return <LandingScreen onSelectRole={handleSelectRole} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md mx-auto p-4">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800">RawKart</h1>
        </header>
        <main>
          <Card>
            {renderScreen()}
          </Card>
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>&copy; 2025 RawKart. Empowering local businesses.</p>
        </footer>
      </div>
    </div>
  );
}
