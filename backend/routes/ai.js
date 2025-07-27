// file: backend/routes/ai.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const config = require('config');

// Import the Google AI SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Generative AI model with the API key from your config
const genAI = new GoogleGenerativeAI(config.get('geminiApiKey'));

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
        res.status(500).json({ message: "Failed to generate ingredients from AI. Check server logs for details." });
    }
});

module.exports = router;
