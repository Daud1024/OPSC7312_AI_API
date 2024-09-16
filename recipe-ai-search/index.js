const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const COHERE_API_KEY = 'BR9hfPf6n7V8nzO7QNh336UtZ94cym9gtdIxqBWm'; // Cohere API Key
const SPOONACULAR_API_KEY = '8e1ba6d0e4644edabd75a6f30c4ea6e8'; // Spoonacular

const COHERE_API_URL = 'https://api.cohere.ai/v1/embeddings';

// Define an endpoint to perform the search
app.post('/search', async (req, res) => {
    const { query } = req.body;

    try {
        // Generate embeddings for the search query using Cohere
        const cohereResponse = await axios.post(COHERE_API_URL, {
            texts: [query],
            model: 'large',
            truncate: 'END'
        }, {
            headers: {
                Authorization: `Bearer ${COHERE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const queryEmbedding = cohereResponse.data.embeddings[0];

        // Use Spoonacular API to search for recipes related to the query
        const spoonacularResponse = await axios.get(
            `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=10&apiKey=${SPOONACULAR_API_KEY}`
        );

        // Map over recipes to get the relevant details
        const recipes = spoonacularResponse.data.results.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            url: `https://spoonacular.com/recipes/${recipe.title.replace(/\s+/g, "-")}-${recipe.id}`
        }));

        // Return the list of recipes to the client
        res.json({ recipes });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching recipes.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
