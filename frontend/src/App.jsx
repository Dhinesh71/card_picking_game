import React, { useState } from 'react';
import GameBoard from './components/GameBoard';
import AdminPanel from './components/AdminPanel';
import { api } from './lib/api';

function App() {
    const [user, setUser] = useState({ id: 'guest', credits: 100 });

    // Simple Secret Routing
    const isSecretAdminRoute = window.location.pathname === '/admin';

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center shadow-lg z-10">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🎰</span>
                    <h1 className="font-bold text-lg bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
                        LUCK SIMULATOR
                    </h1>
                </div>
                <div>
                    {/* Secret Area - No Button */}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 overflow-hidden">

                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
                </div>

                {isSecretAdminRoute ? (
                    <div className="w-full max-w-4xl z-20">
                        <AdminPanel />
                        <div className="text-center mt-6">
                            <a href="/" className="text-slate-400 hover:text-white underline text-sm">
                                ← Back to Game
                            </a>
                        </div>
                    </div>
                ) : (
                    <GameBoard user={user} onUpdateUser={setUser} />
                )}

            </main>
        </div>
    );
}

export default App;
