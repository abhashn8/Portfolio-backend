import express from 'express';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import cors from 'cors';

// Load environment variables
dotenv.config();

// 1. Parse and validate Firebase service account from env
if (!process.env.FIREBASE_CONFIG) {
  throw new Error('Missing FIREBASE_CONFIG environment variable. Please set it to your JSON service account credentials.');
}
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
} catch (e) {
  throw new Error('Invalid JSON in FIREBASE_CONFIG');
}

// 2. Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// 3. Set up Express
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(cors());

// 4. Import RAG functions
import rag from './rag.cjs';
const { getQueryEmbedding, retrieveRelevantChunks, buildPrompt, generateAnswer } = rag;

// 5. Routes
app.get('/', (req, res) => res.send("Welcome to Abhash's backend server!"));

app.get('/api/test-firestore', async (req, res) => {
  try {
    const docRef = db.collection('profileInfo').doc('resume');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return res.json({ message: 'Firestore access is working!', data: docSnap.data() });
    }
    return res.json({ message: 'Document does not exist.' });
  } catch (error) {
    console.error('Firestore access error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/askOpenAI', async (req, res) => {
  try {
    const raw = req.body.question;
    const userInput = raw?.trim();
    if (!userInput) {
      return res.status(400).json({ answer: 'Please ask a valid question.' });
    }

    // Log prompt for FAQs
    await db.collection('faqLogs').add({
      question: userInput,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // RAG pipeline
    const embedding = await getQueryEmbedding(userInput);
    const chunks = await retrieveRelevantChunks(embedding, 3);
    const prompt = buildPrompt(chunks, userInput);
    const answer = await generateAnswer(prompt);

    return res.json({ answer });
  } catch (error) {
    console.error('Error in /api/askOpenAI:', error);
    return res.status(500).json({ answer: 'Something went wrong while processing your request.' });
  }
});

// 6. Start server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
