const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");

// =========================
// 1. Initialize Firebase Admin SDK
// =========================
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// =========================
// 2. Set up Express
// =========================
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// =========================
// 3. Root & Test Routes
// =========================
app.get("/", (req, res) => {
  res.send("Welcome to Abhash's backend server!");
});

// Optional test endpoint to confirm Firestore access
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
// 4. Handle User Queries Using OpenAI API
// =========================
app.post("/api/askOpenAI", async (req, res) => {
  // 4A. Get user query from the request body
  const userInput = req.body.question?.toLowerCase().trim();
  if (!userInput) {
    return res.status(400).json({ answer: "Please ask a valid question." });
  }

  // 4B. Decide which "section" of the doc to retrieve
  let context = "";
  if (userInput.includes("resume") || userInput.includes("cv")) {
    context = "resume";
  } else if (
    userInput.includes("portfolio") ||
    userInput.includes("projects")
  ) {
    context = "portfolio";
  } else if (userInput.includes("about") || userInput.includes("who are you")) {
    context = "about";
  } else if (userInput.includes("contact")) {
    context = "contact";
  }

  try {
    // 4C. Always fetch the same doc: "profileInfo/resume"
    const docRef = db.collection("profileInfo").doc("resume");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        answer: "No profile document found in Firestore.",
      });
    }

    const data = docSnap.data();

    // 4D. Build the relevant text from the doc based on context
    let retrievedData = "";

    if (context === "resume") {
      retrievedData += buildResumeSection(data);
    } else if (context === "portfolio") {
      retrievedData += buildPortfolioSection(data.technicalProjects);
    } else if (context === "about") {
      retrievedData += buildAboutSection(data);
    } else if (context === "contact") {
      retrievedData += buildContactSection(data.contact);
    } else {
      // If no recognized context, just show them everything or handle gracefully
      retrievedData += buildResumeSection(data);
    }

    // If user typed something that doesn't match our code, respond accordingly
    if (!retrievedData) {
      return res.json({
        answer: "I'm not sure which part of your portfolio you want to see.",
      });
    }

    // 4E. Build the prompt for OpenAI
    const prompt = `
You are Abhash's AI assistant. Use the context below to answer the question.
Context:
${retrievedData}

User Question: ${userInput}
    `;

    // 4F. Send the prompt to OpenAI
    const openAiApiKey = process.env.OPENAI_API_KEY;
    const openAiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Always respond in bullet points. Use short, concise sentences. Remember you are speaking to a prospective employer.If you are unsure of the answer, say : I'm not certain rather than fabricating information. ",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 4G. Extract the AI-generated answer
    const answer =
      openAiResponse.data.choices?.[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response.";

    return res.json({ answer });
  } catch (error) {
    console.error("OpenAI API error:", error.response?.data || error.message);
    return res
      .status(500)
      .json({ answer: "Something went wrong while processing your request." });
  }
});

// =========================
// 5. Helper Functions
// =========================

// Example: For "resume", we might want to gather name, education, experience, skills, resumeLink, etc.
function buildResumeSection(data) {
  if (!data) return "";
  let output = "";

  // Name
  if (data.name) output += `Name: ${data.name}\n`;

  // Education
  if (data.education) {
    output += `Education: ${data.education.degree} at ${data.education.institution} (${data.education.graduation})\n`;
    if (data.education.honors) output += `Honors: ${data.education.honors}\n`;
  }

  // Professional Experience
  if (Array.isArray(data.professionalExperience)) {
    output += `Professional Experience:\n`;
    data.professionalExperience.forEach((exp, i) => {
      output += `  ${i + 1}. ${exp.role} at ${exp.company}\n     ${
        exp.description
      }\n`;
    });
  }

  // Relevant Coursework & Certs
  if (data.relevantCourseworkAndCertifications) {
    output += `Relevant Coursework: ${data.relevantCourseworkAndCertifications.coursework}\n`;
    output += `Certifications: ${data.relevantCourseworkAndCertifications.certifications}\n`;
  }

  // Technical Skills
  if (data.technicalSkills) {
    output += `Technical Skills: ${data.technicalSkills}\n`;
  }

  // Resume Link
  if (data.resumeLink) {
    output += `Resume Link: ${data.resumeLink}\n`;
  }

  return output;
}

// For "portfolio", we might just show the technicalProjects
function buildPortfolioSection(projects) {
  if (!projects || !Array.isArray(projects))
    return "No portfolio data found.\n";
  let output = "Projects:\n";
  projects.forEach((proj, i) => {
    output += `${i + 1}. ${proj.name} (Tech: ${proj.technologies})\n   ${
      proj.description
    }\n`;
  });
  return output;
}

// For "about", maybe we show name, education summary, etc.
function buildAboutSection(data) {
  if (!data) return "";
  let output = "";
  if (data.name) output += `Name: ${data.name}\n`;
  if (data.education) {
    output += `Education: ${data.education.degree} at ${data.education.institution}\n`;
  }
  // Could add more fields if you want
  return output;
}

// For "contact", we parse data.contact
function buildContactSection(contactObj) {
  if (!contactObj) return "No contact info found.\n";
  let output = "";
  if (contactObj.email) output += `Email: ${contactObj.email}\n`;
  if (contactObj.phone) output += `Phone: ${contactObj.phone}\n`;
  if (contactObj.linkedin) output += `LinkedIn: ${contactObj.linkedin}\n`;
  if (contactObj.github) output += `GitHub: ${contactObj.github}\n`;
  return output;
}

// =========================
// 6. Start the Server
// =========================
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
