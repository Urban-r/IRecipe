const db = global.db;

// Function to check if the email exists
function findUserByEmail(email) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM Users WHERE email = ?', [email], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

// Function to create a new user with hashed password and API key
function createUser(name, email, hashedPassword, apiKey) {
    return new Promise((resolve, reject) => {
        const sqlQuery = `
            INSERT INTO Users (name, email, password_hash, api_key) 
            VALUES (?, ?, ?, ?)
        `;
        const values = [name, email, hashedPassword, apiKey];
        db.query(sqlQuery, values, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

// Function to fetch a user's API key by user ID
function getApiKeyByUserId(userId) {
    return new Promise((resolve, reject) => {
        db.query('SELECT api_key FROM Users WHERE user_id = ?', [userId], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

module.exports = {
    findUserByEmail,
    createUser,
    getApiKeyByUserId,
};