const mongoose = require('mongoose');
require('dotenv').config();
const Video = require('./models/video');
const User = require('./models/user');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const videoCount = await Video.countDocuments();
    const userCount = await User.countDocuments();
    const videos = await Video.find().limit(5).select('title createdAt videoUrl uploader');

    console.log('=== DATABASE STATUS ===');
    console.log('Total Users:', userCount);
    console.log('Total Videos:', videoCount);
    if (videos.length > 0) {
      console.log('\nSample Videos:');
      videos.forEach(v => console.log(' -', v.title, '| url:', v.videoUrl, '| uploaded:', v.createdAt));
    } else {
      console.log('\nNo videos found in database.');
    }
    process.exit(0);
  })
  .catch(e => {
    console.error('DB connection failed:', e.message);
    process.exit(1);
  });
