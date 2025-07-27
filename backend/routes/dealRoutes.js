const express = require('express');
const router = express.Router();
const aiAlgorithms = require('../utils/aiAlgorithms'); // Your AI logic

// Endpoint for AI-generated shopping list
router.get('/ingredients/:foodItem', (req, res) => {
    const foodItem = req.params.foodItem;
    const ingredients = aiAlgorithms.generateIngredients(foodItem);
    res.json({ ingredients });
});

// Endpoint for Smart Sourcing Recommendations
router.post('/sourcing', (req, res) => {
    const { vendorLocation, requestedIngredients } = req.body;
    if (!vendorLocation || !requestedIngredients || !Array.isArray(requestedIngredients)) {
        return res.status(400).json({ message: "Invalid request body." });
    }
    const recommendations = aiAlgorithms.getSmartSourcingRecommendations(vendorLocation, requestedIngredients);
    res.json({ suppliers: recommendations });
});

module.exports = router;