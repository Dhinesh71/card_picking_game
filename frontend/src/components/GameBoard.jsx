import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

const CARD_BACK = "🃏";

export default function GameBoard({ user, onUpdateUser }) {
    const [cards, setCards] = useState(new Array(6).fill(null));
    const [flippedIndices, setFlippedIndices] = useState([]); // [0, 1]
    const [matchedIndices, setMatchedIndices] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [gameState, setGameState] = useState('IDLE'); // IDLE, FLIPPED_ONE, REVEALING, RESULT
    const [lastOutcome, setLastOutcome] = useState(null);
    const [areAllRevealed, setAreAllRevealed] = useState(false);

    const initPromiseRef = useRef(null);

    const [showPayment, setShowPayment] = useState(false);

    const buyCredits = async (amount) => {
        // Mock Payment
        // In real app, launch Stripe/Razorpay here
        alert("Simulating Payment Gateway: ₹" + amount);
        onUpdateUser({ ...user, credits: user.credits + amount, total_spent: (user.total_spent || 0) + amount });
        setShowPayment(false);
    };

    const handleCardClick = async (index) => {
        if (isProcessing || gameState === 'REVEALING' || gameState === 'RESULT') return;
        if (flippedIndices.includes(index) || matchedIndices.includes(index)) return;

        // Check credits
        if (flippedIndices.length === 0 && user.credits < 10) {
            alert("Insufficient credits! Please buy more.");
            setShowPayment(true);
            return;
        }

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        const SYMBOLS = ['🍎', '🍌', '🍇'];

        if (newFlipped.length === 1) {
            // IMMEDIATE REVEAL: Pick a random symbol locally
            const randomSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            const newCards = [...cards];
            newCards[index] = randomSymbol;
            setCards(newCards);

            setGameState('FLIPPED_ONE');

            // START ROUND IN BACKGROUND
            initPromiseRef.current = api.play({
                userId: user.id,
                betAmount: 10,
                phase: 'init',
                firstSymbol: randomSymbol
            }).catch(e => {
                console.error("Init failed", e);
                return null;
            });

        } else if (newFlipped.length === 2) {
            setGameState('REVEALING');
            setIsProcessing(true);

            // Wait for Init
            const initData = await initPromiseRef.current;

            if (!initData || !initData.outcome) {
                alert("Game Error: Could not connect to server.");
                setGameState('IDLE');
                setFlippedIndices([]);
                setIsProcessing(false);
                return;
            }

            // Update user credits
            onUpdateUser({ ...user, credits: initData.credits });

            // DECIDE SYMBOL 2
            const symbol1 = cards[newFlipped[0]];
            let symbol2;

            if (initData.outcome === 'WIN') {
                symbol2 = symbol1;
            } else {
                symbol2 = SYMBOLS.find(s => s !== symbol1);
            }

            // INSTANT REVEAL 2nd Card
            const revealCards = [...cards];
            revealCards[index] = symbol2;
            setCards(revealCards);
            setLastOutcome(initData.outcome);

            // Fetch Full Grid
            api.play({
                userId: user.id,
                phase: 'complete',
                selectedIndices: newFlipped
            }).then(finalData => {
                setCards(finalData.grid); // Sync full truth (hidden cards have data now)
                setGameState('RESULT'); // Show Win/Loss UI
                setIsProcessing(false);
                initPromiseRef.current = null;

                // Delay revealing the rest of the board so user focuses on their card first
                setTimeout(() => {
                    setAreAllRevealed(true);
                }, 500);

            }).catch(e => {
                setGameState('RESULT');
                setIsProcessing(false);
            });
        }
    };

    const resetGame = () => {
        setFlippedIndices([]);
        setCards(new Array(6).fill(null)); // Reset to hidden
        setGameState('IDLE');
        setLastOutcome(null);
        setAreAllRevealed(false);
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="text-xl font-bold text-amber-400 border border-amber-400/30 px-4 py-2 rounded-lg bg-amber-400/10">
                    Credits: ₹{user.credits}
                </div>
                <button
                    onClick={() => setShowPayment(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-lg shadow-green-900/20"
                >
                    + Add Funds
                </button>
            </div>

            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">Buy Demo Credits</h3>
                        <p className="text-slate-400 text-sm mb-6">Select a simulation tier:</p>

                        <div className="space-y-3">
                            <button onClick={() => buyCredits(100)} className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-600 flex justify-between items-center group transition-colors">
                                <span>Starter Pack</span>
                                <span className="text-green-400 font-mono group-hover:text-white">₹100</span>
                            </button>
                            <button onClick={() => buyCredits(500)} className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-600 flex justify-between items-center group transition-colors">
                                <span>Pro Kit</span>
                                <span className="text-green-400 font-mono group-hover:text-white">₹500</span>
                            </button>
                            <button onClick={() => buyCredits(1000)} className="w-full bg-gradient-to-r from-amber-900/50 to-amber-700/50 hover:from-amber-900 hover:to-amber-700 p-3 rounded-lg border border-amber-700/50 flex justify-between items-center group transition-colors">
                                <span className="text-amber-200">High Roller</span>
                                <span className="text-amber-400 font-mono font-bold group-hover:text-white">₹1000</span>
                            </button>
                        </div>

                        <button onClick={() => setShowPayment(false)} className="mt-6 w-full text-slate-500 hover:text-white text-sm">Cancel</button>
                    </div>
                </div>
            )}

            {/* Game Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {cards.map((symbol, index) => {
                    const isFlipped = flippedIndices.includes(index) || areAllRevealed;
                    const isSelected = flippedIndices.includes(index);

                    // Dynamic Styling
                    let cardStyle = "bg-slate-100 border-amber-400"; // Default revealed style

                    if (gameState === 'RESULT') {
                        if (isSelected) {
                            if (lastOutcome === 'WIN') {
                                cardStyle = "bg-green-100 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]";
                            } else {
                                cardStyle = "bg-red-100 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]";
                            }
                        } else {
                            // The unpicked cards revealed at the end
                            const firstIndex = flippedIndices[0];
                            // Check if this card is the "Missed Match" (matches the first card)
                            const isMissedMatch = firstIndex !== undefined && symbol === cards[firstIndex];

                            if (lastOutcome !== 'WIN' && isMissedMatch) {
                                // PSYCHOLOGICAL TRICK: Highlight the missed winner in GREEN to induce regret
                                // "It was right here!"
                                cardStyle = "bg-green-100 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-100 animate-pulse";
                            } else {
                                cardStyle = "bg-slate-300 border-slate-400 grayscale opacity-50";
                            }
                        }
                    }

                    return (
                        <div
                            key={index}
                            onClick={() => handleCardClick(index)}
                            className={`
                 relative w-24 h-32 cursor-pointer perspective-1000 transition-transform duration-300
                 ${isSelected ? 'scale-105 z-10' : 'hover:scale-105'}
               `}
                        >
                            <motion.div
                                initial={false}
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, type: "spring" }}
                                className="w-full h-full relative preserve-3d"
                            >
                                {/* IDLE / BACK */}
                                <div className="absolute w-full h-full backface-hidden bg-slate-800 border-2 border-slate-600 rounded-xl flex items-center justify-center text-4xl shadow-lg">
                                    {CARD_BACK}
                                </div>

                                {/* REVEALED / FRONT */}
                                <div
                                    className={`absolute w-full h-full backface-hidden rotate-y-180 border-4 rounded-xl flex items-center justify-center text-4xl shadow-lg transition-colors duration-500 ${cardStyle}`}
                                    style={{ transform: "rotateY(180deg)" }}
                                >
                                    {symbol || "?"}
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {/* Outcome / Disclaimer */}
            <AnimatePresence>
                {gameState === 'RESULT' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center p-6 bg-slate-800 rounded-xl border border-slate-700 max-w-md"
                    >
                        <h2 className={`text-2xl font-bold mb-2 ${lastOutcome === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                            {lastOutcome === 'WIN' ? 'WINNER!' : lastOutcome === 'NEAR_MISS' ? 'SO CLOSE!' : 'LOSS'}
                        </h2>
                        <p className="text-slate-400 text-sm mb-4">
                            {lastOutcome === 'NEAR_MISS' ?
                                "Look how close the winning match was! It was right there!" :
                                "Outcomes are controlled by the server."}
                        </p>
                        <button
                            onClick={resetGame}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-6 rounded-full"
                        >
                            Play Again
                        </button>

                        {lastOutcome !== 'WIN' && (
                            <div className="mt-4 p-3 bg-slate-900/50 rounded text-xs text-slate-500">
                                <strong>Educational Disclosure:</strong> The system decided this outcome before you clicked safely.
                                {lastOutcome === 'NEAR_MISS' ? " It placed the matching card next to your choice on purpose." : ""}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
