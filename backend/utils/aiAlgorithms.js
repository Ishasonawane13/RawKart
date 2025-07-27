// This file would contain your "AI" logic

const foodItemIngredientsData = {
  "Vada Pav": ["Potato", "Besan", "Cooking Oil", "Pav", "Green Chilli", "Ginger", "Garlic"],
  "Momos": ["Maida (All-Purpose Flour)", "Cabbage", "Carrot", "Onion", "Soy Sauce", "Ginger", "Garlic", "Spring Onion"],
  "Pani Puri": ["Puri", "Potato", "Chickpea", "Tamarind", "Mint", "Coriander", "Green Chilli"],
  // Add more as needed. In a real app, this would be from a DB.
};

// Mock Supplier Data (In a real app, fetched from Firestore/MongoDB)
const mockSuppliersDb = [
    { id: 's1', name: 'Sharma Kirana Store', location: { latitude: 19.077, longitude: 72.878 }, rating: 4.8, inventory: { "Potato": { price: 25, unit: "kg", minPrice: 22 }, "Besan": { price: 40, unit: "kg", minPrice: 38 } } },
    { id: 's2', name: 'Gupta Traders', location: { latitude: 19.072, longitude: 72.871 }, rating: 4.5, inventory: { "Potato": { price: 28, unit: "kg", minPrice: 24 }, "Besan": { price: 38, unit: "kg", minPrice: 35 } } },
    { id: 's3', name: 'Local Veg Mart', location: { latitude: 19.075, longitude: 72.880 }, rating: 4.9, inventory: { "Potato": { price: 26, unit: "kg", minPrice: 23 }, "Green Chilli": { price: 80, unit: "kg", minPrice: 75 } } },
    { id: 's4', name: 'Wholesale Foods', location: { latitude: 19.080, longitude: 72.875 }, rating: 4.2, inventory: { "Maida (All-Purpose Flour)": { price: 35, unit: "kg", minPrice: 32 }, "Cabbage": { price: 20, unit: "kg", minPrice: 18 } } },
    // Add more suppliers and their inventory
];

// Haversine formula to calculate distance between two lat/lon points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// 1. AI-Powered Ingredient Generator (backend version, could be used for validation or more complex generation)
exports.generateIngredients = (foodItem) => {
    return foodItemIngredientsData[foodItem] || [];
};

// 3. Smart Sourcing Algorithm
exports.getSmartSourcingRecommendations = (vendorLocation, requestedIngredients) => {
    const recommendedSuppliers = [];
    const vendorLat = vendorLocation.latitude; // e.g., 19.0760
    const vendorLon = vendorLocation.longitude; // e.g., 72.8777

    requestedIngredients.forEach(reqItem => {
        const itemName = reqItem.name;
        const requestedQuantity = parseFloat(reqItem.quantity);
        const requestedUnit = reqItem.unit;

        let bestDealScore = -Infinity;
        let bestSupplier = null;

        mockSuppliersDb.forEach(supplier => {
            if (supplier.inventory[itemName]) {
                const itemData = supplier.inventory[itemName];
                const supplierLat = supplier.location.latitude;
                const supplierLon = supplier.location.longitude;
                const distance = calculateDistance(vendorLat, vendorLon, supplierLat, supplierLon);

                // For simplicity, let's assume quantity is always available for hackathon
                // Also, let's assume unit conversion is handled (e.g., all kg or all pieces)

                // DealScore = w1*(1/Price) + w2*(1/Distance) + w3*Rating
                // Prioritize price heavily for hackathon demo
                const w1 = 0.6; // Weight for Price
                const w2 = 0.3; // Weight for Distance
                const w3 = 0.1; // Weight for Rating

                // Avoid division by zero if price is 0 (unlikely) or distance is 0 (same location)
                const priceComponent = itemData.price > 0 ? (1 / itemData.price) : 0;
                const distanceComponent = distance > 0 ? (1 / distance) : 0; // Closer is better
                const ratingComponent = supplier.rating / 5; // Normalize rating to 0-1

                const dealScore = (w1 * priceComponent) + (w2 * distanceComponent) + (w3 * ratingComponent);

                if (dealScore > bestDealScore) {
                    bestDealScore = dealScore;
                    bestSupplier = {
                        id: supplier.id,
                        name: supplier.name,
                        itemName: itemName,
                        price: itemData.price,
                        unit: itemData.unit,
                        distance: distance.toFixed(2), // Round to 2 decimal places
                        rating: supplier.rating,
                        contact: supplier.contact, // Add contact for chat later
                        // Add other necessary details
                    };
                }
            }
        });

        if (bestSupplier) {
            recommendedSuppliers.push(bestSupplier);
        }
    });

    // Sort by overall deal score or just return the best for each item as found
    // For hackathon, just returning the found best for each requested item.
    return recommendedSuppliers;
};

// 2. Dynamic Pricing & Competitive Intelligence Engine (Conceptual, background job/trigger)
exports.checkCompetitivePricing = async () => {
    // This function would ideally run as a scheduled job or a trigger
    // whenever a supplier updates their price.

    // 1. Fetch all items and their prices from suppliers
    // 2. Group items by name (e.g., all 'Potato' listings)
    // 3. For each item group, find the minimum price.
    // 4. For suppliers selling above the minPrice (but above their own minPrice threshold),
    //    send a notification suggesting they lower their price.

    // Example logic (highly simplified):
    console.log("Running competitive pricing check...");
    const itemsMarketData = {}; // { "Potato": [{supplierId: 's1', price: 25, minPrice: 22}, ...]}

    mockSuppliersDb.forEach(supplier => {
        for (const itemName in supplier.inventory) {
            const itemData = supplier.inventory[itemName];
            if (!itemsMarketData[itemName]) {
                itemsMarketData[itemName] = [];
            }
            itemsMarketData[itemName].push({
                supplierId: supplier.id,
                supplierName: supplier.name,
                currentPrice: itemData.price,
                minAllowedPrice: itemData.minPrice
            });
        }
    });

    for (const itemName in itemsMarketData) {
        const listings = itemsMarketData[itemName];
        if (listings.length > 1) {
            // Find the lowest current price in the market for this item
            const lowestPrice = Math.min(...listings.map(l => l.currentPrice));

            listings.forEach(listing => {
                if (listing.currentPrice > lowestPrice) {
                    // This supplier is not the cheapest. Suggest lowering price if possible.
                    if (listing.currentPrice > listing.minAllowedPrice) {
                        const suggestedPrice = Math.max(lowestPrice - 1, listing.minAllowedPrice); // Try to beat by 1, or go to min
                        console.log(`Notification for Supplier ${listing.supplierName} (${listing.supplierId}):`);
                        console.log(`  Nearby competitors are selling ${itemName} for ₹${lowestPrice}. Your current price is ₹${listing.currentPrice}.`);
                        console.log(`  Consider lowering your price to ₹${suggestedPrice} to stay competitive.`);
                        // In a real app, this would trigger a push notification or in-app alert.
                    }
                }
            });
        }
    }
};

// You might call checkCompetitivePricing periodically or on price updates.
// setInterval(exports.checkCompetitivePricing, 60 * 60 * 1000); // Every hour (for demo)