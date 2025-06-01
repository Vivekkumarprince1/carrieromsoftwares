const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Job = require('./models/job');
const Application = require('./models/application');
const Certificate = require('./models/certificate');
const connectDB = require('./config/database');
require('dotenv').config();

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Regular User',
    email: 'user@example.com',
    password: 'user123',
    role: 'user'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'john123',
    role: 'user'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'jane123',
    role: 'user'
  }
];

const jobs = [
  {
    title: 'Frontend Developer',
    company: 'OM Softwares',
    description: 'We are looking for a skilled Frontend Developer to join our team. The ideal candidate should have experience with modern JavaScript frameworks and responsive design.',
    requirements: [
      'Proficient in HTML, CSS, and JavaScript',
      'Experience with React, Vue, or Angular',
      'Understanding of responsive design principles',
      'Knowledge of version control systems like Git'
    ],
    responsibilities: [
      'Develop user-facing features using modern frontend technologies',
      'Optimize applications for maximum speed and scalability',
      'Collaborate with backend developers and designers',
      'Ensure cross-browser compatibility and responsive design'
    ],
    location: 'Remote',
    type: 'Full-time',
    salary: '$70,000 - $90,000',
    questions: [
      {
        questionText: 'What is your experience with React?',
        questionType: 'text',
        required: true,
        order: 0
      },
      {
        questionText: 'Rate your CSS skills',
        questionType: 'rating',
        required: true,
        maxRating: 5,
        order: 1
      },
      {
        questionText: 'Which frontend frameworks have you worked with?',
        questionType: 'checkbox',
        required: false,
        options: ['React', 'Vue', 'Angular', 'Svelte'],
        order: 2
      }
    ],
    isActive: true
  },
  {
    title: 'Backend Developer',
    company: 'OM Softwares',
    description: 'We are seeking a Backend Developer to design and implement server-side applications. The ideal candidate should have strong knowledge of backend technologies and databases.',
    requirements: [
      'Proficient in Node.js, Python, or Java',
      'Experience with database design and management',
      'Knowledge of RESTful API design',
      'Understanding of server security concerns'
    ],
    responsibilities: [
      'Design and implement server-side applications',
      'Develop and maintain databases',
      'Ensure high performance and responsiveness to requests',
      'Collaborate with frontend developers'
    ],
    location: 'New Delhi, India',
    type: 'Full-time',
    salary: '$80,000 - $100,000',
    questions: [
      {
        questionText: 'What backend frameworks have you worked with?',
        questionType: 'text',
        required: true,
        order: 0
      },
      {
        questionText: 'Rate your database skills',
        questionType: 'rating',
        required: true,
        maxRating: 5,
        order: 1
      }
    ],
    isActive: true
  },
  {
    title: 'UI/UX Designer',
    company: 'OM Softwares',
    description: 'We are looking for a UI/UX Designer to create amazing user experiences. The ideal candidate should have a strong portfolio demonstrating their design skills.',
    requirements: [
      'Proficient in design tools like Figma, Sketch, or Adobe XD',
      'Understanding of user-centered design principles',
      'Experience with wireframing and prototyping',
      'Knowledge of accessibility standards'
    ],
    responsibilities: [
      'Create user-centered designs by understanding business requirements',
      'Develop wireframes, prototypes, and mockups',
      'Collaborate with developers to implement designs',
      'Conduct user research and testing'
    ],
    location: 'Bangalore, India',
    type: 'Full-time',
    salary: '$65,000 - $85,000',
    questions: [
      {
        questionText: 'Please share a link to your portfolio',
        questionType: 'text',
        required: true,
        order: 0
      },
      {
        questionText: 'Which design tools do you use?',
        questionType: 'multipleChoice',
        required: true,
        options: ['Figma', 'Sketch', 'Adobe XD', 'Other'],
        order: 1
      }
    ],
    isActive: true
  },
  {
    title: 'DevOps Engineer',
    company: 'OM Softwares',
    description: 'We are seeking a DevOps Engineer to help us automate and optimize our development and deployment processes.',
    requirements: [
      'Experience with CI/CD pipelines',
      'Knowledge of containerization (Docker, Kubernetes)',
      'Understanding of cloud platforms (AWS, Azure, GCP)',
      'Scripting skills (Bash, Python)'
    ],
    responsibilities: [
      'Implement and maintain CI/CD pipelines',
      'Manage cloud infrastructure',
      'Automate deployment processes',
      'Monitor system performance and troubleshoot issues'
    ],
    location: 'Remote',
    type: 'Contract',
    salary: '$90,000 - $110,000',
    isActive: true
  }
];

const applications = [
  {
    fullName: 'Michael Johnson',
    email: 'michael@example.com',
    phone: '123-456-7890',
    experience: 'Senior Frontend Developer at Tech Solutions (2018-2022)\nJunior Developer at WebCraft (2015-2018)',
    education: 'Bachelor of Science in Computer Science, University of Technology (2015)',
    skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
    coverLetter: 'I am excited to apply for the Frontend Developer position at OM Softwares. With my experience in React and responsive design, I believe I would be a great fit for your team.',
    status: 'reviewing'
  },
  {
    fullName: 'Sarah Williams',
    email: 'sarah@example.com',
    phone: '987-654-3210',
    experience: 'Backend Developer at DataSystems (2019-2023)\nSoftware Engineer Intern at TechGiant (2018)',
    education: 'Master of Science in Software Engineering, Tech University (2019)\nBachelor of Engineering in Computer Science, State University (2017)',
    skills: ['Node.js', 'Express', 'MongoDB', 'SQL', 'Python'],
    coverLetter: 'I am applying for the Backend Developer position. My experience with Node.js and database management makes me confident that I can contribute effectively to your team.',
    status: 'shortlisted'
  },
  {
    fullName: 'David Chen',
    email: 'david@example.com',
    phone: '555-123-4567',
    experience: 'UX Designer at Creative Agency (2020-2023)\nGraphic Designer at Design Studio (2017-2020)',
    education: 'Bachelor of Fine Arts in Graphic Design, Art Institute (2017)',
    skills: ['Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research'],
    coverLetter: 'I am interested in the UI/UX Designer position. My portfolio demonstrates my ability to create intuitive and visually appealing user interfaces.',
    status: 'pending'
  }
];

const certificates = [
  {
    name: 'Emily Davis',
    domain: 'Web Development',
    jobrole: 'Frontend Developer Intern',
    fromDate: new Date('2023-01-15'),
    toDate: new Date('2023-04-15'),
    issuedBy: 'OM Softwares'
  },
  {
    name: 'Ryan Wilson',
    domain: 'Mobile Development',
    jobrole: 'React Native Developer',
    fromDate: new Date('2023-02-01'),
    toDate: new Date('2023-05-01'),
    issuedBy: 'OM Softwares'
  },
  {
    name: 'Sophia Martinez',
    domain: 'UI/UX Design',
    jobrole: 'UI/UX Design Intern',
    fromDate: new Date('2023-03-10'),
    toDate: new Date('2023-06-10'),
    issuedBy: 'OM Softwares'
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('🔌 Connected to database for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Certificate.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create users with hashed passwords
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return { ...user, password: hashedPassword };
      })
    );
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`👤 Created ${createdUsers.length} users`);

    // Create jobs with admin user as poster
    const adminUser = createdUsers.find(user => user.role === 'admin');
    const jobsWithPostedBy = jobs.map(job => ({
      ...job,
      postedBy: adminUser._id
    }));
    const createdJobs = await Job.insertMany(jobsWithPostedBy);
    console.log(`💼 Created ${createdJobs.length} jobs`);

    // Create applications linked to jobs and users
    const regularUser = createdUsers.find(user => user.email === 'user@example.com');
    const applicationsWithIds = applications.map((application, index) => ({
      ...application,
      jobId: createdJobs[index % createdJobs.length]._id,
      userId: regularUser._id,
      // Add sample question answers based on the job's questions
      questionAnswers: createdJobs[index % createdJobs.length].questions?.map(question => ({
        questionId: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        answer: question.questionType === 'text' ? 'Sample answer to the question' :
               question.questionType === 'rating' ? 4 :
               question.questionType === 'multipleChoice' ? question.options[0] :
               question.questionType === 'checkbox' ? [question.options[0], question.options[1]] : ''
      })) || []
    }));
    const createdApplications = await Application.insertMany(applicationsWithIds);
    console.log(`📝 Created ${createdApplications.length} applications`);

    // Create certificates linked to users
    const certificatesWithUserId = certificates.map(certificate => ({
      ...certificate,
      userId: adminUser._id
    }));
    const createdCertificates = await Certificate.insertMany(certificatesWithUserId);
    console.log(`🏆 Created ${createdCertificates.length} certificates`);

    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();