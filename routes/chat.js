const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
const server = require("http").createServer(app); // création du type de seveur ici pour socketIO
const io = require("socket.io")(server, { cors: { origin: "*" } }); // initialisation de socketIO en lui précisant quel server utiliser

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
const messagesRouter = require("./routes/messages");

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
app.use(messagesRouter);

app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "Route does not exist" });
});

// SOCKET CHAT

io.on("connection", (socket) => {
  let users = [];
  const { username } = socket.handshake.query;

  socket.username = username;
  socket.join("chatRoom");
  const clients = socket.adapter.rooms.get("chatRoom");
  console.log("in room :", clients);

  for (const clientId of clients) {
    const clientSocket = io.sockets.sockets.get(clientId);
    users.push({ name: clientSocket.username, id: clientSocket.id });
  }
  //

  console.log("USERS :", users);

  io.emit("hello", "connected");

  // when the client emits 'add user', this listens and executes
  socket.on("add user", () => {
    socket.emit("login", { users: users, username: username });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit("user joined", `${username} is connected`);
  });

  // when the client emits 'new message', this listens and executes
  socket.on("new message", (message) => {
    console.log("MSG :", message);
    // we tell the client to execute 'new message'
    socket.broadcast.emit("new message", message);
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on("typing", () => {
    socket.broadcast.emit("typing", {
      username: username,
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing", {
      username: username,
    });
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", () => {
    const clients = socket.adapter.rooms.get("chatRoom");
    if (clients) {
      for (const clientId of clients) {
        const clientSocket = io.sockets.sockets.get(clientId);
        users.push({ name: clientSocket.username, id: clientSocket.id });
      }
    }
    socket.broadcast.emit("user left", `${username} disconnected`);
  });
});

// SERVER

server.listen(process.env.PORT, () => {
  console.log("Server started 🚀");
});
