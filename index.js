const connectToMongo = require('./config/db');
const express = require('express');
const cors = require('cors')
const userRoutes = require('./routes/userRoutes')

connectToMongo();
const app = express();
// Cors error resolution.
app.use(cors());

// Routes ::

app.use("/api/user", userRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/message", messageRoutes);



// // --------------------------deployment------------------------------

// const __dirname1 = path.resolve();

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname1, "/frontend/build")));

//   app.get("*", (req, res) =>
//     res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
//   );
// } else {
//   app.get("/", (req, res) => {
//     res.send("API is running..");
//   });
// }

// --------------------------deployment------------------------------

// Error Handling middlewares
// app.use(notFound);
// app.use(errorHandler);

const port = 5000;

app.use(express.json());

app.listen(port, () => {
    console.log(`Mynotebook app listening at http://localhost:${port}`)
})