import React, { useState, useEffect, useRef } from 'react';
import AnalyticsCharts from './AnalyticsCharts';
import io from 'socket.io-client';

// Use environment variable for API and Socket URLs
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io.connect(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

// --- Helper Components ---
const Card = ({ children, className }) => (<div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>{children}</div>);
const Button = ({ children, onClick, className = '', type = 'primary', isSubmit = false }) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-75 transition duration-150 ease-in-out';
  const typeClasses = {
    primary: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
  };
  return (<button type={isSubmit ? 'submit' : 'button'} onClick={onClick} className={`${baseClasses} ${typeClasses[type]} ${className}`}>{children}</button>);
};

// --- Screens ---
const LandingScreen = ({ onSelectRole }) => (
  <div className="text-center max-w-md mx-auto">
    <h2 className="text-3xl font-bold text-gray-800 mb-2">Join RawKart</h2>
    <p className="text-gray-600 mb-8">Are you a Street Vendor or a Supplier?</p>
    <div className="space-y-4">
      <Button onClick={() => onSelectRole('vendor')} className="w-full">I'm a Street Vendor</Button>
      <Button onClick={() => onSelectRole('supplier')} type="secondary" className="w-full">I'm a Raw Material Supplier</Button>
    </div>
  </div>
);

const AuthScreen = ({ role, onBack, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', password: '' });
  const [message, setMessage] = useState('');
  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? 'login' : 'register';
    setMessage('Processing...');
    try {
      const payload = isLogin ? { mobile: formData.mobile, password: formData.password } : { ...formData, role };
      const response = await fetch(`${API_URL}/api/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'An error occurred.');
      if (isLogin) {
        setMessage('Login successful!');
        onLoginSuccess(data.user, data.token);
      } else {
        setMessage('Registration successful! Please log in.');
        setIsLogin(true);
      }
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="text-yellow-600 hover:underline mb-4">&larr; Back</button>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">{isLogin ? 'Log In' : 'Register'} as a <span className="capitalize text-yellow-500">{role}</span></h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (<div><label className="block text-sm font-medium text-gray-700">Full Name</label><input type="text" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" /></div>)}
        <div><label className="block text-sm font-medium text-gray-700">Mobile Number</label><input type="tel" name="mobile" placeholder="Enter your 10-digit mobile number" value={formData.mobile} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Password</label><input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" /></div>
        <Button isSubmit={true} className="mt-2 w-full">{isLogin ? 'Log In' : 'Register'}</Button>
      </form>
      {message && <p className="text-center text-sm text-gray-600 mt-4">{message}</p>}
      <p className="text-center text-sm text-gray-600 mt-4"><a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setMessage(''); }} className="font-medium text-yellow-600 hover:underline">{isLogin ? 'Need to register?' : 'Already have an account?'}</a></p>
    </div>
  );
};

const Chat = ({ user, room, onBack, onChatClosed }) => {
  const [requestPending, setRequestPending] = useState(false);
  const chatBoxRef = useRef(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [chatClosed, setChatClosed] = useState(false);
  const [closedData, setClosedData] = useState(null);

  const sendMessage = async () => {
    if (currentMessage !== "" && !chatClosed) {
      const messageData = {
        room: room,
        author: user.name,
        message: currentMessage,
        time: new Date(Date.now()).toLocaleTimeString(),
        senderRole: user.role
      };
      await socket.emit("send_message", messageData);
      // Removed local message append to prevent duplicate messages for sender
      setCurrentMessage("");
    }
  };

  // Auto-scroll chat box to bottom when messageList changes
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messageList]);

  useEffect(() => {
    // Join the chat room with user role information
    socket.emit("join_room", { room, userRole: user.role });

    const messageHandler = (data) => { setMessageList((list) => [...list, data]); };

    const previousMessagesHandler = (messages) => {
      // Load previous messages when supplier joins
      const formattedMessages = messages.map(msg => ({
        author: msg.sender,
        message: msg.message,
        time: new Date(msg.timestamp).toLocaleTimeString(),
        senderRole: msg.senderRole
      }));
      setMessageList(formattedMessages);
    };

    const chatClosedHandler = (data) => {
      setChatClosed(true);
      setClosedData(data);
      setMessageList((list) => [...list, {
        author: "System",
        message: data.message,
        time: new Date().toLocaleTimeString(),
        isSystem: true
      }]);
    };

    socket.on("receive_message", messageHandler);
    socket.on("previous_messages", previousMessagesHandler);
    socket.on("chat_closed", chatClosedHandler);

    return () => {
      socket.off("receive_message", messageHandler);
      socket.off("previous_messages", previousMessagesHandler);
      socket.off("chat_closed", chatClosedHandler);
    };
  }, [room, user.role]);

  const handleRequestAgain = () => {
    setRequestPending(true);
    setChatClosed(false);
    setMessageList([{
      author: "System",
      message: "Request Pending",
      time: new Date().toLocaleTimeString(),
      isSystem: true
    }]);
    // Optionally, emit a socket event to notify supplier
    socket.emit("request_again", { room, vendor: user.name });
    // Listen for supplier acceptance
    const acceptHandler = (data) => {
      if (data.room === room) {
        setRequestPending(false);
        setMessageList([]); // Clear pending message, chat can resume
      }
    };
    socket.on("request_accepted", acceptHandler);
    socket.off("request_accepted", acceptHandler);
  };

  const getMessageStyle = (msg) => {
    if (msg.isSystem) {
      return msg.isPositive ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800";
    }
    return msg.author === user.name ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-800";
  };

  const getMessageTextStyle = (msg) => {
    if (msg.isSystem) {
      return msg.isPositive ? "text-green-600" : "text-red-600";
    }
    return msg.author === user.name ? "text-yellow-100" : "text-gray-500";
  };

  return (
    <div>
      <button onClick={onBack} className="text-yellow-600 hover:underline mb-4">&larr; Back</button>
      <Card>
        <div className="border-b-2 border-gray-200 pb-2 mb-4">
          <h3 className="text-2xl font-bold">Live Chat</h3>
          <p className="text-sm text-gray-500">Room ID: {room}</p>
          {chatClosed && (
            <div className="mt-2 p-2 bg-red-100 border border-red-400 rounded-md">
              <p className="text-red-700 text-sm font-semibold">Chat has been closed by the supplier</p>
            </div>
          )}
        </div>
        <div className="h-80 overflow-y-auto mb-4 p-2 bg-gray-50 rounded-md">
          <div ref={chatBoxRef} style={{ height: '100%', overflowY: 'auto' }}>
            {messageList.map((msg, index) => (
              <div key={index} className={`flex mb-2 ${msg.isSystem ? "justify-center" : (msg.author === user.name ? "justify-end" : "justify-start")}`}>
                <div className={`rounded-lg p-3 max-w-xs ${getMessageStyle(msg)}`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${getMessageTextStyle(msg)}`}>{msg.author} @ {msg.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {chatClosed ? (
          <div className="flex space-x-2">
            <Button onClick={handleRequestAgain} className="flex-grow">Request Again</Button>
            <Button onClick={onBack} type="secondary" className="w-auto">Close</Button>
          </div>
        ) : (
          <div className="flex">
            <input
              type="text"
              value={currentMessage}
              placeholder="Type your message..."
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <Button onClick={sendMessage} className="w-auto rounded-l-none">Send</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

// --- UPDATED: Supplier Dashboard ---
const SupplierDashboard = ({ user, token, onLogout }) => {
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      // Only set image if a file is selected
      if (files && files[0]) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewItem(prev => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(files[0]);
      } else {
        setNewItem(prev => ({ ...prev, image: null }));
      }
    } else {
      setNewItem(prev => ({ ...prev, [name]: value }));
    }
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({});
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (token) {
      // Fetch supplier profile and reviews (stub)
      fetch(`${API_URL}/api/suppliers/profile`, { headers: { 'x-auth-token': token } })
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(() => setProfile({}));
      fetch(`${API_URL}/api/suppliers/reviews`, { headers: { 'x-auth-token': token } })
        .then(res => res.json())
        .then(data => setReviews(data))
        .catch(() => setReviews([]));
    }
  }, [token]);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [nearbyVendors, setNearbyVendors] = useState([]);

  // Fetch nearby vendors (stub)
  useEffect(() => {
    if (location.lat && location.lng) {
      fetch(`${API_URL}/api/vendors/nearby?lat=${location.lat}&lng=${location.lng}`, { headers: { 'x-auth-token': token } })
        .then(res => res.json())
        .then(data => setNearbyVendors(data))
        .catch(() => setNearbyVendors([]));
    }
  }, [location, token]);

  // Handle location set (stub)
  const handleSetLocation = () => {
    // Use browser geolocation for demo
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert('Unable to fetch location')
      );
    } else {
      alert('Geolocation not supported');
    }
  };
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (token) {
      // Fetch payment history (stub)
      fetch(`${API_URL}/api/payments/supplier`, { headers: { 'x-auth-token': token } })
        .then(res => res.json())
        .then(data => setPayments(data))
        .catch(() => setPayments([]));
    }
  }, [token]);
  // Handle image upload for inventory
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };
  // Sidebar navigation
  const [view, setView] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState({ itemName: '', unit: 'per Kg', price: '', minPrice: '', quantity: '', image: null });
  const [message, setMessage] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [chatRoom, setChatRoom] = useState(null);
  const [analytics, setAnalytics] = useState({});

  // Fetch inventory, orders, analytics from backend
  const fetchInventory = async () => {
    try {
      const invResponse = await fetch(`${API_URL}/api/inventory`, { headers: { 'x-auth-token': token } });
      const invData = await invResponse.json();
      setInventory(invData);
    } catch (error) {
      setMessage('Error loading inventory');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setMessage('Loading data...');
      try {
        const [ordersResponse, analyticsResponse] = await Promise.all([
          fetch(`${API_URL}/api/orders/supplier`, { headers: { 'x-auth-token': token } }),
          fetch(`${API_URL}/api/analytics/supplier`, { headers: { 'x-auth-token': token } })
        ]);
        const ordersData = await ordersResponse.json();
        const analyticsData = await analyticsResponse.json();
        if (!ordersResponse.ok || !analyticsResponse.ok) throw new Error('Failed to fetch data.');
        setOrders(ordersData);
        setAnalytics(analyticsData);
        setMessage('');
      } catch (error) {
        setMessage(error.message);
      }
    };

    if (token) {
      fetchInventory();
      fetchData();
      socket.emit('join_user_room', { userId: user.id, role: 'supplier' });
      const newOrderHandler = (data) => {
        setOrders(prevOrders => [data.order, ...prevOrders]);
        setMessage(`🔔 ${data.message}`);
        setTimeout(() => setMessage(''), 5000);
      };
      socket.on('new_order', newOrderHandler);
      return () => {
        socket.off('new_order', newOrderHandler);
      };
    }
  }, [token, user.id]);

  // Sidebar navigation
  const sidebar = (
    <div className={`fixed md:static top-0 left-0 h-full w-64 bg-gray-900 text-white p-6 flex flex-col space-y-6 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Supplier Panel</h2>
        <button className="md:hidden text-white" onClick={() => setSidebarOpen(false)}>&times;</button>
      </div>
      <Button onClick={() => { setView('dashboard'); setSidebarOpen(false); }} className="w-full" type="secondary">Dashboard</Button>
      <Button onClick={() => { setView('orders'); setSidebarOpen(false); }} className="w-full" type="secondary">Order History</Button>
      <Button onClick={() => { setView('inventory'); setSidebarOpen(false); }} className="w-full" type="secondary">Inventory</Button>
      <Button onClick={() => { setView('analytics'); setSidebarOpen(false); }} className="w-full" type="secondary">Market Analysis</Button>
      <Button onClick={() => { setView('payments'); setSidebarOpen(false); }} className="w-full" type="secondary">Payments</Button>
      <Button onClick={() => { setView('location'); setSidebarOpen(false); }} className="w-full" type="secondary">Location</Button>
      <Button onClick={() => { setView('profile'); setSidebarOpen(false); }} className="w-full" type="secondary">Profile</Button>
      <Button onClick={onLogout} className="w-full mt-auto" type="primary">Logout</Button>
    </div>
  );

  // Dashboard cards
  const dashboardCards = (
    <div className="grid grid-cols-2 gap-6 mb-8">
      <Card className="bg-yellow-100 text-yellow-800">
        <h3 className="text-lg font-bold mb-2">Total Orders</h3>
        <p className="text-3xl">{orders.length}</p>
      </Card>
      <Card className="bg-green-100 text-green-800">
        <h3 className="text-lg font-bold mb-2">Total Inventory Items</h3>
        <p className="text-3xl">{inventory.length}</p>
      </Card>
      <Card className="bg-blue-100 text-blue-800">
        <h3 className="text-lg font-bold mb-2">Top Vendor</h3>
        <p className="text-xl">{analytics.topVendor || '-'}</p>
      </Card>
      <Card className="bg-purple-100 text-purple-800">
        <h3 className="text-lg font-bold mb-2">Total Revenue</h3>
        <p className="text-3xl">₹{analytics.totalRevenue || '0'}</p>
      </Card>
    </div>
  );

  // Order history table
  const orderHistory = (
    <Card>
      <h2 className="text-xl font-bold mb-4">Order History</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Order ID</th>
            <th className="p-2">Vendor</th>
            <th className="p-2">Item</th>
            <th className="p-2">Qty</th>
            <th className="p-2">Price</th>
            <th className="p-2">Status</th>
            <th className="p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order._id} className="border-b">
              <td className="p-2">{order._id}</td>
              <td className="p-2">{order.vendorName}</td>
              <td className="p-2">{order.itemName}</td>
              <td className="p-2">{order.quantity}</td>
              <td className="p-2">₹{order.price}</td>
              <td className="p-2">{order.status}</td>
              <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  // ...existing code...
  const paymentsSection = (
    <Card>
      <h2 className="text-xl font-bold mb-4">Payments</h2>
      <table className="w-full text-left border-collapse mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Transaction ID</th>
            <th className="p-2">Order</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Status</th>
            <th className="p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.length > 0 ? payments.map(payment => (
            <tr key={payment._id} className="border-b">
              <td className="p-2">{payment.transactionId}</td>
              <td className="p-2">{payment.orderId}</td>
              <td className="p-2">₹{payment.amount}</td>
              <td className="p-2">{payment.status}</td>
              <td className="p-2">{new Date(payment.date).toLocaleDateString()}</td>
            </tr>
          )) : (
            <tr><td colSpan={5} className="p-2 text-center">No payments found.</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  );
  // Inventory management UI
  const handleAddItem = async (e) => {
    e.preventDefault();
    // Image is optional
    const itemData = { ...newItem };
    if (!itemData.image) delete itemData.image;
    try {
      const response = await fetch(`${API_URL}/api/inventory/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(itemData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add item.');
      setNewItem({ itemName: '', unit: 'per Kg', price: '', minPrice: '', quantity: '', image: null });
      setFormMessage('Item added successfully!');
      // Refetch inventory from backend to show all items
      fetchInventory();
    } catch (error) {
      setFormMessage(error.message);
    }
  };

  const inventoryManagement = (
    <Card>
      <h2 className="text-xl font-bold mb-4">Add New Item</h2>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAddItem}>
        <input type="text" name="itemName" value={newItem.itemName} onChange={handleInputChange} placeholder="Item Name (e.g., Potatoes)" required className="px-3 py-2 border rounded-md" />
        <input type="number" name="price" value={newItem.price} onChange={handleInputChange} placeholder="Price (MRP)" required className="px-3 py-2 border rounded-md" />
        <input type="number" name="minPrice" value={newItem.minPrice} onChange={handleInputChange} placeholder="Minimum Price" required className="px-3 py-2 border rounded-md" />
        <input type="number" name="quantity" value={newItem.quantity} onChange={handleInputChange} placeholder="Stock Quantity" required className="px-3 py-2 border rounded-md" />
        <select name="unit" value={newItem.unit} onChange={handleInputChange} className="px-3 py-2 border rounded-md bg-white"><option>per Kg</option><option>per Litre</option><option>per Dozen</option><option>per Item</option></select>
        <input type="file" name="image" accept="image/*" onChange={handleInputChange} className="md:col-span-2" />
        {newItem.image && (
          <div className="md:col-span-2 flex justify-center mt-2">
            <img src={newItem.image} alt="Preview" className="h-32 object-contain rounded-md border" />
          </div>
        )}
        <Button isSubmit={true} className="md:col-span-2 w-full">Add Item to Inventory</Button>
      </form>
      {formMessage && <p className="text-center mt-4 text-green-600">{formMessage}</p>}
    </Card>
  );

  // Inventory list with images
  const inventoryList = (
    <Card>
      <h2 className="text-xl font-bold mb-4">Your Current Inventory</h2>
      {inventory.length > 0 ? (
        <ul className="space-y-2">
          {inventory.map(item => (
            <li key={item._id} className="p-2 bg-gray-50 rounded-md flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {item.image && <img src={item.image} alt={item.itemName} className="h-12 w-12 object-cover rounded" />}
                <span>{item.itemName}</span>
              </div>
              <span>₹{item.price} / {item.unit}</span>
            </li>
          ))}
        </ul>
      ) : (<p>You haven't added any items yet.</p>)}
    </Card>
  );

  // Main layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex">
      {/* Mobile sidebar toggle */}
      <button className="md:hidden fixed top-6 left-6 z-50 bg-yellow-500 text-white p-3 rounded-full shadow-lg hover:bg-yellow-600 transition" onClick={() => setSidebarOpen(true)}>
        &#9776;
      </button>
      {/* Sidebar fixed on left */}
      <div className="h-screen w-64 bg-white shadow-2xl flex-shrink-0 flex flex-col justify-between">
        {sidebar}
      </div>
      {/* Main content fills rest of screen */}
      <div className="flex-1 flex flex-col px-2 md:px-12 py-8">
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            <Card className="bg-yellow-50 text-yellow-900 shadow-lg rounded-2xl hover:scale-105 transition-transform">
              <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
              <p className="text-4xl font-bold">{orders.length}</p>
            </Card>
            <Card className="bg-green-50 text-green-900 shadow-lg rounded-2xl hover:scale-105 transition-transform">
              <h3 className="text-lg font-semibold mb-2">Total Inventory Items</h3>
              <p className="text-4xl font-bold">{inventory.length}</p>
            </Card>
            <Card className="bg-blue-50 text-blue-900 shadow-lg rounded-2xl hover:scale-105 transition-transform">
              <h3 className="text-lg font-semibold mb-2">Top Vendor</h3>
              <p className="text-xl font-bold">{analytics.topVendor || '-'}</p>
            </Card>
            <Card className="bg-purple-50 text-purple-900 shadow-lg rounded-2xl hover:scale-105 transition-transform">
              <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
              <p className="text-4xl font-bold">₹{analytics.totalRevenue || '0'}</p>
            </Card>
          </div>
        )}
        {view === 'orders' && orderHistory}
        {view === 'inventory' && (
          <div className="space-y-8 w-full">
            {inventoryManagement}
            {inventoryList}
          </div>
        )}
        {view === 'analytics' && (
          <Card>
            <h2 className="text-2xl font-bold mb-6 text-center">Market Analysis</h2>
            <AnalyticsCharts analytics={analytics} />
          </Card>
        )}
        {view === 'payments' && paymentsSection}
        {view === 'location' && locationSection}
        {view === 'profile' && profileSection}
      </div>
    </div>
  );
};
// Placeholder for Location section
const locationSection = (
  <Card>
    <h2 className="text-xl font-bold mb-4">Location</h2>
    <p className="text-gray-600">Location features coming soon.</p>
  </Card>
);

// Placeholder for Profile section
const profileSection = (
  <Card>
    <h2 className="text-xl font-bold mb-4">Profile</h2>
    <p className="text-gray-600">Profile features coming soon.</p>
  </Card>
);
// ...existing code...

const SearchResultsPage = ({ user, ingredient, searchResults, isLoading, message, onBack, onStartChat, token }) => (
  <div>
    <button onClick={onBack} className="text-yellow-600 hover:underline mb-4">&larr; Back to Shopping List</button>
    <Card>
      <h3 className="text-2xl font-bold mb-4">{isLoading ? 'Searching...' : `Suppliers for ${ingredient}`}</h3>
      {isLoading ? <p>{message}</p> : (message ? <p>{message}</p> : (
        <table className="w-full text-left">
          <thead><tr className="border-b"><th className="p-2">Supplier Name</th><th className="p-2">Price</th><th className="p-2">Stock</th><th className="p-2">Action</th></tr></thead>
          <tbody>
            {searchResults.map(item => {
              const chatRoomId = [user.id, item.supplier._id].sort().join('_');
              const handlePurchaseClick = async () => {
                // Create the order first
                await fetch(`${API_URL}/api/orders`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                  body: JSON.stringify({
                    supplierId: item.supplier._id,
                    inventoryItemId: item._id,
                    chatRoomId: chatRoomId
                  })
                });
                // Then start the chat
                onStartChat(chatRoomId);
              };
              return (
                <tr key={item._id} className="border-b hover:bg-yellow-50">
                  <td className="p-2">{item.supplier.name}</td>
                  <td className="p-2">₹{item.price} / {item.unit}</td>
                  <td className="p-2">{item.quantity} {item.unit.split(' ')[1]}</td>
                  <td className="p-2"><Button onClick={handlePurchaseClick} type="primary" className="w-auto text-xs !py-1 px-3">Purchase & Chat</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ))}
    </Card>
  </div>
);

const VendorDashboard = ({ user, token, onLogout }) => {
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierResults, setSupplierResults] = useState([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState('');

  // Search supplier by name and fetch their inventory
  const handleSupplierSearch = async (e) => {
    e.preventDefault();
    setSupplierLoading(true);
    setSupplierError('');
    setSupplierResults([]);
    try {
      // 1. Find supplier by name
      const supplierRes = await fetch(`${API_URL}/api/users/suppliers/search?name=${encodeURIComponent(supplierSearch)}`, { headers: { 'x-auth-token': token } });
      const supplierData = await supplierRes.json();
      if (!supplierRes.ok || !supplierData.supplier) throw new Error(supplierData.message || 'Supplier not found');
      // 2. Fetch supplier's inventory using the correct backend route
      const invRes = await fetch(`${API_URL}/api/suppliers/${supplierData.supplier._id}/inventory`, { headers: { 'x-auth-token': token } });
      const invData = await invRes.json();
      if (!invRes.ok) throw new Error(invData.message || 'Could not fetch inventory');
      setSupplierResults(invData.items || []);
    } catch (err) {
      setSupplierError(err.message);
    } finally {
      setSupplierLoading(false);
    }
  };
  const [view, setView] = useState('dashboard');
  const [foodItem, setFoodItem] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [chatRoom, setChatRoom] = useState(null);

  const handleGenerateList = async (item) => {
    setFoodItem(item);
    setIsLoading(true);
    setMessage(`Generating ingredients for ${item}...`);
    setIngredients([]);
    setSearchResults([]);
    try {
      const response = await fetch(`${API_URL}/api/ai/generate-ingredients`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify({ foodItem: item }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to generate list.');

      setIngredients(data.ingredients);

      // Show fallback message if AI quota exceeded
      if (data.fallback) {
        setMessage(data.message || 'Using fallback ingredients - AI service temporarily unavailable');
      } else {
        setMessage('');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindSuppliers = async (ingredient) => {
    setSelectedIngredient(ingredient);
    setIsSearching(true);
    setSearchMessage(`Searching for suppliers of ${ingredient}...`);
    setSearchResults([]);
    setView('searchResults');
    try {
      const response = await fetch(`${API_URL}/api/inventory/search/${ingredient}`, { headers: { 'x-auth-token': token } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Search failed.');
      setSearchResults(data);
      setSearchMessage(data.length === 0 ? `No suppliers found for ${ingredient}.` : '');
    } catch (error) {
      setSearchMessage(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = (room) => {
    socket.emit("join_room", { room });
    setChatRoom(room);
    setView('chat');
  };

  const handleChatClosed = async (closedData) => {
    // When chat is closed, create a new order to "request again"
    try {
      setMessage('Sending new request...');

      const chatRoomId = [user.id, closedData.supplier].sort().join('_');

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          supplierId: closedData.supplier,
          inventoryItemId: closedData.inventoryItem._id,
          chatRoomId: chatRoomId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send request');
      }

      setMessage(`✅ New request sent successfully for ${closedData.inventoryItem.itemName}! The supplier will be notified.`);

      // Clear the message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col px-2 md:px-12 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800">Vendor Dashboard</h2>
          <Button onClick={onLogout} type="secondary" className="font-semibold py-2 px-6 text-lg">Logout</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full mb-8">
          <Card className="bg-yellow-50 text-yellow-900 shadow-lg rounded-2xl hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold mb-2">Selected Food Item</h3>
            <p className="text-2xl font-bold">{foodItem || '-'}</p>
          </Card>
          <Card className="bg-green-50 text-green-900 shadow-lg rounded-2xl hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
            <p className="text-2xl font-bold">{ingredients.length}</p>
          </Card>
          <Card className="bg-blue-50 text-blue-900 shadow-lg rounded-2xl hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold mb-2">Suppliers Found</h3>
            <p className="text-2xl font-bold">{searchResults.length}</p>
          </Card>
          <Card className="bg-purple-50 text-purple-900 shadow-lg rounded-2xl hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold mb-2">Status</h3>
            <p className="text-2xl font-bold">{isLoading ? 'Loading...' : 'Ready'}</p>
          </Card>
        </div>
        <Card className="mb-8">
          <h3 className="text-2xl font-bold mb-4">What do you sell?</h3>
          <p className="text-gray-600 mb-4">Select a food item to get an AI-generated list of raw materials.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => handleGenerateList('Vada Pav')} className="w-full">Vada Pav</Button>
            <Button onClick={() => handleGenerateList('Momos')} className="w-full">Momos</Button>
            <Button onClick={() => handleGenerateList('Pani Puri')} className="w-full">Pani Puri</Button>
          </div>
        </Card>
        {(isLoading || ingredients.length > 0) && (
          <Card className="mb-8">
            <h3 className="text-2xl font-bold mb-4">{isLoading ? 'Generating...' : `Shopping List for ${foodItem}`}</h3>
            {isLoading ? (<p>{message}</p>) : (
              <ul className="space-y-3">
                {ingredients.map((ing, index) => (
                  <li key={index} className="p-3 bg-gray-50 rounded-md flex justify-between items-center shadow-sm">
                    <span className="font-medium text-gray-700">{ing}</span>
                    <Button onClick={() => handleFindSuppliers(ing)} type="secondary" className="w-32 px-4 py-1 text-sm">Find Suppliers</Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        {/* Supplier Search Feature */}
        <Card className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Search Supplier & View Store</h3>
          <form className="flex flex-col md:flex-row gap-4 mb-4" onSubmit={handleSupplierSearch}>
            <input type="text" value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} placeholder="Enter supplier name..." className="px-3 py-2 border rounded-md flex-1" required />
            <Button isSubmit={true} className="w-full md:w-auto">Search</Button>
          </form>
          {supplierLoading && <p className="text-blue-600">Loading supplier inventory...</p>}
          {supplierError && <p className="text-red-600">{supplierError}</p>}
          {supplierResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {supplierResults.map(item => (
                <Card key={item._id} className="bg-gray-50 border border-gray-200 flex flex-col items-center">
                  {item.image && <img src={item.image} alt={item.itemName} className="h-20 w-20 object-cover rounded mb-2" />}
                  <h4 className="text-lg font-bold mb-1">{item.itemName}</h4>
                  <p className="text-gray-700">₹{item.price} / {item.unit}</p>
                  <p className="text-gray-500">Stock: {item.quantity}</p>
                </Card>
              ))}
            </div>
          )}
        </Card>
        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes('✅') ? 'bg-green-100 border border-green-400 text-green-700' : message.includes('❌') ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-blue-100 border border-blue-400 text-blue-700'}`}>
            <p className="font-semibold">{message}</p>
          </div>
        )}
      </div>
    );
  }

  if (view === 'searchResults') {
    return (
      <SearchResultsPage
        user={user}
        token={token}
        ingredient={selectedIngredient}
        searchResults={searchResults}
        isLoading={isSearching}
        message={searchMessage}
        onBack={() => setView('dashboard')}
        onStartChat={handleStartChat}
      />
    );
  }

  if (view === 'chat') {
    return <Chat user={user} room={chatRoom} onBack={() => setView('searchResults')} onChatClosed={handleChatClosed} />;
  }
};

// --- Main App Component ---
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [userRole, setUserRole] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const handleSelectRole = (role) => { setUserRole(role); setCurrentScreen('auth'); };
  const handleBackToLanding = () => { setCurrentScreen('landing'); setUserRole(null); };

  const handleLoginSuccess = (user, token) => {
    setLoggedInUser(user);
    setAuthToken(token);
    if (user.role === 'supplier') {
      setCurrentScreen('supplier_dashboard');
    } else if (user.role === 'vendor') {
      setCurrentScreen('vendor_dashboard');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setAuthToken(null);
    setCurrentScreen('landing');
  };

  const renderScreen = () => {
    if (loggedInUser) {
      if (loggedInUser.role === 'supplier') {
        return <SupplierDashboard user={loggedInUser} token={authToken} onLogout={handleLogout} />;
      } else if (loggedInUser.role === 'vendor') {
        return <VendorDashboard user={loggedInUser} token={authToken} onLogout={handleLogout} />;
      }
    }
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen role={userRole} onBack={handleBackToLanding} onLoginSuccess={handleLoginSuccess} />;
      case 'landing':
      default:
        return <LandingScreen onSelectRole={handleSelectRole} />;
    }
  };

  // --- THIS IS THE FIX ---
  // The main container is changed to no longer center its content.
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* The inner container is now full-width. Padding is added for spacing. */}
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8"><h1 className="text-5xl font-bold text-gray-800">RawKart</h1></header>
        <main>{renderScreen()}</main>
        <footer className="text-center mt-8 text-gray-500 text-sm"><p>&copy; 2025 RawKart. Empowering local businesses.</p></footer>
      </div>
    </div>
  );
}