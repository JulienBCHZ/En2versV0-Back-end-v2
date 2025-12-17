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
const reviewsRouter = require("./routes/reviews");
const letterRouter = require("./routes/letter");
const deepDiveRouter = require("./routes/deepDive");
const excerptRouter = require("./routes/excerpt");
const favoriteRouter = require("./routes/favorite");
const followRouter = require("./routes/follow");

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  res.json({ message: "We are in !" });
});

// ROUTES

app.use(authentificationRouter);
app.use(userRouter);
app.use(bookRouter);
app.use(reviewsRouter);
app.use(letterRouter);
app.use(deepDiveRouter);
app.use(excerptRouter);
app.use(favoriteRouter);
app.use(followRouter);

app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "Route does not exist" });
});

// SERVER

app.listen(process.env.PORT, () => {
  console.log("Server started 🚀");
});
