export const api = {
    login: async (username) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        return res.json();
    },

    play: async (params) => {
        const res = await fetch('/api/game/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        return res.json();
    },

    adminStats: async () => {
        const res = await fetch('/api/admin/stats');
        return res.json();
    },

    adminConfig: async (difficulty) => {
        const res = await fetch('/api/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ difficulty })
        });
        return res.json();
    },

    adminOverride: async (userId, outcome) => {
        const res = await fetch('/api/admin/override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, outcome })
        });
        return res.json();
    }
};
