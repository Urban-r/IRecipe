const db = global.db;

// Fetch all recipes for a user
exports.getRecipesByUserId = (userId, callback) => {
    const query = `SELECT * FROM Recipes WHERE user_id = ?`;
    db.query(query, [userId], callback);
};

// Add a new recipe
exports.addRecipe = (title, description, ingredients, instructions, imageUrl, userId, categoryId, callback) => {
    const query = `
        INSERT INTO Recipes (title, description, ingredients, instructions, image_url, user_id, category_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [title, description, ingredients, instructions, imageUrl, userId, categoryId], callback);
};

// Fetch a recipe by ID
exports.getRecipeById = (recipeId, callback) => {
    const query = `SELECT * FROM Recipes WHERE recipe_id = ?`;
    db.query(query, [recipeId], callback);
};