// Create a new router
const express = require("express")
const router = express.Router()
const bcrypt = require('bcrypt')
const saltRounds = 10
const User = require('../models/user'); // User model
const { check, validationResult } = require('express-validator');

const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {
      res.redirect('.../users/login') // redirect to the login page
    } else { 
        next (); // move to the next middleware function
    } 
}


router.get('/register', function (req, res, next) {
    res.render('register.ejs')                                                               
})    

router.post('/register', [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    check('name').notEmpty().withMessage('Name is required'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        // Check if the email is already registered
        db.query('SELECT * FROM Users WHERE email = ?', [email], async (err, result) => {
            if (err) return next(err);

            if (result.length > 0) {
                return res.status(400).json({ error: 'Email is already registered' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert the new user into the database
            const sqlQuery = `
                INSERT INTO Users (name, email, password_hash) 
                VALUES (?, ?, ?)
            `;
            const values = [name, email, hashedPassword];
            db.query(sqlQuery, values, (err, result) => {
                if (err) return next(err);

                res.status(201).send(`User ${name} registered successfully!`);
            });
        });
    } catch (err) {
        next(err);
    }
});

router.get('/login', function (req, res, next) {
    res.render('login.ejs')                                                               
})
// Handle login
/**
 * Login a user
 */
router.post('/login', [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('login', {
            errors: errors.array()  // Pass errors to EJS view
        });
    }

    const { email, password } = req.body;

    try {
        // Check if the user exists
        db.query('SELECT * FROM Users WHERE email = ?', [email], async (err, result) => {
            if (err) return next(err);

            if (result.length === 0) {
                return res.send('Invalid email or password');
                        }

            const user = result[0];

            // Compare the provided password with the hashed password
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.send('Invalid email or password');
            }

            // Assuming you have session management (e.g., express-session)
            req.session.userId = user.user_id;

            res.send(`Welcome back, ${user.name}!`);
        });
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

// Export the router object so index.js can access it
module.exports = router