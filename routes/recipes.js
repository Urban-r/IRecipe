const express = require("express")
const router = express.Router()
const User = require('../models/user'); // User model
const { check, validationResult } = require('express-validator');

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

// Export the router object so index.js can access it
module.exports = router