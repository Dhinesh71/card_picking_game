const express = require('express');
const router = express.Router();
const { overrides, config } = require('../services/probability');

// GET Stats (Mock)
router.get('/stats', (req, res) => {
    res.json({
        activePlayers: 1,
        config
    });
});

// POST Set Difficulty
router.post('/config', (req, res) => {
    const { difficulty } = req.body;
    if (difficulty) config.difficulty = difficulty;
    res.json({ success: true, config });
});

// POST Force Outcome
router.post('/override', (req, res) => {
    const { userId, outcome } = req.body; // 'WIN', 'LOSS'
    overrides.set(userId, outcome);
    res.json({ success: true, message: `Next game for ${userId} set to ${outcome}` });
});

module.exports = router;
