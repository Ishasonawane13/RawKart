import React, { useState } from 'react';
import LandingScreen from './screens/LandingScreen';
import AuthScreen from './screens/AuthScreen';
import LoginScreen from './screens/LoginScreen';
import VendorDashboard from './Pages/VendorDashboard';
// import SupplierDashboard from './pages/SupplierDashboard'; // And this

function App() {
  const [view, setView] = useState('landing'); // landing, register, login, dashboard
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null); // To store user data after login

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setView('register');
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const renderView = () => {
    if (view === 'dashboard') {
      // You can expand this logic later
      return user.role === 'vendor' ? <VendorDashboard user={user} /> : <div>Supplier Dashboard</div>;
    }
    if (view === 'login') {
      return <LoginScreen onAuthSuccess={handleAuthSuccess} onBack={() => setView('landing')} />;
    }
    if (view === 'register') {
      return <AuthScreen role={role} onBack={() => setView('landing')} onGoToLogin={() => setView('login')} onAuthSuccess={handleAuthSuccess} />;
    }
    // Default to landing
    return <LandingScreen onSelectRole={handleSelectRole} />;
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        {renderView()}
      </div>
      </div>
    // </Router>
  );
}

export default App;
