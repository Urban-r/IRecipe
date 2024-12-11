const express = require("express")
const axios = require('axios'); // For making API requests
const router = express.Router()
const User = require('../models/user'); // User model
const { check, validationResult } = require('express-validator');

// Spoonacular API key and base URL
const API_KEY = 'e2eed91c761e4c34947edc8bd161a543';
const BASE_URL = 'https://api.spoonacular.com/recipes/complexSearch';
const RECIPE_URL = 'https://api.spoonacular.com/recipes/{id}/information';
var global_recipe_id = 0;

const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {
      res.redirect('../users/login') // redirect to the login page
    } else { 
        next (); // move to the next middleware function
    } 
}

// Handle our routes

router.get('/list', redirectLogin, function(req, res, next) {
    let sqlquery = "SELECT * FROM Recipes" // query database to get all the books
    // execute sql query
    db.query(sqlquery, (err, result) => {
        if (err) {
            next(err)
        }
        res.render("list.ejs", {availableRecipe:result})
     })
})

router.get('/search', redirectLogin, function(req, res, next) {
    res.render('search.ejs', { recipes: [], query: '' });
});
router.get('/search_result', (req, res) => {
    const query = req.query.query || '';
    
    // Query the database
    db.query(
      'SELECT * FROM Recipes WHERE title LIKE ?',
      [`%${query}%`],
      (error, results) => {
        if (error) {
          console.error('Error:', error);
          return res.status(500).send('An error occurred while searching for recipes.');
        }
  
        // Render the search.ejs page with the results
        res.render('search.ejs', { recipes: results, query });
      }
    );
  });

  router.get('/my-recipes', (req, res) => {
    const userId = req.session.userId; // Get userId from session
  
    if (!userId) {
      return res.redirect('../users/login'); // Redirect to login if not authenticated
    }
  
    // Query the database to fetch recipes for the logged-in user
    db.query(
      'SELECT * FROM Recipes WHERE user_id = ?',
      [userId],
      (err, rows) => { // Callback to handle the result or error
        console.log(rows);
        if (err) {
          console.error('Error fetching recipes:', err);
          return res.status(500).send('An error occurred while fetching your recipes.');
        }
  
        // Check if any recipes were found
        if (rows && rows.length > 0) {
          res.render('my-recipes.ejs', { recipes: rows });
        } else {
          res.render('my-recipes.ejs', { recipes: [], message: 'No recipes found.' });
        }
      }
    );
  });

  
// Route to handle search
router.get('/api-recipes', async (req, res) => {
  const query = req.query.query || 'Please enter a search term.'; // Get the query from the search form
  
  if (!query) {
    return res.render('api-recipes.ejs', { recipes: [], query: query });
  }
  
    // Make an API request to Spoonacular
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          apiKey: API_KEY,
          query: query,
          number: 10
        }
      });
  
      const recipes = response.data.results; // Get the recipes from the response
      console.log(recipes);
      
      if (!recipes || recipes.length === 0) {
        return res.render('api-recipes.ejs', { recipes: [], query, message: 'No recipes found.' });
      }
  
      // Render the search.ejs page with the results
      res.render('api-recipes.ejs', { recipes, query });
    } catch (error) {
      console.error('Error searching for recipes:', error);
      res.status(500).send('An error occurred while searching for recipes.'+ error);
    }
  });
  // Route to get detailed recipe information

  router.get('/:id', redirectLogin, async (req, res) => {
    const recipeId = req.params.id; // Get recipeId from the URL parameter
    global_recipe_id = recipeId;
    console.log(recipeId);
    
    try {
        // Make an API request to Spoonacular to get detailed recipe information
        const response = await axios.get(RECIPE_URL.replace('{id}', recipeId), {
            params: {
                apiKey: API_KEY
            }
        });
    
        const recipe = response.data; // Get the recipe details from the response
        console.log(".......");
        console.log(recipe);
    
        // Extract the required information
        const recipeDetails = {
            id: recipe.id,
            title: recipe.title,
            ingredients: recipe.extendedIngredients.map(ingredient => ingredient.original),
            instructions: recipe.instructions
        };
    
        // Render a page to display the recipe details
        res.render('recipe-details.ejs', { recipe: recipeDetails });
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        res.status(500).send('An error occurred while fetching the recipe details.');
    }
});
  //route for saving recipes

  router.post('/save-recipe', redirectLogin, async (req, res) => {
    const userId = req.session.userId;
    const recipeId = global_recipe_id;

    // Check if the recipe is already in the database
    db.query(
      'SELECT * FROM Recipes WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId],
      async (err, results) => {
        if (err) {
          console.error('Error checking recipe:', err);
          return res.status(500).send('An error occurred while checking the recipe.');
        }

        if (results.length > 0) {
          // Recipe already exists
            return res.send('Recipe already saved. <a href="/recipes/api-recipes">Go back to search</a>');
        }

        // get the recipe details from the API
        const response = await axios.get(RECIPE_URL.replace('{id}', recipeId), {
          params: {
            apiKey: API_KEY
          }
        });

        const recipe = response.data;

        // Extract the required information
        const recipeDetails = {
          id: recipe.id,
          title: recipe.title,
          ingredients: recipe.extendedIngredients.map(ingredient => ingredient.original),
          instructions: recipe.instructions
        };

        // Save the recipe to the database
        db.query(
          'INSERT INTO Recipes (user_id, recipe_id, title, ingredients, instructions) VALUES (?, ?, ?, ?, ?)',
          [userId, recipeDetails.id, recipeDetails.title, JSON.stringify(recipeDetails.ingredients), recipeDetails.instructions],
          (err) => {
            if (err) {
              console.error('Error saving recipe:', err);
              return res.status(500).send('An error occurred while saving the recipe.');
            }

            res.redirect('../recipes/my-recipes');
          }
        );
      }
    );
  });
  // router to post delete button
  router.post('/delete-recipe', redirectLogin, (req, res) => {
    const userId = req.session.userId;
    const recipeId = req.body.recipeId;
  
    // Delete the recipe from the database
    db.query(
      'DELETE FROM Recipes WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId],
      (err, result) => {
        if (err) {
          console.error('Error deleting recipe:', err);
          return res.status(500).send('An error occurred while deleting the recipe.');
        }
  
        res.redirect('/recipes/my-recipes');
      }
    );
  });
  
    
// Export the router object so index.js can access it
module.exports = router