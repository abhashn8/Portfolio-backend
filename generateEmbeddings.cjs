// generateEmbeddings.cjs

require('dotenv').config();
const OpenAI = require('openai').default; // using default export
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateAndStoreEmbeddings() {
  try {
    const snapshot = await db.collection('profileChunks').get();
    if (snapshot.empty) {
      console.log('No documents found in profileChunks.');
      return;
    }
    for (const doc of snapshot.docs) {
      const chunk = doc.data();
      if (!chunk.text) {
        console.log(`Document ${doc.id} does not have text.`);
        continue;
      }
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: chunk.text,
        });
        console.log(`Response for document ${doc.id}:`, response.data);

        let embeddingData;
        if (Array.isArray(response.data)) {
          embeddingData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          embeddingData = response.data.data;
        } else {
          console.error(`Unexpected response format for document ${doc.id}:`, response.data);
          continue;
        }

        const embedding = embeddingData[0].embedding;
        if (!embedding) {
          console.error(`Embedding not found for document ${doc.id}. Response:`, response.data);
          continue;
        }

        await db.collection('profileChunks').doc(doc.id).update({ embedding });
        console.log(`Stored embedding for chunk ${doc.id}`);
      } catch (err) {
        console.error(`Error for document ${doc.id}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error fetching documents:', err.message);
  }
}

generateAndStoreEmbeddings();
