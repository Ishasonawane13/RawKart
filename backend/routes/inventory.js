// file: backend/routes/inventory.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory'); // Import Inventory model directly

/**
 * @route   POST /api/inventory/add
 * @desc    Add a new inventory item for a supplier
 * @access  Private
 */
router.post('/add', auth, async (req, res) => {
    const { itemName, unit, price, minPrice, quantity } = req.body;
    const supplierId = req.user.id;

    if (!itemName || !price || !minPrice || !quantity) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    try {
        const newItem = new Inventory({
            supplier: supplierId,
            itemName,
            unit,
            price,
            minPrice,
            quantity,
        });

        const item = await newItem.save();
        res.status(201).json(item);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory items for the logged-in supplier
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const items = await Inventory.find({ supplier: req.user.id }).sort({ dateAdded: -1 });
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   GET /api/inventory/search/:ingredient
 * @desc    Search for suppliers selling a specific ingredient
 * @access  Private
 */
router.get('/search/:ingredient', auth, async (req, res) => {
    try {
        const ingredientName = req.params.ingredient;

        // --- THIS IS THE FIX ---
        // Make the search term more flexible to handle plural vs. singular (e.g., "Potatoes" vs "Potato").
        // We create a base term by removing 's' or 'es' if they exist.
        let searchTerm = ingredientName.toLowerCase();
        if (searchTerm.endsWith('es')) {
            searchTerm = searchTerm.slice(0, -2);
        } else if (searchTerm.endsWith('s')) {
            searchTerm = searchTerm.slice(0, -1);
        }

        // Use the more generic search term in our case-insensitive regular expression.
        // This will now match items like "Potato" and "Potatoes".
        const searchRegex = new RegExp(searchTerm, 'i');

        // --- Add logging for easier debugging ---
        console.log(`Original search: "${ingredientName}", Flexible search term: "${searchTerm}"`);

        const results = await Inventory.find({ itemName: searchRegex })
            .populate('supplier', 'name')
            .sort({ price: 1 });

        console.log(`Found ${results.length} results for "${searchTerm}".`);

        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
