import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function AdminPanel() {
    const [stats, setStats] = useState(null);
    const [userId, setUserId] = useState('guest'); // Target user for override

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 2000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const data = await api.adminStats();
            setStats(data);
        } catch (e) { }
    };

    const setDifficulty = async (level) => {
        await api.adminConfig(level);
        loadStats();
    };

    const forceOutcome = async (outcome) => {
        await api.adminOverride(userId, outcome);
        alert(`Next game forced to ${outcome}`);
    };

    if (!stats) return <div className="p-4 text-slate-500">Loading Admin...</div>;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 p-4 max-h-64 overflow-y-auto">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Stats */}
                <div className="flex-1">
                    <h3 className="text-slate-400 font-mono text-sm mb-2">SERVER STATS</h3>
                    <div className="text-green-500 font-mono">
                        Active Players: {stats.activePlayers}
                    </div>
                    <div className="text-amber-500 font-mono">
                        Current Difficulty: {stats.config.difficulty}
                    </div>
                </div>

                {/* Global Controls */}
                <div className="flex-1">
                    <h3 className="text-slate-400 font-mono text-sm mb-2">GLOBAL DIFFICULTY</h3>
                    <div className="flex gap-2">
                        {['EASY', 'MEDIUM', 'HARD'].map(level => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`px-3 py-1 text-xs font-bold rounded border ${stats.config.difficulty === level ? 'bg-amber-500 text-black border-amber-500' : 'text-slate-400 border-slate-700'}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* User Override */}
                <div className="flex-1">
                    <h3 className="text-slate-400 font-mono text-sm mb-2">PLAYER MANIPULATION</h3>
                    <div className="flex gap-2 items-center mb-2">
                        <input
                            value={userId}
                            onChange={e => setUserId(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-xs p-1 rounded w-24"
                            placeholder="User ID"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => forceOutcome('WIN')} className="bg-green-900/50 hover:bg-green-900 text-green-400 border border-green-800 px-3 py-1 text-xs rounded">
                            FORCE WIN
                        </button>
                        <button onClick={() => forceOutcome('LOSS')} className="bg-red-900/50 hover:bg-red-900 text-red-400 border border-red-800 px-3 py-1 text-xs rounded">
                            FORCE LOSS
                        </button>
                        <button onClick={() => forceOutcome('NEAR_MISS')} className="bg-amber-900/50 hover:bg-amber-900 text-amber-400 border border-amber-800 px-3 py-1 text-xs rounded">
                            FORCE NEAR MISS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
