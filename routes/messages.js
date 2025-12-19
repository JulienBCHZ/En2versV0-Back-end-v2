const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const isAuthenticated = require("../middleware/isAuthenticated");

function getAuthUsername(req) {
  return req.user?.account?.username || req.user?.username;
}

// DEBUG 
router.get("/messages/debug-auth", isAuthenticated, (req, res) => {
  res.json({
    ok: true,
    userId: req.user?._id,
    username: getAuthUsername(req),
  });
});

// Send message
router.post("/messages", isAuthenticated, async (req, res) => {
  const fromUsername = getAuthUsername(req);
  const { toUsername, text } = req.body;

  if (!fromUsername) return res.status(401).json({ message: "Unauthorized" });
  if (!toUsername || !text) return res.status(400).json({ message: "Missing toUsername or text" });

  try {
    const msg = await Message.create({ fromUsername, toUsername, text });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thread with a user
router.get("/messages/thread", isAuthenticated, async (req, res) => {
  const me = getAuthUsername(req);
  const withUsername = req.query.with;

  if (!me) return res.status(401).json({ message: "Unauthorized" });
  if (!withUsername) return res.status(400).json({ message: "Missing ?with=username" });

  try {
    const msgs = await Message.find({
      $or: [
        { fromUsername: me, toUsername: withUsername },
        { fromUsername: withUsername, toUsername: me },
      ],
    }).sort({ createdAt: 1 });

    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Conversations list (latest per user)
router.get("/messages/conversations", isAuthenticated, async (req, res) => {
  const me = getAuthUsername(req);
  if (!me) return res.status(401).json({ message: "Unauthorized" });

  try {
    const all = await Message.find({
      $or: [{ fromUsername: me }, { toUsername: me }],
    }).sort({ createdAt: -1 });

    const map = new Map();
    for (const m of all) {
      const other = m.fromUsername === me ? m.toUsername : m.fromUsername;
      if (!map.has(other)) map.set(other, m);
    }

    const conversations = Array.from(map.entries()).map(([otherUsername, lastMessage]) => ({
      otherUsername,
      lastMessage,
    }));

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;