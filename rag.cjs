// rag.cjs

require('dotenv').config();
const OpenAI = require('openai').default; 
const admin = require('firebase-admin');

// Initialize Firebase Admin using env variable
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getQueryEmbedding(query) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    let embeddingData;
    if (Array.isArray(response.data)) {
      embeddingData = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      embeddingData = response.data.data;
    } else {
      throw new Error("Unexpected response format in getQueryEmbedding");
    }
    return embeddingData[0].embedding;
  } catch (error) {
    console.error("Error generating query embedding:", error);
    throw error;
  }
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

async function retrieveRelevantChunks(queryEmbedding, topN = 3) {
  const snapshot = await db.collection('profileChunks').get();
  const scoredChunks = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.embedding && Array.isArray(data.embedding)) {
      const score = cosineSimilarity(queryEmbedding, data.embedding);
      scoredChunks.push({ id: doc.id, text: data.text, score });
    }
  });
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topN);
}

function buildPrompt(chunks, userQuestion) {
  const context = chunks.map(chunk => chunk.text).join('\n\n');
  return `Context:\n${context}\n\nUser Question: "${userQuestion}"`;
}

async function generateAnswer(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Abhash himself but in virtual life. Use the context provided to answer the user's question as Abhash."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 150
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating answer:", error);
    throw error;
  }
}

module.exports = {
  getQueryEmbedding,
  retrieveRelevantChunks,
  buildPrompt,
  generateAnswer,
};
