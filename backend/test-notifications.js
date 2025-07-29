const mongoose = require('mongoose');
const Notification = require('./models/notification');
const User = require('./models/user');
const Job = require('./models/job');
const Application = require('./models/application');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/careers');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test notification creation
const testNotificationSystem = async () => {
  try {
    await connectDB();
    
    console.log('Testing notification system...');
    
    // Find a user and job for testing
    const testUser = await User.findOne({ role: 'user' });
    const testJob = await Job.findOne({ isActive: true });
    
    if (!testUser || !testJob) {
      console.log('No test user or job found. Creating test notification with dummy data...');
      
      // Create a test notification with dummy data
      const testNotification = await Notification.createJobUpdateNotification(
        new mongoose.Types.ObjectId(), // dummy user ID
        new mongoose.Types.ObjectId(), // dummy job ID  
        new mongoose.Types.ObjectId(), // dummy application ID
        {
          jobTitle: 'Test Software Engineer Position',
          oldRequirements: [
            '2+ years of JavaScript experience',
            'Knowledge of React'
          ],
          newRequirements: [
            '3+ years of JavaScript experience',
            'Knowledge of React and Node.js',
            'Experience with MongoDB'
          ],
          oldResponsibilities: [
            'Develop web applications',
            'Write clean code'
          ],
          newResponsibilities: [
            'Develop web applications', 
            'Write clean code',
            'Mentor junior developers'
          ],
          changedFields: ['requirements', 'responsibilities'],
          updateType: 'both'
        }
      );
      
      console.log('✅ Test notification created:', testNotification._id);
    } else {
      // Create a real test notification
      const testNotification = await Notification.createJobUpdateNotification(
        testUser._id,
        testJob._id,
        new mongoose.Types.ObjectId(), // dummy application ID
        {
          jobTitle: testJob.title,
          oldRequirements: ['Original requirement'],
          newRequirements: ['Updated requirement', 'New additional requirement'],
          oldResponsibilities: ['Original responsibility'],
          newResponsibilities: ['Updated responsibility', 'New additional responsibility'],
          changedFields: ['requirements', 'responsibilities'],
          updateType: 'both'
        }
      );
      
      console.log('✅ Test notification created for real user:', testNotification._id);
      console.log('User:', testUser.email);
      console.log('Job:', testJob.title);
    }
    
    // Test notification retrieval
    const notifications = await Notification.find({})
      .populate('relatedJobId', 'title company')
      .sort({ createdAt: -1 })
      .limit(5);
      
    console.log(`\n📄 Found ${notifications.length} notifications:`);
    notifications.forEach(notification => {
      console.log(`- ${notification.title} (${notification.type}) - ${notification.priority} priority`);
      if (notification.jobUpdateDetails) {
        console.log(`  Update type: ${notification.jobUpdateDetails.updateType}`);
        console.log(`  Changed fields: ${notification.jobUpdateDetails.changedFields.join(', ')}`);
      }
    });
    
    console.log('\n✅ Notification system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run the test
testNotificationSystem();
