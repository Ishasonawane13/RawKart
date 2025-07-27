import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Helper Components for UI (Imported from components directory) ---
// These components are now defined in src/components/Card.js and src/components/Button.js
import { Card } from './components/Card';
import { Button } from './components/Button';

// --- Main Application Screens (Importing from pages directory) ---
// These components are now defined in their respective files in src/pages/
import LandingScreen from './pages/LandingScreen';
import AuthScreen from './pages/AuthScreen';
import HomePage from './pages/HomePage';
import GullyOrderDetailsPage from './pages/GullyOrderDetailsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Mock Data for Gully Orders (In a real app, this comes from an API)
const mockGullyOrders = [
  {
    id: 'gully1',
    name: 'Kopar Bridge Daily Vegetables',
    location: 'Dombivli East, Kopar Bridge',
    items: [
      { id: 'item1', name: 'Potatoes (A Grade)', unit: 'kg', pricePerUnit: 25, requiredTotal: 100 },
      { id: 'item2', name: 'Onions (Red)', unit: 'kg', pricePerUnit: 20, requiredTotal: 80 },
      { id: 'item3', name: 'Tomatoes', unit: 'kg', pricePerUnit: 30, requiredTotal: 60 },
      { id: 'item4', name: 'Green Chillies', unit: '250g', pricePerUnit: 15, requiredTotal: 20 },
    ],
    deadline: '2025-07-28T22:00:00Z', // Tomorrow 10 PM IST
    status: 'open', // open, closed, delivered
    currentContributions: { // Vendor ID -> { itemId: quantity }
      'vendor1': { 'item1': 5, 'item2': 3 },
      'vendor2': { 'item1': 2, 'item3': 1 },
    },
    supplierBid: null, // Placeholder for supplier bid info
    description: 'Daily fresh vegetables for street food vendors in Kopar Bridge area. Please place your orders before 10 PM for next day delivery.',
  },
  {
    id: 'gully2',
    name: 'Station Road Spices & Oil',
    location: 'Dadar West, Station Road',
    items: [
      { id: 'item5', name: 'Refined Oil (Palmolein)', unit: 'Litre', pricePerUnit: 90, requiredTotal: 200 },
      { id: 'item6', name: 'Turmeric Powder', unit: 'kg', pricePerUnit: 180, requiredTotal: 20 },
      { id: 'item7', name: 'Cumin Seeds', unit: 'kg', pricePerUnit: 220, requiredTotal: 15 },
    ],
    deadline: '2025-07-29T10:00:00Z',
    status: 'open',
    currentContributions: {},
    supplierBid: null,
    description: 'Bulk order for cooking oil and essential spices for vendors near Dadar West Station.',
  },
  {
    id: 'gully3',
    name: 'Fish Market Daily Catch',
    location: 'Bandra West, Pali Naka',
    items: [
      { id: 'item8', name: 'Pomfret', unit: 'kg', pricePerUnit: 450, requiredTotal: 50 },
      { id: 'item9', name: 'Prawns', unit: 'kg', pricePerUnit: 300, requiredTotal: 40 },
    ],
    deadline: '2025-07-27T08:00:00Z', // Past deadline
    status: 'closed',
    currentContributions: {
      'vendor3': { 'item8': 10, 'item9': 5 },
    },
    supplierBid: { supplierId: 'supplier1', price: 35000, status: 'accepted' },
    description: 'Fresh catch from the Bandra fish market. This order has been closed and fulfilled.',
  },
];


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); // { name: 'Gargi Dhuri', role: 'vendor' }
  const [gullyOrders, setGullyOrders] = useState(mockGullyOrders);

  // Function to simulate login/registration success
  const handleAuthSuccess = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    console.log("Auth Success:", userData);
  };

  // Function to simulate adding contribution to a gully order
  const addGullyOrderContribution = (orderId, vendorId, contributions) => {
    setGullyOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? {
              ...order,
              currentContributions: {
                ...order.currentContributions,
                [vendorId]: {
                  ...(order.currentContributions[vendorId] || {}), // Preserve existing contributions
                  ...contributions, // Add/update new contributions
                },
              },
            }
          : order
      )
    );
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-md mx-auto p-4">
          <header className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800">RawKart</h1>
            {isLoggedIn && user && (
              <nav className="mt-4 flex justify-center space-x-4">
                <p className="text-gray-600">Welcome, {user.name} ({user.role})!</p>
                <button onClick={handleLogout} className="text-red-500 hover:underline">Logout</button>
              </nav>
            )}
          </header>
          <main>
            <Card> {/* Card component is imported */}
              <Routes>
                {/* Landing page - accessible if not logged in */}
                <Route
                  path="/"
                  element={
                    isLoggedIn ? (
                      <Navigate to="/home" replace />
                    ) : (
                      <LandingScreen /> // LandingScreen is imported
                    )
                  }
                />
                {/* Auth page - accessible if not logged in */}
                <Route
                  path="/register"
                  element={
                    isLoggedIn ? (
                      <Navigate to="/home" replace />
                    ) : (
                      <AuthScreen onRegisterSuccess={handleAuthSuccess} /> // AuthScreen is imported
                    )
                  }
                />
                {/* Protected Routes - only accessible if logged in */}
                <Route
                  path="/home"
                  element={
                    isLoggedIn ? (
                      <HomePage user={user} gullyOrders={gullyOrders} />
                    ) : (
                      <Navigate to="/register" replace />
                    )
                  }
                />
                <Route
                  path="/gully-orders/:id"
                  element={
                    isLoggedIn ? (
                      <GullyOrderDetailsPage
                        user={user}
                        gullyOrders={gullyOrders}
                        addGullyOrderContribution={addGullyOrderContribution}
                      />
                    ) : (
                      <Navigate to="/register" replace />
                    )
                  }
                />
                 <Route
                  path="/profile"
                  element={
                    isLoggedIn ? (
                      <ProfilePage user={user} />
                    ) : (
                      <Navigate to="/register" replace />
                    )
                  }
                />
                {/* Catch-all for 404 Not Found */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Card>
          </main>
          <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>&copy; 2025 RawKart. Empowering local businesses.</p>
          </footer>
        </div>
      </div>
    </Router>
  );
}
