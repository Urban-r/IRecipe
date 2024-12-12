// Create a new router
const express = require("express")
const router = express.Router()
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const saltRounds = 10
const User = require('../models/user'); // User model
const { check, validationResult } = require('express-validator');

const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {
      res.redirect('./login') // redirect to the login page
    } else { 
        next (); // move to the next middleware function
    } 
}

// Function to generate a random API key
function generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }


router.get('/register', function (req, res, next) {
    res.render('register.ejs')                                                               
})    

router.post('/register', [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number'),
    check('name').notEmpty().withMessage('Name is required'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send('Invalid input. <a href="/users/register">Try again</a>');
    }

    const { name, email, password } = req.body;
    const apiKey = generateApiKey();

    try {
        // Check if the email is already registered
        db.query('SELECT * FROM Users WHERE email = ?', [email], async (err, result) => {
            if (err) return next(err);

            if (result.length > 0) {
                return res.send('Email is already registered. <a href="/users/register">Try again</a>');
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert the new user into the database
            await User.createUser(name, email, hashedPassword, apiKey).then(() => {
                res.redirect('../users/login');
            });
        });
    } catch (err) {
        next(err);
    }
});

router.get('/login', function (req, res, next) {
    res.render('login.ejs')                                                               
})

router.post('/login', [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send('Invalid email or password' + '<a href='+'/users/login'+'>Try again</a>');
    }

    const { email, password } = req.body;

    try {
        // Check if the user exists
        const result = await User.findUserByEmail(email);

        if (result.length === 0) {
            return res.send('Invalid email or password' + '<a href='+'/users/login'+'>Try again</a>');
                    }

        const user = result[0];

        // Compare the provided password with the hashed password
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.send('Invalid email or password' + '<a href='+'/users/login'+'>Try again</a>');
        }

        req.session.userId = user.user_id;

        res.redirect('../'); // Redirect to the home page
    } catch (err) {
        next(err);
    }
});

router.get('/logout', redirectLogin, (req,res) => {
    req.session.destroy(err => {
    if (err) {
      return res.redirect('/')
    }
    res.send('you are now logged out. <a href='+'/'+'>Home</a>');
    })
})

// Route to display the user's API key
router.get('/profile',redirectLogin, async (req, res) => {
    const userId = req.session.userId; // Get userId from session

    // Query the Users table to get the user's API key
    const result = await User.getApiKeyByUserId(userId);
  
    if (result.length === 0) {
        return res.status(404).send('User not found.');
    }

    const apiKey = result[0].api_key;
    
    res.render('profile.ejs', { apiKey: apiKey });
      });

// Export the router object so index.js can access it
module.exports = router