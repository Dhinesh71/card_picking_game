const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    // Simple Mock Login
    const { username } = req.body;
    // Return a mock user ID
    res.json({
        user: {
            id: username || 'guest',
            email: `${username}@example.com`,
            credits: 100
        },
        token: 'mock-jwt-token'
    });
});

module.exports = router;
