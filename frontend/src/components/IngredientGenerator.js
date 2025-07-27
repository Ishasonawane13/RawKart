import React, { useState } from 'react';

const foodItemIngredients = {
  "Vada Pav": ["Potato", "Besan", "Cooking Oil", "Pav", "Green Chilli", "Ginger", "Garlic"],
  "Momos": ["Maida (All-Purpose Flour)", "Cabbage", "Carrot", "Onion", "Soy Sauce", "Ginger", "Garlic", "Spring Onion"],
  "Pani Puri": ["Puri", "Potato", "Chickpea", "Tamarind", "Mint", "Coriander", "Green Chilli"],
  // Add more mappings
};

function IngredientGenerator({ onGenerateList }) {
  const [selectedFoodItem, setSelectedFoodItem] = useState('');
  const [shoppingList, setShoppingList] = useState([]);

  const handleFoodItemChange = (e) => {
    const item = e.target.value;
    setSelectedFoodItem(item);
    if (foodItemIngredients[item]) {
      setShoppingList(foodItemIngredients[item].map(ingredient => ({ name: ingredient, quantity: '', unit: '' })));
    } else {
      setShoppingList([]);
    }
  };

  const handleQuantityChange = (index, value) => {
    const newList = [...shoppingList];
    newList[index].quantity = value;
    setShoppingList(newList);
  };

  const handleUnitChange = (index, value) => {
    const newList = [...shoppingList];
    newList[index].unit = value;
    setShoppingList(newList);
  };

  const handleSubmit = () => {
    // Filter out items without quantity/unit for actual order
    const finalList = shoppingList.filter(item => item.quantity && item.unit);
    onGenerateList(finalList);
  };

  return (
    <div className="ingredient-generator-card">
      <h3>AI-Powered Shopping List Generator</h3>
      <select onChange={handleFoodItemChange} value={selectedFoodItem}>
        <option value="">Select your main food item</option>
        {Object.keys(foodItemIngredients).map(item => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>

      {shoppingList.length > 0 && (
        <div className="shopping-list-preview">
          <h4>Your Suggested Ingredients:</h4>
          {shoppingList.map((item, index) => (
            <div key={index} className="ingredient-item">
              <span>{item.name}</span>
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
              />
              <select
                value={item.unit}
                onChange={(e) => handleUnitChange(index, e.target.value)}
              >
                <option value="">Unit</option>
                <option value="kg">kg</option>
                <option value="gram">gram</option>
                <option value="liter">liter</option>
                <option value="piece">piece</option>
              </select>
            </div>
          ))}
          <button onClick={handleSubmit}>Find Best Price</button>
        </div>
      )}
    </div>
  );
}

export default IngredientGenerator;