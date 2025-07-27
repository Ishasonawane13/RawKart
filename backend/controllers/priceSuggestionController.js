exports.checkPriceSuggestion = (req, res) => {
  const { ingredient, prices } = req.body;
  // prices = [{ name: 'Supplier1', mrp: 35, minPrice: 31 }, {...}]

  if (!ingredient || !prices || prices.length === 0) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const minMarketPrice = Math.min(...prices.map(p => p.minPrice));
  const suggestions = [];

  prices.forEach(supplier => {
    if (supplier.mrp > minMarketPrice) {
      suggestions.push({
        name: supplier.name,
        suggestion: `Consider lowering your price of ${ingredient} to ₹${minMarketPrice} to stay competitive.`,
      });
    }
  });

  res.json({ suggestions });
};
