const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config()
const mongoURL = `${process.env.MONGO_URI}`;


// This is the code for connecting our backend with our database.
const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoURL); 
        console.log('Connected to our database successfully!');
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
};
module.exports = connectToMongo;