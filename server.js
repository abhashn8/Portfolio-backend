import express from "express";
import admin from "firebase-admin";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

// =========================
// 1. Initialize Firebase Admin SDK
// =========================
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// =========================
// 2. Set up Express
// =========================
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// =========================
// 3. Import RAG Functions
// =========================
import { 
  getQueryEmbedding, 
  retrieveRelevantChunks, 
  buildPrompt, 
  generateAnswer 
} from "./rag.cjs";

// =========================
// 4. Root & Test Routes
// =========================
app.get("/", (req, res) => {
  res.send("Welcome to Abhash's backend server!");
});

app.get("/api/test-firestore", async (req, res) => {
  try {
    const docRef = db.collection("profileInfo").doc("resume");
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      res.json({
        message: "Firestore access is working!",
        data: docSnap.data(),
      });
    } else {
      res.json({ message: "Document does not exist." });
    }
  } catch (error) {
    console.error("Firestore access error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// 5. Handle User Queries Using the RAG Pipeline
// =========================
app.post("/api/askOpenAI", async (req, res) => {
  try {
    const userInput = req.body.question;
    if (!userInput) {
      return res.status(400).json({ answer: "Please ask a valid question." });
    }

    const queryEmbedding = await getQueryEmbedding(userInput);

    const relevantChunks = await retrieveRelevantChunks(queryEmbedding, 3);

    const prompt = buildPrompt(relevantChunks, userInput);

    const answer = await generateAnswer(prompt);

    return res.json({ answer });
  } catch (error) {
    console.error("Error processing /api/askOpenAI:", error);
    return res
      .status(500)
      .json({ answer: "Something went wrong while processing your request." });
  }
});

// =========================
// 6. Start the Server
// =========================
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
