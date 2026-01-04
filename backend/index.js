const express = require('express');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000' })); // Allow Next.js frontend
app.use(bodyParser.json());

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const auth = admin.auth();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.userId = decoded.uid;
    next();
  });
};

// Routes/Controllers
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await auth.createUser({ email, password });
    const token = jwt.sign({ uid: user.uid }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: 'User created', token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Firebase Auth handles password verification
    const user = await auth.getUserByEmail(email);
    // Note: Firebase doesn't directly verify passwords in Admin SDK; use frontend Firebase Auth for client-side signIn, then get ID token. For server, verify ID token.
    // Simplified: Assume frontend sends ID token after client login, verify here
    const idToken = req.body.idToken; // From frontend Firebase Auth
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const token = jwt.sign({ uid: decodedToken.uid }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Logged in', token });
  } catch (error) {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/logout', verifyToken, (req, res) => {
  // Client deletes token; optional revoke on server
  res.json({ message: 'Logged out' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));