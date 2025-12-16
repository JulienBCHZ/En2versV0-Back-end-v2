const express = require("express");
const router = express.Router();
const Letter = require("../models/Letter");
const isAuthenticated = require("../middleware/isAuthenticated");

// CREATE - Create a new letter
router.post("/post", isAuthenticated, async (req, res) => {
  try {
    const letter = new Letter({
      content: req.body.content,
      author: req.user._id,
    });
    const result = await letter.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// READ ALL - Get all letters
router.get("/posts", isAuthenticated, async (req, res) => {
  try {
    const letters = await Letter.find().populate("author");

    const lettersWithLikeInfo = letters.map((letter) => ({
      _id: letter._id,
      content: letter.content,
      author: letter.author,
      likes: letter.likes,
      likesCount: letter.likes.length,
      isLikedByUser: letter.likes.some(
        (id) => id.toString() === req.user._id.toString()
      ),
      createdAt: letter.createdAt,
      updatedAt: letter.updatedAt,
    }));

    res.status(200).json(lettersWithLikeInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ ONE - Get a letter by ID
router.get("/post/:id", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id).populate("author");

    if (!letter) {
      return res.status(404).json({ message: "Letter not found." });
    }

    res.status(200).json({
      _id: letter._id,
      content: letter.content,
      author: letter.author,
      likes: letter.likes,
      likesCount: letter.likes.length,
      isLikedByUser: letter.likes.some(
        (id) => id.toString() === req.user._id.toString()
      ),
      createdAt: letter.createdAt,
      updatedAt: letter.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TOGGLE LIKE - Like/Unlike a letter
router.post("/post/:id/like", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ message: "Letter not found." });
    }

    const userId = req.user._id;
    const hasLiked = letter.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (hasLiked) {
      // Unlike
      letter.likes = letter.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like
      letter.likes.push(userId);
    }

    await letter.save();

    res.status(200).json({
      message: hasLiked ? "Letter unliked." : "Letter liked.",
      likesCount: letter.likes.length,
      isLikedByUser: !hasLiked,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE - Update a letter
router.put("/post/:id", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ message: "Letter not found." });
    }

    if (letter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    letter.content = req.body.content;
    const result = await letter.save();

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Delete a letter
router.delete("/post/:id", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ message: "Letter not found." });
    }

    if (letter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    await Letter.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Letter deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
