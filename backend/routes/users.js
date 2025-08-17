const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model directly

/**
 * @route   GET /api/suppliers/search
 * @desc    Search for a supplier by name
 * @access  Private
 */
router.get('/suppliers/search', async (req, res) => {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ message: 'Supplier name is required' });
    }
    try {
        const supplier = await User.findOne({ name: { $regex: name, $options: 'i' }, role: 'supplier' });
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json({ supplier });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
    const { name, mobile, password, role } = req.body;
    try {
        let user = await User.findOne({ mobile });
        if (user) {
            return res.status(400).json({ message: 'User with this mobile number already exists' });
        }
        user = new User({ name, mobile, password, role });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user & get JWT
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { mobile, password } = req.body;

    try {
        let user = await User.findOne({ mobile });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({
                    message: "Login successful",
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        mobile: user.mobile,
                        role: user.role
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});


module.exports = router;
