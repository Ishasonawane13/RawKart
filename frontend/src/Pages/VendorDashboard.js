import React, { useState, useEffect } from 'react';
import axios from 'axios'; // npm install axios

const API_URL = 'http://localhost:5000';

// Mock vendor location for the demo
const VENDOR_LOCATION = { lat: 19.0760, lon: 72.8777 }; // Mumbai coordinates

function VendorDashboard() {
    const [foodType, setFoodType] = useState('Vada Pav');
    const [ingredients, setIngredients] = useState([]);
    const [dealResults, setDealResults] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch ingredients when foodType changes
    useEffect(() => {
        if (foodType) {
            axios.get(`${API_URL}/ingredients/${foodType}`)
                .then(res => {
                    // Initialize with default quantity 1
                    const ingredientsWithQuantity = res.data.ingredients.map(name => ({ name, quantity: 1 }));
                    setIngredients(ingredientsWithQuantity);
                })
                .catch(err => console.error(err));
        }
    }, [foodType]);

    const handleQuantityChange = (index, value) => {
        const updatedIngredients = [...ingredients];
        updatedIngredients[index].quantity = parseInt(value, 10) || 0;
        setIngredients(updatedIngredients);
    };

    const handleFindDeals = async () => {
        setLoading(true);
        setDealResults(null);
        try {
            const response = await axios.post(`${API_URL}/find-deals`, {
                ingredients,
                vendorLocation: VENDOR_LOCATION
            });
            setDealResults(response.data);
        } catch (error) {
            console.error("Error fetching deals:", error);
            alert("Failed to fetch deals. See console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ fontFamily: 'Arial', padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1>RawKart Vendor Dashboard 🛒</h1>

            <div style={{ marginBottom: '20px' }}>
                <label>What do you sell? </label>
                <select value={foodType} onChange={e => setFoodType(e.target.value)}>
                    <option value="Vada Pav">Vada Pav</option>
                    <option value="Pani Puri">Pani Puri</option>
                    <option value="Momos">Momos</option>
                </select>
            </div>

            <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h3>Your Ingredient List</h3>
                {ingredients.map((item, index) => (
                    <div key={index} style={{ marginBottom: '10px' }}>
                        <span style={{ display: 'inline-block', width: '150px' }}>{item.name}</span>
                        <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleQuantityChange(index, e.target.value)}
                            style={{ width: '60px', padding: '5px' }}
                        />
                    </div>
                ))}
                <button onClick={handleFindDeals} disabled={loading} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
                    {loading ? 'Searching...' : '🎯 Find Best Deal'}
                </button>
            </div>
            
            {dealResults && (
                 <div style={{ marginTop: '30px', border: '1px solid #4CAF50', padding: '15px', borderRadius: '8px' }}>
                    <h2>✨ Optimized Cart ✨</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f2f2f2' }}>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Ingredient</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Supplier</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Price</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Quantity</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dealResults.optimizedCart.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.productName}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.supplier}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>₹{item.pricePerUnit}/{item.unit}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.quantity} {item.unit}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>₹{item.cost.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     <h3 style={{ textAlign: 'right', marginTop: '20px' }}>Total Estimated Cost: ₹{dealResults.totalCost.toFixed(2)}</h3>
                </div>
            )}
        </div>
    );
}

export default VendorDashboard;