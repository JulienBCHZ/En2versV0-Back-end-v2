const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/messages", isAuthenticated, async (req, res) => {
  const { newMessage, username } = req.body;
  if (newMessage && username) {
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
  } else {
    return res.status(401).json({ message: "Error with message or username" });
  }
});

router.get("/messages/all", isAuthenticated, async (req, res) => {
  try {
    const getPreviousMessages = await Message.find().sort(`date`);
    if (getPreviousMessages) {
      res.status(201).json(getPreviousMessages);
    } else {
      return null;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
