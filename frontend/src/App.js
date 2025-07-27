import React, { useState, useEffect } from 'react';
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
  <div className="text-center">
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
    <div>
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
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [chatClosed, setChatClosed] = useState(false);
  const [closedData, setClosedData] = useState(null);
  const [supplierJoined, setSupplierJoined] = useState(true); // Allow both vendor and supplier to send messages immediately

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
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

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

    const supplierJoinedHandler = (data) => {
      setSupplierJoined(true);
      setMessageList((list) => [...list, {
        author: "System",
        message: data.message,
        time: new Date().toLocaleTimeString(),
        isSystem: true,
        isPositive: true
      }]);
    };

    socket.on("receive_message", messageHandler);
    socket.on("previous_messages", previousMessagesHandler);
    socket.on("chat_closed", chatClosedHandler);
    socket.on("supplier_joined", supplierJoinedHandler);

    return () => {
      socket.off("receive_message", messageHandler);
      socket.off("previous_messages", previousMessagesHandler);
      socket.off("chat_closed", chatClosedHandler);
      socket.off("supplier_joined", supplierJoinedHandler);
    };
  }, [room, user.role]);

  const handleRequestAgain = () => {
    if (onChatClosed) {
      onChatClosed(closedData);
    }
    onBack();
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
          {messageList.map((msg, index) => (
            <div key={index} className={`flex mb-2 ${msg.isSystem ? "justify-center" : (msg.author === user.name ? "justify-end" : "justify-start")}`}>
              <div className={`rounded-lg p-3 max-w-xs ${getMessageStyle(msg)}`}>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${getMessageTextStyle(msg)}`}>{msg.author} @ {msg.time}</p>
              </div>
            </div>
          ))}
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
  const [view, setView] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState({ itemName: '', unit: 'per Kg', price: '', minPrice: '', quantity: '' });
  const [message, setMessage] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [chatRoom, setChatRoom] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setMessage('Loading data...');
      try {
        const [invResponse, ordersResponse] = await Promise.all([
          fetch(`${API_URL}/api/inventory`, { headers: { 'x-auth-token': token } }),
          fetch(`${API_URL}/api/orders/supplier`, { headers: { 'x-auth-token': token } })
        ]);
        const invData = await invResponse.json();
        const ordersData = await ordersResponse.json();
        if (!invResponse.ok || !ordersResponse.ok) throw new Error('Failed to fetch data.');
        setInventory(invData);
        setOrders(ordersData);
        setMessage('');
      } catch (error) {
        setMessage(error.message);
      }
    };

    if (token) {
      fetchData();

      // Join supplier-specific room for real-time notifications
      socket.emit('join_user_room', { userId: user.id, role: 'supplier' });

      // Listen for new orders
      const newOrderHandler = (data) => {
        setOrders(prevOrders => [data.order, ...prevOrders]);
        setMessage(`🔔 ${data.message}`);
        // Clear notification after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      };

      socket.on('new_order', newOrderHandler);

      return () => {
        socket.off('new_order', newOrderHandler);
      };
    }
  }, [token, user.id]);

  const handleInputChange = (e) => { setNewItem({ ...newItem, [e.target.name]: e.target.value }); };
  const handleAddItem = async (e) => {
    e.preventDefault();
    setFormMessage('Adding item...');
    try {
      const response = await fetch(`${API_URL}/api/inventory/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify(newItem),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add item.');
      setInventory([data, ...inventory]);
      setNewItem({ itemName: '', unit: 'per Kg', price: '', minPrice: '', quantity: '' });
      setFormMessage('Item added successfully!');
    } catch (error) {
      setFormMessage(error.message);
    }
  };

  const handleJoinChat = (room) => {
    socket.emit("join_room", { room });
    setChatRoom(room);
    setView('chat');
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete order.');
      }

      // Remove the deleted order from the state
      setOrders(orders.filter(order => order._id !== orderId));
      setMessage('Order deleted successfully!');

      // Clear the message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  if (view === 'chat') {
    return <Chat user={user} room={chatRoom} onBack={() => setView('dashboard')} onChatClosed={() => { }} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-gray-800">Supplier Dashboard</h2><Button onClick={onLogout} type="secondary" className="font-semibold py-2 px-4 text-sm">Logout</Button></div>
      <p className="mb-8 text-gray-600">Welcome, <span className="font-semibold text-yellow-600">{user.name}</span>!</p>

      <Card className="mb-8">
        <h3 className="text-xl font-bold mb-4">Incoming Purchase Requests</h3>
        {orders.length > 0 ? (
          <ul className="space-y-2">{orders.map(order => (
            <li key={order._id} className="p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{order.vendor.name} wants to buy {order.inventoryItem.itemName}</p>
                  <p className="text-xs text-gray-500">Request received on {new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => handleJoinChat(order.chatRoomId)} type="primary" className="w-auto text-sm !py-2 px-4">Join Chat</Button>
                  <Button onClick={() => handleDeleteOrder(order._id)} type="secondary" className="w-auto text-sm !py-2 px-4 bg-red-500 text-white hover:bg-red-600">Delete</Button>
                </div>
              </div>
            </li>
          ))}</ul>
        ) : (<p>You have no new purchase requests.</p>)}
        {message && <p className="text-center mt-4 text-sm text-green-600">{message}</p>}
      </Card>

      <Card className="mb-8">
        <h3 className="text-xl font-bold mb-4">Add New Item</h3>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="itemName" value={newItem.itemName} onChange={handleInputChange} placeholder="Item Name (e.g., Potatoes)" required className="px-3 py-2 border rounded-md" />
          <input type="number" name="price" value={newItem.price} onChange={handleInputChange} placeholder="Price (MRP)" required className="px-3 py-2 border rounded-md" />
          <input type="number" name="minPrice" value={newItem.minPrice} onChange={handleInputChange} placeholder="Minimum Price" required className="px-3 py-2 border rounded-md" />
          <input type="number" name="quantity" value={newItem.quantity} onChange={handleInputChange} placeholder="Stock Quantity" required className="px-3 py-2 border rounded-md" />
          <select name="unit" value={newItem.unit} onChange={handleInputChange} className="px-3 py-2 border rounded-md bg-white"><option>per Kg</option><option>per Litre</option><option>per Dozen</option><option>per Item</option></select>
          <Button isSubmit={true} className="md:col-span-2 w-full">Add Item to Inventory</Button>
        </form>
        {formMessage && <p className="text-center mt-4">{formMessage}</p>}
      </Card>
      <Card>
        <h3 className="text-xl font-bold mb-4">Your Current Inventory</h3>
        {message ? <p>{message}</p> : (inventory.length > 0 ? (<ul className="space-y-2">{inventory.map(item => (<li key={item._id} className="p-2 bg-gray-50 rounded-md flex justify-between"><span>{item.itemName}</span><span>₹{item.price} / {item.unit}</span></li>))}</ul>) : (<p>You haven't added any items yet.</p>))}
      </Card>
    </div>
  );
};

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
      <div>
        <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-gray-800">Vendor Dashboard</h2><Button onClick={onLogout} type="secondary" className="font-semibold py-2 px-4 text-sm">Logout</Button></div>
        <p className="mb-8 text-gray-600">Welcome, <span className="font-semibold text-yellow-600">{user.name}</span>! Let's find you the best deals.</p>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes('✅') ? 'bg-green-100 border border-green-400 text-green-700' : message.includes('❌') ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-blue-100 border border-blue-400 text-blue-700'}`}>
            <p className="font-semibold">{message}</p>
          </div>
        )}

        <Card className="mb-8">
          <h3 className="text-xl font-bold mb-4">What do you sell?</h3>
          <p className="text-gray-600 mb-4">Select a food item to get an AI-generated list of raw materials.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => handleGenerateList('Vada Pav')} className="w-full">Vada Pav</Button>
            <Button onClick={() => handleGenerateList('Momos')} className="w-full">Momos</Button>
            <Button onClick={() => handleGenerateList('Pani Puri')} className="w-full">Pani Puri</Button>
          </div>
        </Card>
        {(isLoading || ingredients.length > 0) && (
          <Card>
            <h3 className="text-xl font-bold mb-4">{isLoading ? 'Generating...' : `Shopping List for ${foodItem}`}</h3>
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

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8"><h1 className="text-5xl font-bold text-gray-800">RawKart</h1></header>
        <main>{renderScreen()}</main>
        <footer className="text-center mt-8 text-gray-500 text-sm"><p>&copy; 2025 RawKart. Empowering local businesses.</p></footer>
      </div>
    </div>
  );
}
