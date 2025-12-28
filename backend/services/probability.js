const outcomes = {
    WIN: 'WIN',
    LOSS: 'LOSS',
    NEAR_MISS: 'NEAR_MISS'
};

// Admin Overrides (In-memory for speed/demo)
const overrides = new Map(); // userId -> outcome

// Configuration
let config = {
    difficulty: 'MEDIUM', // EASY, MEDIUM, HARD
    simulationMode: true
};

const getTier = (creditsSpent) => {
    if (creditsSpent < 50) return 'A';
    if (creditsSpent < 200) return 'B';
    return 'C';
};

const determineOutcome = (user) => {
    // Check override
    if (overrides.has(user.id)) {
        const outcome = overrides.get(user.id);
        overrides.delete(user.id);
        return outcome;
    }

    const tier = getTier(user.total_spent || 0);
    const random = Math.random();

    // Basic Probability Logic
    let winChance = 0.5; // Default

    // Tier Logic
    if (tier === 'A') winChance = 0.8;
    else if (tier === 'B') winChance = 0.4;
    else if (tier === 'C') winChance = 0.1;

    // Config Modifiers
    if (config.difficulty === 'EASY') winChance += 0.1;
    if (config.difficulty === 'HARD') winChance -= 0.1;

    if (random < winChance) return outcomes.WIN;

    // If Loss, decide if Near Miss (High chance of near miss to induce "almost there" feeling)
    return Math.random() < 0.7 ? outcomes.NEAR_MISS : outcomes.LOSS;
};

// Generate Card Grid (2x2 or 3x2 for simplicity)
// Let's do 6 cards (3 pairs) for the demo
const generateGrid = (outcome, winningSymbol) => {
    // Symbols: A, B, C
    // Logic to place cards based on outcome
    // If WIN: User picks 2, they match.
    // Actually, standard flow: Server generates grid, User picks.
    // BUT: "Backend always decides win/loss before cards are shown"
    // Wait, if user picks freely, how do we force win? -> Illusion of choice.
    // "Frontend only visualizes results"
    // APPROACH: 
    // 1. User sees face down cards.
    // 2. User clicks Card 1. (Frontend request? No, usually just local).
    // 3. User clicks Card 2. Request sent to server: "I picked index 0 and 1".
    // 4. Server says: "You picked A and ... A!" (If win).
    // OR Server says: "You picked A and ... B!" (If loss).
    // The server effectively "morphs" the hidden values to match the decided outcome.
    // This is the true manipulation.

    // However, prompts says "Wrong Card Disclosure... Reveal the correct card pair BEFORE next round".
    // This implies there was a "true" board state? 
    // Or do we generate the "True" board state AFTER the choice to fit the narrative?
    // "Decide outcome BEFORE card reveal"

    // Let's implement dynamic assignment:
    // User sends indices [i, j]
    // Server checks decided outcome (WIN/LOSS).
    // If WIN: Assign Matching Pair to [i, j]. Fill rest randomly.
    // If LOSS: Assign Mismatch to [i, j]. 
    // If NEAR_MISS: Assign Mismatch to [i, j], but make sure the "Match" for the first card is adjacent to the second selection.

    return {
        outcome, // Just primarily for logic, frontend needs the symbols.
        // We will return the 'revealed' symbols for the selected cards, and the 'full' grid for the reveal phase.
    };
};

module.exports = {
    determineOutcome,
    getTier,
    outcomes,
    overrides,
    config,
    generateGrid
};
