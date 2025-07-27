// File: backend/test_db.js
// A simple script to test ONLY the MongoDB connection.

// 1. Import Mongoose
const mongoose = require('mongoose');

// 2. Get the connection string from your config file
// This ensures we are testing the exact same string your app uses.
const config = require('config');
const db = config.get('mongoURI');

// 3. Define the connection function
const connectToMongo = async () => {
    console.log('--- Starting Connection Test ---');
    console.log('Attempting to connect to MongoDB Atlas...');

    try {
        // Try to connect using the URI from your default.json
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Set a short timeout to fail faster if there's a network issue
            serverSelectionTimeoutMS: 5000
        });

        // If the line above does not throw an error, the connection is successful
        console.log('✅✅✅ SUCCESS! You are connected to MongoDB! ✅✅✅');

    } catch (error) {
        // If there was any error during connection
        console.error('❌❌❌ FAILED TO CONNECT! ❌❌❌');
        console.error('Error Details:');

        // Log specific, helpful error messages
        if (error.name === 'MongooseServerSelectionError') {
            console.error('This is likely a NETWORK or AUTHENTICATION issue.');
            console.error('Reason:', error.reason.toString());
            console.error('\nTroubleshooting Steps:');
            console.error('1. Double-check the password in your backend/config/default.json file.');
            console.error('2. Ensure your IP Address (0.0.0.0/0) is whitelisted in MongoDB Atlas -> Network Access.');
        } else {
            console.error(error);
        }
    } finally {
        // Close the connection so the script can exit
        await mongoose.connection.close();
        console.log('--- Connection Test Finished ---');
    }
};

// 4. Run the connection test
connectToMongo();
