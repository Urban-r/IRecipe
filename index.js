// Import express and ejs
var express = require ('express')
var ejs = require('ejs')
var fs = require('fs')
var session = require ('express-session')
var validator = require ('express-validator');
const expressSanitizer = require('express-sanitizer');

//Import mysql module
var mysql = require('mysql2')

// Create the express application object
const app = express()
const port = 8000

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs')

// Set up the body parser 
app.use(express.urlencoded({ extended: true }))

// Create an input sanitizer
app.use(expressSanitizer());

// Set up public folder (for css and statis js)
app.use(express.static(__dirname + '/public'))

// Create a session
app.use(session({
    secret: 'somerandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}))

// Middleware to make `user` available in all templates
app.use((req, res, next) => {
    res.locals.user = req.session.userId || null; // Pass userId or null if not logged in
    next();
  });

// Define the database connection
const db = mysql.createPool ({
    host: 'localhost',
    user: 'irecipe_app',
    password: 'qwertyuiop',
    database: 'irecipe',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
})
// Connect to the database
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database: ' + err.stack)
        return
    }
    console.log('Connected to database.')
    connection.release()
})
global.db = db;

// Define our application-specific data
app.locals.webData = {webName: "iRecipe"}

// Load the route handlers
const mainRoutes = require("./routes/main")
app.use('/', mainRoutes)

// Load the route handlers for /users
const usersRoutes = require('./routes/users')
app.use('/users', usersRoutes)

// Load the route handlers for /recipes
const recipesRoutes = require('./routes/recipes')
app.use('/recipes', recipesRoutes)

// Load the route handlers for /api
const apiRoutes = require('./routes/api')
app.use('/api', apiRoutes)

// Start the web app listening
app.listen(port, () => console.log(`Node app listening on port ${port}!`))
