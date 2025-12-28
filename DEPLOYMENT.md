# Deployment Guide

This project consists of a **Node.js Backend** and a **React Frontend**. You can deploy them separately or serve them together.

## Option 1: Easiest (Render / Railway)
These platforms can host both frontend and backend or a combined repo.

### 1. Prepare for Production
1.  **Backend**: Ensure `package.json` has a `start` script: `"start": "node server.js"`.
2.  **Frontend**: Open `vite.config.js` and ensure the proxy points to the production backend URL when deploying, OR update your `api.js` to use a full URL in production.
    *   *Current `api.js` uses relative paths (`/api/...`), so you must serve frontend from backend OR configure a proxy.*

### 2. The "Monolith" Approach (Recommended for Simplicity)
Serve the React app *through* the Express backend.

**Steps:**
1.  Build the frontend:
    ```bash
    cd frontend
    npm install
    npm run build
    ```
    This creates a `dist` folder.
2.  Move/Copy the `frontend/dist` folder to `backend/public` (create `public` if needed).
3.  Update `backend/server.js` to serve static files:
    ```javascript
    const path = require('path');
    
    // Serve Static Frontend
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Handle React Routing (return index.html for unknown routes)
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) return res.status(404).send('API not found');
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    ```
4.  Commit everything and push to GitHub.
5.  Deploy the **Backend** repo to **Render.com** (Web Service).
    *   Build Command: `npm install`
    *   Start Command: `node server.js`

## Option 2: Separate Deployment (Vercel + Render)

### Backend (Render/Railway)
1.  Push code to GitHub.
2.  Create new Web Service.
3.  Root Directory: `backend`.
4.  Deploy. Get the URL (e.g., `https://my-game-api.onrender.com`).

### Frontend (Vercel/Netlify)
1.  Update `frontend/src/lib/api.js` to point to the backend URL in production:
    ```javascript
    const BASE_URL = import.meta.env.PROD ? 'https://my-game-api.onrender.com' : '';
    // Use BASE_URL + '/api/...'
    ```
2.  Push code to GitHub.
3.  Create new Project on Vercel.
4.  Root Directory: `frontend`.
5.  Deploy.

## Post-Deployment Checks
-   **Environment Variables**: Set `SUPABASE_URL` and `SUPABASE_KEY` in your hosting dashboard if you use real database features.
-   **CORS**: In `backend/server.js`, update `cors()` to allow your frontend domain:
    ```javascript
    app.use(cors({ origin: 'https://my-game-frontend.vercel.app' }));
    ```
