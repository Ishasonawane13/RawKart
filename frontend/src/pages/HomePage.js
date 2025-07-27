import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = ({ user, gullyOrders }) => {
  if (!user) {
    return <p className="text-center text-red-500">User information not available. Please log in.</p>;
  }

  const { role, name } = user;

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString(); // Adjust to your desired locale format
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'text-green-600';
      case 'closed':
        return 'text-red-600';
      case 'delivered':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        {role === 'vendor' ? 'Street Vendor Dashboard' : 'Raw Material Supplier Dashboard'}
      </h2>

      {role === 'vendor' && (
        <div className="vendor-dashboard">
          <p className="text-gray-600 mb-4">Welcome, {name}! Here are the active Gully Orders near you.</p>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Active Collective Orders</h3>
          <div className="space-y-4">
            {gullyOrders.filter(order => order.status === 'open').length > 0 ? (
              gullyOrders.filter(order => order.status === 'open').map(order => (
                <div key={order.id} className="bg-gray-100 p-4 rounded-lg shadow-sm text-left border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800">{order.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{order.location}</p>
                  <p className="text-sm text-gray-700">Deadline: {formatDate(order.deadline)}</p>
                  <p className={`text-sm font-semibold ${getOrderStatusColor(order.status)} capitalize`}>Status: {order.status}</p>
                  <Link to={`/gully-orders/${order.id}`} className="block mt-3 text-yellow-600 hover:underline font-medium">
                    View Details & Join Order
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No active Gully Orders at the moment. Check back later!</p>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-4">Your Past Contributions</h3>
          <div className="space-y-4">
            {gullyOrders.filter(order => order.currentContributions[user.id] && Object.keys(order.currentContributions[user.id]).length > 0).length > 0 ? (
              gullyOrders.filter(order => order.currentContributions[user.id] && Object.keys(order.currentContributions[user.id]).length > 0).map(order => (
                <div key={order.id} className="bg-gray-100 p-4 rounded-lg shadow-sm text-left border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800">{order.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{order.location}</p>
                  <p className={`text-sm font-semibold ${getOrderStatusColor(order.status)} capitalize`}>Status: {order.status}</p>
                  <p className="text-sm text-gray-700">Your contribution:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {Object.entries(order.currentContributions[user.id]).map(([itemId, quantity]) => {
                      const item = order.items.find(i => i.id === itemId);
                      return item ? <li key={itemId}>{item.name}: {quantity} {item.unit}</li> : null;
                    })}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-gray-500">You haven't contributed to any Gully Orders yet.</p>
            )}
          </div>
        </div>
      )}

      {role === 'supplier' && (
        <div className="supplier-dashboard">
          <p className="text-gray-600 mb-4">Welcome, {name}! Here are the Gully Orders seeking suppliers.</p>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Available Gully Orders for Bidding</h3>
          <div className="space-y-4">
            {gullyOrders.filter(order => order.status === 'open' && !order.supplierBid).length > 0 ? (
              gullyOrders.filter(order => order.status === 'open' && !order.supplierBid).map(order => (
                <div key={order.id} className="bg-gray-100 p-4 rounded-lg shadow-sm text-left border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800">{order.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{order.location}</p>
                  <p className="text-sm text-gray-700">Deadline for order: {formatDate(order.deadline)}</p>
                  <p className="text-sm text-gray-700">Items needed:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {order.items.map(item => (
                      <li key={item.id}>{item.name}: {item.requiredTotal} {item.unit}</li>
                    ))}
                  </ul>
                  {/* In a real app, this would link to a bidding form */}
                  <button className="block mt-3 text-blue-600 hover:underline font-medium cursor-not-allowed opacity-50">
                    Place Bid (Coming Soon!)
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No new Gully Orders seeking suppliers at the moment.</p>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-4">Your Past Fulfilled Orders</h3>
          <div className="space-y-4">
            {gullyOrders.filter(order => order.status === 'delivered' && order.supplierBid?.supplierId === user.id).length > 0 ? (
              gullyOrders.filter(order => order.status === 'delivered' && order.supplierBid?.supplierId === user.id).map(order => (
                <div key={order.id} className="bg-gray-100 p-4 rounded-lg shadow-sm text-left border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800">{order.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{order.location}</p>
                  <p className={`text-sm font-semibold ${getOrderStatusColor(order.status)} capitalize`}>Status: {order.status}</p>
                  <p className="text-sm text-gray-700">Your Bid: ₹{order.supplierBid.price}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">You haven't fulfilled any Gully Orders yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/profile" className="text-yellow-600 hover:underline">View Your Profile</Link>
      </div>
    </div>
  );
};

export default HomePage;