import express from 'express';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import cors from 'cors';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };  // directly import service account

dotenv.config();

// 1. Initialize Firebase Admin SDK with service account
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// 2. Set up Express
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(cors());

// 3. Import RAG functions (CommonJS interop)
import rag from './rag.cjs';
const { getQueryEmbedding, retrieveRelevantChunks, buildPrompt, generateAnswer } = rag;

// 4. Routes
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

    // Log the user prompt to Firestore for FAQ insights
    await db.collection('faqLogs').add({
      question: userInput,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Execute RAG pipeline
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

// 5. Start server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
