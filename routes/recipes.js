const express = require("express")
const axios = require('axios'); // For making API requests
const router = express.Router()
const User = require('../models/user'); // User model
const { check, validationResult } = require('express-validator');

// Spoonacular API key and base URL
const API_KEY = 'e2eed91c761e4c34947edc8bd161a543';
const BASE_URL = 'https://api.spoonacular.com/recipes/complexSearch';

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

  router.post('/save-recipe', async (req, res) => {
    const { title, ingredients, instructions } = req.body;
    const userId = req.session.userId; 
  
    if (!userId) {
      return res.status(401).send('You must be logged in to save a recipe.');
    }
  
    try {
      await db.execute(
        'INSERT INTO Recipes (title, ingredients, instructions, user_id) VALUES (?, ?, ?, ?)',
        [title, ingredients, instructions, userId]
      );
      res.redirect('/my-recipes'); // Redirect to the saved recipes page
    } catch (error) {
      console.error('Error saving recipe:', error);
      res.status(500).send('An error occurred while saving the recipe.');
    }
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
    const query = req.query.query; // Get the query from the search form
  
    if (!query) {
      return res.render('api-recipes.ejs', { recipes: [], message: 'Please enter a search term.' });
    }
  
    try {
      // Make a request to the Spoonacular API with the query
      const response = await axios.get(BASE_URL, {
        params: {
          query: query, // Search term
          apiKey: API_KEY, // Spoonacular API key
          number: 10 // Number of results to return
        }
      });
  
      // Check if recipes are found
      const recipes = response.data.results;
  
      // Render the search results page with the data
      console.log(recipes);
      res.render('api-recipes.ejs', { recipes: recipes });
    } catch (error) {
      console.error('Error fetching data from Spoonacular:', error);
      res.status(500).send('An error occurred while fetching recipes.');
    }
  });
  
  router.post('/save', async (req, res) => {
    const { title, ingredients, instructions, external_id } = req.body;
    const userId = req.session.userId; // Get the logged-in user ID

    if (!userId) {
        return res.status(401).send('You must be logged in to save recipes.');
    }

    try {
        const [existingRecipe] = await db.query(
            'SELECT * FROM Recipes WHERE external_id = ? AND user_id = ?',
            [external_id, userId]
        );

        if (existingRecipe.length > 0) {
            // Recipe already saved, redirect to saved recipes page
            return res.redirect('/recipe/saved');
        }

        // Save the recipe to the database
        await db.query(
            'INSERT INTO Recipes (title, ingredients, instructions, external_id, user_id) VALUES (?, ?, ?, ?, ?)',
            [title, ingredients, instructions, external_id, userId]
        );

        res.redirect('/recipes/my-recipes'); // Redirect to saved recipes page or back to search
    } catch (error) {
        console.error('Error saving recipe:', error);
        res.status(500).send('An error occurred while saving the recipe.');
    }
});
    
// Export the router object so index.js can access it
module.exports = router