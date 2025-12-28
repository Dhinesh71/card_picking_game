const app = require('../backend/server');

module.exports = (req, res) => {
    // Use the express app to handle the request
    app(req, res);
};
