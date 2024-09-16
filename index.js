const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const COHERE_API_KEY = 'BR9hfPf6n7V8nzO7QNh336UtZ94cym9gtdIxqBWm'; // Get from Cohere
const SPOONACULAR_API_KEY = '8e1ba6d0e4644edabd75a6f30c4ea6e8'; // Get from Spoonacular

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
        const spoonacularSearchResponse = await axios.get(
            `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=10&apiKey=${SPOONACULAR_API_KEY}`
        );

        // Retrieve detailed information for each recipe
        const recipeDetailsPromises = spoonacularSearchResponse.data.results.map(async (recipe) => {
            const recipeDetailsResponse = await axios.get(
                `https://api.spoonacular.com/recipes/${recipe.id}/information?includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
            );
            const recipeDetails = recipeDetailsResponse.data;

            return {
                id: recipeDetails.id,
                title: recipeDetails.title,
                image: recipeDetails.image,
                ingredients: recipeDetails.extendedIngredients.map(ingredient => ingredient.original),
                instructions: recipeDetails.instructions,
                calories: recipeDetails.nutrition.nutrients.find(nutrient => nutrient.name === "Calories")?.amount || 'N/A',
                url: `https://spoonacular.com/recipes/${recipeDetails.title.replace(/\s+/g, "-")}-${recipeDetails.id}`
            };
        });

        // Wait for all recipe details to be fetched
        const recipes = await Promise.all(recipeDetailsPromises);

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
