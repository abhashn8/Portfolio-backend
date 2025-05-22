import express from 'express';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import cors from 'cors';

dotenv.config();

// 1. Validate and parse Firebase config from env
const firebaseConfigRaw = process.env.FIREBASE_CONFIG;
if (!firebaseConfigRaw) {
  throw new Error('Missing FIREBASE_CONFIG environment variable.');
}
const serviceAccount = JSON.parse(firebaseConfigRaw);

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

// 4. Import RAG functions (CommonJS interop)
import rag from './rag.cjs';
const { getQueryEmbedding, retrieveRelevantChunks, buildPrompt, generateAnswer } = rag;

// 5. Routes
app.get('/', (req, res) => res.send("Welcome to Abhash's backend server!"));

app.get('/api/test-firestore', async (req, res) => {
  try {
    const docRef = db.collection('profileInfo').doc('resume');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      res.json({ message: 'Firestore access is working!', data: docSnap.data() });
    } else {
      res.json({ message: 'Document does not exist.' });
    }
  } catch (error) {
    console.error('Firestore access error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/askOpenAI', async (req, res) => {
  try {
    const userInputRaw = req.body.question;
    const userInput = userInputRaw?.trim();
    if (!userInput) {
      return res.status(400).json({ answer: 'Please ask a valid question.' });
    }

    // Log every user prompt to Firestore for FAQ insight
    await db.collection('faqLogs').add({
      question: userInput,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Run RAG pipeline
    const queryEmbedding = await getQueryEmbedding(userInput);
    const relevantChunks = await retrieveRelevantChunks(queryEmbedding, 3);
    const prompt = buildPrompt(relevantChunks, userInput);
    const answer = await generateAnswer(prompt);

    return res.json({ answer });
  } catch (error) {
    console.error('Error processing /api/askOpenAI:', error);
    return res.status(500).json({ answer: 'Something went wrong while processing your request.' });
  }
});

// 6. Start server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
