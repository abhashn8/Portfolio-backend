// uploadResumeChunks.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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

const chunks = [];

// 1. Education Chunk
if (resumeData.education) {
  const { degree, institution, location, graduation, honors } = resumeData.education;
  const educationText = `${resumeData.name} earned a ${degree} from ${institution} in ${location}. Expected graduation: ${graduation}. Honors: ${honors}.`;
  chunks.push({
    text: educationText,
    embedding: [], // Placeholder for the embedding vector
    metadata: { type: 'education', source: 'resume' }
  });
}

// 2. Technical Skills Chunk
if (resumeData.technicalSkills) {
  chunks.push({
    text: `Technical Skills: ${resumeData.technicalSkills}`,
    embedding: [],
    metadata: { type: 'technicalSkills', source: 'resume' }
  });
}

// 3. Coursework and Certifications Chunk
if (resumeData.relevantCourseworkAndCertifications) {
  const { coursework, certifications } = resumeData.relevantCourseworkAndCertifications;
  const courseworkText = `Coursework: ${coursework}. Certifications: ${certifications}.`;
  chunks.push({
    text: courseworkText,
    embedding: [],
    metadata: { type: 'coursework', source: 'resume' }
  });
}

// 4. Professional Experience Chunks (one per experience)
if (resumeData.professionalExperience && Array.isArray(resumeData.professionalExperience)) {
  resumeData.professionalExperience.forEach((experience, index) => {
    const { role, company, location, duration, description } = experience;
    const experienceText = `Experience: ${role} at ${company}, ${location} (${duration}). ${description}`;
    chunks.push({
      text: experienceText,
      embedding: [],
      metadata: { type: 'experience', source: 'resume', index }
    });
  });
}

// 5. Technical Projects Chunks (one per project)
if (resumeData.technicalProjects && Array.isArray(resumeData.technicalProjects)) {
  resumeData.technicalProjects.forEach((project, index) => {
    const { name, technologies, description } = project;
    const projectText = `Project: ${name}. Technologies: ${technologies}. ${description}`;
    chunks.push({
      text: projectText,
      embedding: [],
      metadata: { type: 'project', source: 'resume', index }
    });
  });
}

// 6. Contact Information Chunk
if (resumeData.contact) {
  const { email, phone, linkedin, github } = resumeData.contact;
  const contactText = `Contact: Email: ${email}, Phone: ${phone}, LinkedIn: ${linkedin}, GitHub: ${github}.`;
  chunks.push({
    text: contactText,
    embedding: [],
    metadata: { type: 'contact', source: 'resume' }
  });
}

// 7. Resume Link Chunk (optional)
if (resumeData.resumeLink) {
  const linkText = `Resume Link: ${resumeData.resumeLink}`;
  chunks.push({
    text: linkText,
    embedding: [],
    metadata: { type: 'resumeLink', source: 'resume' }
  });
}

const promises = chunks.map((chunk, index) => {
  const docId = `chunk_${String(index + 1).padStart(3, '0')}`;
  return db.collection('profileChunks').doc(docId).set(chunk)
    .then(() => {
      console.log(`Chunk ${docId} written successfully.`);
    })
    .catch((error) => {
      console.error(`Error writing chunk ${docId}:`, error);
    });
});

Promise.all(promises)
  .then(() => {
    console.log("All chunks written successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error writing chunks:", error);
    process.exit(1);
  });
