const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/messages", isAuthenticated, async (req, res) => {
  const { newMessage, username } = req.body;
  if (!newMessage || !username) {
    return res.status(400).json({ message: "Missing message or username" });
  }

  try {
    const newStoredMessage = new Message({
      senderUsername: username,
      text: newMessage,
    });
    await newStoredMessage.save();
    res.status(201).json(newStoredMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/messages/all", isAuthenticated, async (req, res) => {
  try {
    const msgs = await Message.find().sort({ createdAt: 1 });
    res.json(msgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
