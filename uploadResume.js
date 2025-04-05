// uploadResume.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

db.listCollections()
  .then(collections => {
    console.log("Collections in Firestore:", collections.map(c => c.id));
  })
  .catch(err => {
    console.error("Error listing collections:", err);
  });



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

db.collection('profileInfo').doc('resume').set(resumeData)
  .then(() => {
    console.log("Resume document successfully written!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error writing document: ", error);
    process.exit(1);
  });
