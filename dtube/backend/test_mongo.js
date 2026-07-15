const mongoose = require('mongoose');

const uri = "mongodb+srv://hibaNITT:hibaNITT2025@cluster0.8g1if9e.mongodb.net/dtube";

console.log("Attempting to connect to MongoDB Atlas...");
mongoose.connect(uri)
  .then(() => {
    console.log("Successfully connected to MongoDB Atlas!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection failed with error:");
    console.error(err);
    process.exit(1);
  });
