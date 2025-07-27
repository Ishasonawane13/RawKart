import React from 'react';

function SupplierCard({ supplier, onPlaceOrder }) {
  return (
    <div className="supplier-card">
      <h4>{supplier.name} <span className="verified-badge">Verified</span></h4>
      <p>Item: {supplier.itemName} - Price: ₹{supplier.price}/{supplier.unit}</p>
      <p>Distance: {supplier.distance} km</p>
      <p>Rating: {supplier.rating} ⭐</p>
      <button onClick={() => onPlaceOrder(supplier)}>Place Order</button>
    </div>
  );
}

export default SupplierCard;