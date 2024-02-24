const mongoose = require('mongoose');
const mongoURL = "mongodb+srv://Udhaypareek:61mUxdiUjHwA5L8R@cluster1.wio2sfb.mongodb.net/"

// This is the code for connecting our backend with our database.
const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoURL); 
        console.log('Connected to Mongo successfully!');
    } catch (error) {
        console.error('Error connecting to Mongo:', error);
    }
};
module.exports = connectToMongo;