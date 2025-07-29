// Test script for Job Update Notifications
// This can be run in the browser console or used for development testing

const testJobUpdateNotifications = async () => {
  try {
    console.log('Testing Job Update Notification System...');
    
    // 1. Test creating a job update notification
    console.log('1. Testing notification creation when job is updated...');
    
    // Example: Update a job with new requirements
    const jobUpdateData = {
      title: "Senior Software Engineer",
      company: "OM Softwares", 
      description: "We are looking for a Senior Software Engineer...",
      requirements: [
        "5+ years of experience in JavaScript",
        "Experience with React.js and Node.js", 
        "Knowledge of MongoDB",
        "Experience with AWS cloud services", // New requirement
        "Understanding of microservices architecture" // New requirement
      ],
      responsibilities: [
        "Develop and maintain web applications",
        "Collaborate with cross-functional teams",
        "Write clean and efficient code",
        "Mentor junior developers", // New responsibility
        "Lead technical discussions" // New responsibility
      ]
    };
    
    console.log('Sample job update data:', jobUpdateData);
    
    // 2. Test notification fetching
    console.log('2. Testing notification API endpoints...');
    
    // Test getting user notifications
    fetch('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('User notifications:', data);
    })
    .catch(error => {
      console.error('Error fetching notifications:', error);
    });
    
    // Test getting unread count
    fetch('/api/notifications/count', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Unread count:', data);
    })
    .catch(error => {
      console.error('Error fetching unread count:', error);
    });
    
    console.log('Test completed. Check the network tab for API responses.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Component testing scenarios
const notificationTestScenarios = {
  jobUpdate: {
    type: 'job_update',
    title: 'Job Requirements Updated',
    message: 'The job "Senior Software Engineer" you applied for has been updated. The job requirements have been modified. Please review the updated requirements and consider updating your application or skills accordingly.',
    priority: 'high',
    relatedJobId: {
      _id: '507f1f77bcf86cd799439011',
      title: 'Senior Software Engineer'
    },
    relatedApplicationId: '507f1f77bcf86cd799439012',
    jobUpdateDetails: {
      oldRequirements: [
        '3+ years of experience in JavaScript',
        'Experience with React.js',
        'Knowledge of MongoDB'
      ],
      newRequirements: [
        '5+ years of experience in JavaScript',
        'Experience with React.js and Node.js',
        'Knowledge of MongoDB',
        'Experience with AWS cloud services',
        'Understanding of microservices architecture'
      ],
      oldResponsibilities: [
        'Develop and maintain web applications',
        'Collaborate with cross-functional teams',
        'Write clean and efficient code'
      ],
      newResponsibilities: [
        'Develop and maintain web applications',
        'Collaborate with cross-functional teams', 
        'Write clean and efficient code',
        'Mentor junior developers',
        'Lead technical discussions'
      ],
      changedFields: ['requirements', 'responsibilities'],
      updateType: 'both',
      jobTitle: 'Senior Software Engineer'
    },
    isRead: false,
    createdAt: new Date().toISOString()
  },
  
  applicationStatus: {
    type: 'application_status',
    title: 'Application Status Updated',
    message: 'Your application for "Frontend Developer" has been updated to "Under Review".',
    priority: 'medium',
    relatedJobId: {
      _id: '507f1f77bcf86cd799439013',
      title: 'Frontend Developer'
    },
    relatedApplicationId: '507f1f77bcf86cd799439014',
    isRead: false,
    createdAt: new Date().toISOString()
  }
};

console.log('Job Update Notification System loaded. Available test functions:');
console.log('- testJobUpdateNotifications(): Test the notification API endpoints');
console.log('- notificationTestScenarios: Sample notification data for component testing');

// Export for use in development
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testJobUpdateNotifications,
    notificationTestScenarios
  };
}
