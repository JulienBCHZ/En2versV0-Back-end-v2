const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const http = require("http");

const app = express();

// -------- Middleware base
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// -------- Health / Ready
let mongoReady = false;

app.get("/health", (req, res) => res.status(200).json({ ok: true }));

app.get("/ready", (req, res) => {
  if (!mongoReady) return res.status(503).json({ ok: false, mongoReady: false });
  return res.status(200).json({ ok: true, mongoReady: true });
});

// -------- Cloudinary (safe)
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (e) {
  console.error("Cloudinary config error:", e?.message);
}

// -------- Import routes (robuste)
function safeUse(router, name = "router") {
  try {
    app.use(router);
    console.log(`✅ Mounted ${name}`);
  } catch (e) {
    console.error(`❌ Failed to mount ${name}:`, e.message);
    throw e;
  }
}

try {
  safeUse(require("./routes/authentification"), "authentification");
  safeUse(require("./routes/user"), "user");
  safeUse(require("./routes/book"), "book");
  safeUse(require("./routes/reviews"), "reviews");
  safeUse(require("./routes/letter"), "letter");
  safeUse(require("./routes/deepDive"), "deepDive");
  safeUse(require("./routes/excerpt"), "excerpt");
  safeUse(require("./routes/favorite"), "favorite");
  safeUse(require("./routes/follow"), "follow");
  safeUse(require("./routes/messages"), "messages");
} catch (e) {
  console.error("❌ Boot failed while mounting routes:", e.message);
  process.exit(1);
}

app.get("/", (req, res) => res.json({ message: "We are in !" }));

// 404
app.all(/.*/, (req, res) =>
  res.status(404).json({ message: "Route does not exist" })
);

// -------- Server + Socket.io
const server = http.createServer(app);

try {
  const io = require("socket.io")(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    const { username } = socket.handshake.query || {};
    socket.username = username || "anonymous";
    socket.join("chatRoom");

    socket.emit("hello", "connected");

    socket.on("add user", () => {
      socket.emit("login", { username: socket.username });
      socket.broadcast.emit("user joined", `${socket.username} is connected`);
    });

    socket.on("new message", (message) => {
      socket.broadcast.emit("new message", message);
    });

    socket.on("typing", () =>
      socket.broadcast.emit("typing", { username: socket.username })
    );

    socket.on("stop typing", () =>
      socket.broadcast.emit("stop typing", { username: socket.username })
    );

    socket.on("disconnect", () => {
      socket.broadcast.emit("user left", `${socket.username} disconnected`);
    });
  });
} catch (e) {
  console.error("⚠️ Socket.io init failed (continuing without WS):", e.message);
}

// -------- Mongo connect (robuste)
async function connectMongo() {
  // debug sans leak
  console.log("🔎 MONGODB_URI present?", !!process.env.MONGODB_URI);
  console.log("🔎 MONGODB_URI length:", process.env.MONGODB_URI?.length || 0);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing");
    mongoReady = false;
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    mongoReady = true;
    console.log("✅ Mongo connected");
  } catch (e) {
    mongoReady = false;
    console.error("❌ Mongo connect error:", e.message);
  }
}

// -------- Start
const PORT = Number(process.env.PORT) || 8080;

server.listen(PORT, "0.0.0.0", async () => {
  console.log("🚀 Server listening on", PORT);
  await connectMongo(); // ✅ IMPORTANT: sinon mongoReady reste false
});

// -------- Process guards
process.on("unhandledRejection", (reason) => {
  console.error("❌ unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ uncaughtException:", err);
  process.exit(1);
});