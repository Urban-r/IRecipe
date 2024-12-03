const db = global.db;

// Fetch a user by email
exports.getUserByEmail = (email, callback) => {
    const query = `SELECT * FROM Users WHERE email = ?`;
    db.query(query, [email], callback);
};

// Create a new user
exports.createUser = (name, email, passwordHash, callback) => {
    const query = `INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)`;
    db.query(query, [name, email, passwordHash], callback);
};

// Fetch a user by ID
exports.getUserById = (userId, callback) => {
    const query = `SELECT * FROM Users WHERE user_id = ?`;
    db.query(query, [userId], callback);
};