const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory'); // Import Inventory model directly
const multer = require('multer');
const storage = multer.memoryStorage();
const User = require('../models/User');

/**
 * @route   GET /api/suppliers/:supplierId/inventory
 * @desc    Get all inventory items for a supplier
 * @access  Private
 */
router.get('/suppliers/:supplierId/inventory', async (req, res) => {
    const { supplierId } = req.params;
    try {
        // Validate supplier exists and is a supplier
        const supplier = await User.findOne({ _id: supplierId, role: 'supplier' });
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        // Find inventory items for this supplier
        const items = await Inventory.find({ supplier: supplierId });
        res.json({ items });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
const upload = multer({ storage });

/**
 * @route   POST /api/inventory/add
 * @desc    Add a new inventory item for a supplier
 * @access  Private
 */
router.post('/add', auth, upload.single('image'), async (req, res) => {
    // Support both JSON and multipart/form-data
    const supplierId = req.user.id;
    let { itemName, unit, price, minPrice, quantity } = req.body;
    let imageBase64 = undefined;
    if (req.file) {
        imageBase64 = req.file.buffer.toString('base64');
    }

    // Accept alternate field names from frontend (for compatibility)
    itemName = itemName || req.body.name;
    unit = unit || req.body.unit;
    price = price || req.body.price;
    minPrice = minPrice || req.body.minOrder;
    quantity = quantity || req.body.quantity;

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
            image: imageBase64,
        });

        const item = await newItem.save();
        res.status(201).json({ success: true, item });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
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
