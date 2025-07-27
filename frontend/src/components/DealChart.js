const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.generateIngredients = async (req, res) => {
  const { food } = req.query;
  if (!food) return res.status(400).json({ error: "Food item required" });

  try {
    const prompt = `List the ingredients needed to make ${food} as a street food vendor in India. Just give a list.`;
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 60,
    });

    const ingredients = response.data.choices[0].text
      .trim()
      .split("\n")
      .map((item) => item.trim());

    res.json({ food, ingredients });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate ingredients." });
  }
};
