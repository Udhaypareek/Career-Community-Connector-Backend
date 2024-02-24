const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors')

connectToMongo();
const app = express();
// Cors error resolution.
app.use(cors());
const port = 5000;

app.use(express.json());

app.listen(port, () => {
    console.log(`Mynotebook app listening at http://localhost:${port}`)
})