// file: backend/routes/ai.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import the Google AI SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Validate that the API key exists
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables');
}

// Initialize the Generative AI model with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Predefined fallback ingredients for common Indian street foods
const fallbackIngredients = {
    'vada pav': ['Potatoes', 'Green chilies', 'Ginger', 'Mustard seeds', 'Curry leaves', 'Turmeric', 'Bread rolls', 'Chickpea flour', 'Oil', 'Tamarind chutney'],
    'momos': ['All-purpose flour', 'Minced meat/vegetables', 'Onions', 'Garlic', 'Ginger', 'Soy sauce', 'Salt', 'Black pepper', 'Green chilies', 'Coriander leaves'],
    'pani puri': ['Semolina', 'All-purpose flour', 'Potatoes', 'Chickpeas', 'Tamarind', 'Mint leaves', 'Green chilies', 'Ginger', 'Black salt', 'Cumin powder'],
    'dosa': ['Rice', 'Black gram dal', 'Fenugreek seeds', 'Salt', 'Oil', 'Potatoes', 'Onions', 'Mustard seeds', 'Curry leaves', 'Turmeric'],
    'samosa': ['All-purpose flour', 'Potatoes', 'Green peas', 'Onions', 'Ginger', 'Green chilies', 'Cumin seeds', 'Coriander seeds', 'Garam masala', 'Oil'],
    'chaat': ['Potatoes', 'Chickpeas', 'Yogurt', 'Tamarind chutney', 'Mint chutney', 'Onions', 'Tomatoes', 'Sev', 'Chat masala', 'Green chilies'],
    'default': ['Flour', 'Oil', 'Salt', 'Onions', 'Tomatoes', 'Green chilies', 'Ginger', 'Garlic', 'Spices', 'Water']
};

/**
 * @route   POST /api/ai/generate-ingredients
 * @desc    Generate a list of ingredients for a food item using Gemini
 * @access  Private
 */
router.post('/generate-ingredients', auth, async (req, res) => {
    const { foodItem } = req.body;

    if (!foodItem) {
        return res.status(400).json({ message: 'Food item is required.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `You are a helpful assistant for Indian street food vendors. List the top 10 most essential raw material ingredients needed to make street-style ${foodItem}. Return the answer ONLY as a valid JSON array of strings. Do not include any other text, explanations, or markdown formatting like \`\`\`json. For example: ["Ingredient 1", "Ingredient 2"]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        // Check if the AI response was blocked due to safety settings
        if (!response.text) {
            console.error("Gemini API response was blocked or empty. Response details:", response);
            throw new Error('The AI response was blocked, possibly due to safety settings or an empty response.');
        }

        let text = response.text();

        console.log("Raw response from Gemini:", text);

        // --- MORE ROBUST FIX ---
        // Use a regular expression to find the JSON array within the text.
        // This is much more reliable than checking for specific start/end strings.
        const jsonMatch = text.match(/\[.*\]/s);

        if (!jsonMatch) {
            console.error("Could not find a valid JSON array in the AI response.");
            throw new Error("AI returned a response in an unexpected format.");
        }

        // We parse the extracted JSON string into a real JavaScript array.
        const ingredients = JSON.parse(jsonMatch[0]);

        res.json({ ingredients });

    } catch (error) {
        console.error("--- ERROR CALLING GEMINI API ---");
        console.error("Full Error Object:", error);

        // Check if it's a quota exceeded error (429)
        if (error.status === 429) {
            console.log("🔄 Quota exceeded, using fallback ingredients for:", foodItem);

            // Try to find fallback ingredients for the food item
            const foodKey = foodItem.toLowerCase().trim();
            let fallbackIngredientsList = fallbackIngredients[foodKey];

            // If no specific fallback found, try partial matches
            if (!fallbackIngredientsList) {
                const matchingKey = Object.keys(fallbackIngredients).find(key =>
                    foodKey.includes(key) || key.includes(foodKey)
                );
                fallbackIngredientsList = fallbackIngredients[matchingKey] || fallbackIngredients.default;
            }

            return res.json({
                ingredients: fallbackIngredientsList,
                message: "Using fallback ingredients - AI quota exceeded for today",
                fallback: true
            });
        }

        // For other errors, still provide fallback
        console.log("🔄 Using fallback ingredients due to AI error for:", foodItem);
        const foodKey = foodItem.toLowerCase().trim();
        let fallbackIngredientsList = fallbackIngredients[foodKey] || fallbackIngredients.default;

        res.json({
            ingredients: fallbackIngredientsList,
            message: "Using fallback ingredients - AI service temporarily unavailable",
            fallback: true
        });
    }
});

module.exports = router;
