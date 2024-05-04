const express = require("express");
const app = express();
require('dotenv').config()
const mongoose = require('mongoose');

app.get("/", async (req, res) => {
  res.status(500).json({ message: "Now learn rest in node." });
});
mongoose.connect(
  "mongodb://localhost:27017/course-goals",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.error("FAILED TO CONNECT TO MONGODB");
      console.error(err);
    } else {
      console.log("CONNECTED TO MONGODB");
      app.listen(process.env.PORT);
    }
  }
);
