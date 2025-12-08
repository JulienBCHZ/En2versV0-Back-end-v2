const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// IMPORT DES ROUTES
const authentificationRouter = require("./routes/authentification");
const userRouter = require("./routes/user");
const bookRouter = require("./routes/book");
const avisRouter = require("./routes/avis");

mongoose.connect(process.env.MONGODB_URI);

app.get("/", (req, res) => {
  res.json({ message: "We are in !" });
});

// ROUTES

app.use(authentificationRouter);
app.use(userRouter);
app.use(bookRouter);
app.use(avisRouter);

app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "Route does not exist" });
});

// SERVER

app.listen(process.env.PORT, () => {
  console.log("Server started 🚀");
});
