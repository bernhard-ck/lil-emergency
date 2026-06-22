require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const SCREEN_PORT = process.env.SCREEN_PORT || 80;
const ADMIN_PORT = process.env.ADMIN_PORT || 8080;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Ensure data directory and db exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}
const dbFile = path.join(dataDir, 'db.json');
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ activeId: null, messages: [] }));
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Set up multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Database helper functions
const getDb = () => JSON.parse(fs.readFileSync(dbFile, 'utf8'));
const saveDb = (data) => fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));

// SSE connections
let clients = [];
const broadcastUpdate = () => {
    const db = getDb();
    const payload = `data: ${JSON.stringify(db)}\n\n`;
    clients.forEach(client => client.res.write(payload));
};

// --- Screen App (Port 80) ---
const screenApp = express();
screenApp.use(cors());

// Serve screen static files
screenApp.use(express.static(path.join(__dirname, 'public_screen')));
// Serve uploaded images (screen needs access to them)
screenApp.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// SSE Endpoint for real-time updates
screenApp.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial db state
    const db = getDb();
    res.write(`data: ${JSON.stringify(db)}\n\n`);

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
});

// Catch-all to serve index.html for specific preset URLs
screenApp.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public_screen', 'index.html'));
});

screenApp.listen(SCREEN_PORT, () => {
    console.log(`Screen Interface listening on port ${SCREEN_PORT}`);
});

// --- Admin App (Port 8080) ---
const adminApp = express();
adminApp.use(cors());
adminApp.use(express.json());
adminApp.use(cookieParser());

// Authentication Middleware for Admin App
if (ADMIN_PASSWORD) {
    // API: Login route
    adminApp.post('/api/login', (req, res) => {
        if (req.body.password === ADMIN_PASSWORD) {
            res.cookie('auth', ADMIN_PASSWORD, { httpOnly: true, sameSite: 'strict', maxAge: 86400000 * 365 }); // 1 year
            return res.json({ success: true });
        }
        res.status(401).json({ error: 'Invalid password' });
    });

    // Logout route
    adminApp.post('/api/logout', (req, res) => {
        res.clearCookie('auth');
        res.json({ success: true });
    });

    adminApp.use((req, res, next) => {
        // Allow public access to login page, static assets, and uploads
        if (req.path === '/login' || req.path === '/login.html' || req.path === '/login.js' || req.path === '/style.css' || req.path.startsWith('/uploads')) {
            return next();
        }
        
        // If authenticated, proceed
        if (req.cookies.auth === ADMIN_PASSWORD) {
            return next();
        }
        
        // Otherwise, redirect HTML requests to login or 401 for API
        if (req.path.startsWith('/api/')) {
            res.status(401).json({ error: 'Authentication required.' });
        } else {
            res.redirect('/login');
        }
    });

    // Serve login page at /login
    adminApp.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, 'public_admin', 'login.html'));
    });
}

// Serve admin static files
adminApp.use(express.static(path.join(__dirname, 'public_admin')));
// Serve uploaded images
adminApp.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API: Get config
adminApp.get('/api/config', (req, res) => {
    res.json({ screenPort: SCREEN_PORT, adminPort: ADMIN_PORT });
});

// API: Get all messages and active ID
adminApp.get('/api/messages', (req, res) => {
    res.json(getDb());
});

// API: Create new message
adminApp.post('/api/messages', (req, res) => {
    const db = getDb();
    const nameStr = req.body.name || `Preset ${db.messages.length + 1}`;
    const slugStr = nameStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newMessage = {
        id: Date.now().toString(),
        name: nameStr,
        slug: slugStr,
        text: req.body.text || '',
        textColor: req.body.textColor || '#ffffff',
        bgColor: req.body.bgColor || '#000000',
        bgImage: req.body.bgImage || null
    };
    db.messages.push(newMessage);
    saveDb(db);
    broadcastUpdate(); // Update clients in case they are looking at this specific preset
    res.json(newMessage);
});

// API: Update an existing message
adminApp.put('/api/messages/:id', (req, res) => {
    const db = getDb();
    const index = db.messages.findIndex(m => m.id === req.params.id);
    if (index === -1) return res.status(404).send('Not found');

    db.messages[index] = { ...db.messages[index], ...req.body };
    saveDb(db);
    
    if (db.activeId === req.params.id) {
        broadcastUpdate();
    }
    res.json(db.messages[index]);
});

// API: Delete a message
adminApp.delete('/api/messages/:id', (req, res) => {
    const db = getDb();
    db.messages = db.messages.filter(m => m.id !== req.params.id);
    if (db.activeId === req.params.id) {
        db.activeId = null;
        broadcastUpdate();
    }
    saveDb(db);
    res.json({ success: true });
});

// API: Set active message
adminApp.post('/api/active', (req, res) => {
    const db = getDb();
    db.activeId = req.body.id;
    saveDb(db);
    broadcastUpdate();
    res.json({ success: true });
});

// API: Upload image
adminApp.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.json({ filename: req.file.filename });
});

adminApp.listen(ADMIN_PORT, () => {
    console.log(`Admin Interface listening on port ${ADMIN_PORT}`);
});
