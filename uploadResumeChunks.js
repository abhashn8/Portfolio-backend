// uploadResumeChunks.js (ES Module version with embeddings)

import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };
import 'dotenv/config';
import { OpenAI } from 'openai';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Resume data
const resumeData = {
  name: "Abhash Niroula",
  contact: {
    email: "abhashniroula8@gmail.com",
    phone: "+1 6467534127",
    linkedin: "https://www.linkedin.com/in/abhash-niroula/",
    github: "https://github.com/abhashn8"
  },
  education: {
    degree: "Bachelor of Science in Computer Science",
    institution: "William Paterson University",
    location: "Wayne, NJ, USA",
    graduation: "May 2026",
    honors: "Honors Program, GPA: 3.9, Dean’s List Spring 2024"
  },
  technicalSkills: "Python, Swift, SQL, EJS, JavaScript, HTML/CSS, Kivy, Bootstrap, Tailwind, Windows, macOS, Linux, GitHub, Model Evaluation, Chatbot Development, Generative AI, API Integration, Data Structures and Algorithms (DSA), Object Oriented Programming (OOP), Xcode, Microsoft Azure, Google Cloud Platform, UI/UX Design, Figma, ER Modeling, Office 365, Google Workspace",
  relevantCourseworkAndCertifications: {
    coursework: "Computer Programming, Object-Oriented Programming, Data Structures and Algorithms, Database Management Systems, Front-end Web Development, Cloud Computing, Statistics, Calculus",
    certifications: "Intermediate Generative AI (Google), Intro to iOS Development (CodePath), Microsoft Azure Fundamentals"
  },
  professionalExperience: [
    {
      role: "AI Founding Engineer Intern",
      company: "Humanity AI",
      location: "Upper Montclair, NJ",
      duration: "Oct 2024 – Present",
      description: "Integrated and tested responses from 5+ AI models through APIs to evaluate accuracy and effectiveness in generating answers, contributing to chatbot development. Collaborated with the HAI team on the design and integration of next-generation AI models, ensuring seamless functionality with existing systems and applications. Developed and maintained HAI’s website, enhancing user experience and supporting the company’s digital presence."
    },
    {
      role: "Software Engineer Intern",
      company: "William Paterson University",
      location: "Wayne, NJ",
      duration: "Mar 2024 – May 2024",
      description: "Directed the design and development of the website’s user interface, enhancing user engagement and functionality. Designed and implemented event management and membership registration systems, ensuring a seamless user experience. Facilitated networking opportunities, enriching club members’ professional interactions."
    }
  ],
  technicalProjects: [
    {
      name: "LetsCric",
      technologies: "HTML, CSS, JS",
      description: "Created a real-time sports web application offering access to 10+ live cricket match actions and updates. Integrated with Cricbuzz API to fetch live scores, match summaries, and news, ensuring data accuracy and minimal delays. Enhanced data handling efficiency, reducing load time by 30% to deliver a seamless user experience and accommodate high-traffic spikes."
    },
    {
      name: "WishList App",
      technologies: "Kivy",
      description: "Engineered a Kivy-based Wishlist app with features to add, view, update, and store user data for a user-friendly item management experience. Designed an intuitive interface prioritizing ease of use, contributing to a 15% increase in positive user feedback. Implemented local data caching to enable offline access, resolving reliability challenges and enhancing overall app usability."
    }
  ],
  resumeLink: "https://pub-ebbe76c3985b4604b8d5d0885d75ccfd.r2.dev/Resume.pdf"
};

// Build chunks (without embeddings yet)
const chunks = [];
if (resumeData.education) {
  const { degree, institution, location, graduation, honors } = resumeData.education;
  chunks.push({ text: `${resumeData.name} earned a ${degree} from ${institution} in ${location}. Graduation: ${graduation}. Honors: ${honors}.`, metadata: { type: 'education', source: 'resume' } });
}
if (resumeData.technicalSkills) {
  chunks.push({ text: `Technical Skills: ${resumeData.technicalSkills}`, metadata: { type: 'technicalSkills', source: 'resume' } });
}
if (resumeData.relevantCourseworkAndCertifications) {
  const { coursework, certifications } = resumeData.relevantCourseworkAndCertifications;
  chunks.push({ text: `Coursework: ${coursework}. Certifications: ${certifications}.`, metadata: { type: 'coursework', source: 'resume' } });
}
resumeData.professionalExperience.forEach((exp, i) => {
  chunks.push({ text: `Experience: ${exp.role} at ${exp.company}, ${exp.location} (${exp.duration}). ${exp.description}`, metadata: { type: 'experience', source: 'resume', index: i } });
});
resumeData.technicalProjects.forEach((proj, i) => {
  chunks.push({ text: `Project: ${proj.name}. Technologies: ${proj.technologies}. ${proj.description}`, metadata: { type: 'project', source: 'resume', index: i } });
});
if (resumeData.contact) {
  const { email, phone, linkedin, github } = resumeData.contact;
  chunks.push({ text: `Contact: Email: ${email}, Phone: ${phone}, LinkedIn: ${linkedin}, GitHub: ${github}.`, metadata: { type: 'contact', source: 'resume' } });
}
if (resumeData.resumeLink) {
  chunks.push({ text: `Resume Link: ${resumeData.resumeLink}`, metadata: { type: 'resumeLink', source: 'resume' } });
}
// Personality & interests
chunks.push({ text: `Interests: Academics is only 30% of my life; sports occupy the major part. I love cricket and soccer since childhood. I captained my high school cricket team to a District Championship and trained by top coaches in Nepal. I play soccer weekly and have seen Messi play live and watched Barcelona at Camp Nou. Other sports I enjoy: ping pong, chess, and pool tennis.`, metadata: { type: 'interests', source: 'resume' } });
chunks.push({ text: `Interests: I'm a huge music lover with diverse tastes—Nepali, Bollywood, international genres. Favorites: pop and country. I've attended concerts for Post Malone, Ed Sheeran, and Luke Combs.`, metadata: { type: 'interests', source: 'resume' } });
chunks.push({ text: `Interests: I love traveling and hiking. In the US, I've hiked in High Point, Delaware Water Gap, Ithaca, and the Catskills in NY. I'm a fun-loving person and community volunteer.`, metadata: { type: 'interests', source: 'resume' } });
chunks.push({ text: `Volunteer Work: In Nepal, I taught rural communities about voting. In the US, I volunteered with PyData NYC 2023 at Microsoft Office in Manhattan—introducing speakers, assisting guests, and participating in CS events throughout Manhattan.`, metadata: { type: 'volunteering', source: 'resume' } });

// Function to get embedding
async function embedText(text) {
  const response = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: text });
  if (Array.isArray(response.data)) return response.data[0].embedding;
  return response.data.data[0].embedding;
}

// Upload each chunk with its embedding
for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i];
  const docId = `chunk_${String(i+1).padStart(3,'0')}`;
  try {
    const embedding = await embedText(chunk.text);
    await db.collection('profileChunks').doc(docId).set({
      text: chunk.text,
      embedding,
      metadata: chunk.metadata
    });
    console.log(`✅ ${docId} written with embedding`);
  } catch (err) {
    console.error(`❌ Error writing ${docId}:`, err);
  }
}

console.log('All chunks processed.');
process.exit(0);
