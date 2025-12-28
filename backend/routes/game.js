const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { determineOutcome, outcomes, overrides, generateGrid } = require('../services/probability');

// Mock Database for quick demo if Supabase fails (in-memory)
const users = {};

router.post('/play', async (req, res) => {
    const { userId, betAmount, selectedIndices, phase, firstSymbol } = req.body;

    // 1. Get User
    let user = users[userId];
    if (!user) {
        user = { id: userId, credits: 100, total_spent: 0 };
        users[userId] = user;
    }

    // Auto-refill for demo 'guest' to avoid "Insufficient credits" 400 error on page reload
    if (userId === 'guest' && user.credits < betAmount) {
        user.credits = 100;
    }

    // PHASE 1: INIT (First Click) - Deduct Money & Decide Outcome
    if (phase === 'init') {
        if (user.credits < betAmount) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }
        user.credits -= betAmount;
        user.total_spent += betAmount;

        const outcome = determineOutcome(user);

        const allSymbols = ['🍎', '🍌', '🍇', '🍒', '💎', '7️⃣'];
        // Store state for the user to retrieve in phase 2
        user.pendingRound = {
            outcome,
            firstSymbol: firstSymbol || allSymbols[Math.floor(Math.random() * 3)],
            betAmount
        };

        return res.json({
            outcome,
            credits: user.credits
        });
    }

    // PHASE 2: COMPLETE (Second Click) - Validate & Reveal
    if (phase === 'complete') {
        const round = user.pendingRound;
        if (!round) {
            // Fallback for "all-in-one" calls if old frontend or restart
            // Just treat as full play (legacy support or stateless mode)
            // For strict 2-step, we'd error. Let's allowing falling through if we want.
            // But for this request, let's assume valid flow.
            // Or recreate a random outcome if missing (stateless safety)
            // But we don't deduct money again.
            // Let's just return error to be safe, or mocks.
            if (!selectedIndices || selectedIndices.length !== 2) return res.status(400).json({ error: "Invalid state" });

            // Quick fix: If no pending round, assume it's lost session, just give a random grid?
            // Or error.
            return res.status(400).json({ error: "Session expired or invalid. Please restart round." });
        }

        const outcome = round.outcome;
        const savedFirstSymbol = round.firstSymbol;

        // Clean up
        delete user.pendingRound;

        // Generate Grid
        // Ensure consistency with what the user already saw (firstSymbol)
        // And what the user just clicked (decided by Outcome + firstSymbol)

        // logic is same as before:
        const [idx1, idx2] = selectedIndices;
        let grid = new Array(6).fill(null);

        grid[idx1] = savedFirstSymbol;

        const allSymbols = ['🍎', '🍌', '🍇', '🍒', '💎', '7️⃣'];

        if (outcome === outcomes.WIN) {
            grid[idx2] = savedFirstSymbol;
            fillRest(grid, allSymbols);
        } else {
            // LOSS or NEAR_MISS
            // 2nd card must NOT match
            let secondSymbol = allSymbols.find(s => s !== savedFirstSymbol);

            // If the client forced a specific second symbol (because it also optimized display),
            // we should respect it IF it matches the outcome. 
            // But usually client derives second symbol FROM outcome. 
            // So client waits for 'init' -> gets Outcome -> Shows X.
            // Then sends X to us? Or just indices?
            // Client sends indices. We generate grid.
            // Client already showed X. We must produce X at idx2.
            // How do we know what Client showed?
            // Simple: Deterministic Logic.
            // Client showed: if (LOSS) -> pick First Available Symbol != savedFirstSymbol.
            // Server must pick SAME 'First Available Symbol'.

            // Let's sync logic:
            // "Find first symbol in ['🍎', '🍌', '🍇'] that is not savedFirstSymbol"
            const gameSymbols = ['🍎', '🍌', '🍇'];
            secondSymbol = gameSymbols.find(s => s !== savedFirstSymbol);

            grid[idx2] = secondSymbol;

            if (outcome === outcomes.NEAR_MISS) {
                const adjacent = findAdjacent(idx2, grid);
                if (adjacent !== -1) grid[adjacent] = savedFirstSymbol;
            }
            fillRest(grid, allSymbols);
        }

        return res.json({
            outcome,
            grid,
            credits: user.credits,
            message: outcome === outcomes.WIN ? "YOU WON!" : "Better luck next time"
        });
    }

    // If neither phase is specified, or for a single-step fallback,
    // we could implement the original logic here.
    // For this change, we assume the frontend will always send a phase.
    return res.status(400).json({ error: "Invalid phase specified." });
});

function fillRest(grid, symbols) {
    // Simple fill (not perfect pair logic for the rest, but visual noise)
    for (let i = 0; i < grid.length; i++) {
        if (!grid[i]) {
            grid[i] = symbols[Math.floor(Math.random() * symbols.length)];
        }
    }
}

function findAdjacent(idx, grid) {
    // 3x2 Grid
    // 0 1
    // 2 3
    // 4 5
    // Adjacency map
    const adj = {
        0: [1, 2],
        1: [0, 3],
        2: [0, 3, 4],
        3: [1, 2, 5],
        4: [2, 5],
        5: [3, 4]
    };
    const candidates = adj[idx] || [];
    return candidates.find(i => grid[i] === null) || -1;
}

module.exports = router;
