const express = require('express');
const router = express.Router();

const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {
      res.redirect('../users/login') // redirect to the login page
    } else { 
        next (); // move to the next middleware function
    } 
}
// API route to get recipes by API key
router.get('/recipes', redirectLogin, (req, res) => {
    const { api_key } = req.query; // Get the API key from the query string
  
    if (!api_key) {
      return res.status(400).send('API key is required.');
    }
  
    // Query the Users table to find the user with the given API key
    db.query(
      'SELECT * FROM Users WHERE api_key = ?',
      [api_key],
      (err, users) => {
        if (err) {
          console.error('Error checking API key:', err);
          return res.status(500).send('An error occurred while validating your API key.');
        }
  
        if (users.length === 0) {
          return res.status(401).send('Invalid API key.');
        }
  
        const userId = users[0].user_id;
  
        // Query the Recipes table to get the user's recipes
        db.query(
          'SELECT * FROM Recipes WHERE user_id = ?',
          [userId],
          (err, recipes) => {
            if (err) {
              console.error('Error fetching recipes:', err);
              return res.status(500).send('An error occurred while fetching your recipes.');
            }
  
            // Return the recipes in JSON format
            res.json({ recipes: recipes });
          }
        );
      }
    );
  });

module.exports = router;