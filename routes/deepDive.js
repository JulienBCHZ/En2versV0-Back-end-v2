const express = require("express");
const router = express.Router();
const DeepDive = require("../models/DeepDive");
const isAuthenticated = require("../middleware/isAuthenticated");

// CREATE - Create a new DeepDive
router.post("/deepdive", isAuthenticated, async (req, res) => {
  try {
    const { book, content, containsSpoiler } = req.body;

    if (!book || !book.bookKey || !book.title) {
      return res.status(400).json({
        success: false,
        message: "The book must contain at least bookKey and title.",
      });
    }

    const newDeepDive = new DeepDive({
      author: req.user._id,
      book: {
        bookKey: book.bookKey,
        title: book.title,
        author: book.author || "Unknown author",
        coverUrl: book.coverUrl || null,
      },
      content,
      containsSpoiler: containsSpoiler ?? true,
    });

    const savedDeepDive = await newDeepDive.save();
    await savedDeepDive.populate(
      "author",
      "account.username email account.avatar"
    );

    res.status(201).json({
      success: true,
      message: "DeepDive created successfully",
      data: savedDeepDive,
    });
  } catch (error) {
    console.error("Error creating DeepDive:", error);
    res.status(500).json({
      success: false,
      message: "Error creating the DeepDive",
      error: error.message,
    });
  }
});

// READ ALL - Get all DeepDives
router.get("/deepdive", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const deepdives = await DeepDive.find()
      .populate("author", "account.username email account.avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await DeepDive.countDocuments();

    res.status(200).json({
      success: true,
      data: deepdives,
      likes: deepdive.likes,
      likesCount: deepdive.likes.length,
      isLikedByUser: deepdive.likes.some(
        (id) => id.toString() === req.user._id.toString()
      ),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving DeepDives",
      error: error.message,
    });
  }
});

// READ BY BOOK - Get DeepDives by bookKey
router.get("/deepdive/book/:bookKey", async (req, res) => {
  try {
    const { bookKey } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const deepdives = await DeepDive.find({ "book.bookKey": bookKey })
      .populate("author", "accoount.username email account.avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await DeepDive.countDocuments({ "book.bookKey": bookKey });

    res.status(200).json({
      success: true,
      data: deepdives,
      likes: deepdive.likes,
      likesCount: deepdive.likes.length,
      isLikedByUser: deepdive.likes.some(
        (id) => id.toString() === req.user._id.toString()
      ),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving DeepDives",
      error: error.message,
    });
  }
});
// TOGGLE LIKE - Like/Unlike a deepdive
router.post("/deepdive/:id/like", isAuthenticated, async (req, res) => {
  try {
    const deepdive = await Deepdive.findById(req.params.id);

    if (!deepdive) {
      return res.status(404).json({ message: "deepdive not found." });
    }

    const userId = req.user._id;
    const hasLiked = deepdive.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (hasLiked) {
      // Unlike
      deepdive.likes = deepdive.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like
      deepdive.likes.push(userId);
    }

    await deepdive.save();

    res.status(200).json({
      message: hasLiked ? "deepdive unliked." : "deepdive liked.",
      likesCount: deepdive.likes.length,
      isLikedByUser: !hasLiked,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// READ ONE - Get a DeepDive by ID
router.get("/deepdive/:id", async (req, res) => {
  try {
    const deepDive = await DeepDive.findById(req.params.id).populate(
      "author",
      "account.username email account.avatar"
    );

    if (!deepDive) {
      return res.status(404).json({
        success: false,
        message: "DeepDive not found",
      });
    }

    res.status(200).json({
      success: true,
      data: deepDive,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving the DeepDive",
      error: error.message,
    });
  }
});

// UPDATE - Modify a DeepDive
router.put("/deepdive/:id", isAuthenticated, async (req, res) => {
  try {
    const deepDive = await DeepDive.findById(req.params.id);

    if (!deepDive) {
      return res.status(404).json({
        success: false,
        message: "DeepDive not found",
      });
    }

    if (deepDive.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { content, containsSpoiler } = req.body;
    if (content !== undefined) deepDive.content = content;
    if (containsSpoiler !== undefined)
      deepDive.containsSpoiler = containsSpoiler;

    const updated = await deepDive.save();
    await updated.populate("author", "account.username email account.avatar");

    res.status(200).json({
      success: true,
      message: "DeepDive updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating the DeepDive",
      error: error.message,
    });
  }
});

// DELETE - Delete a DeepDive
router.delete("/deepdive/:id", isAuthenticated, async (req, res) => {
  try {
    const deepDive = await DeepDive.findById(req.params.id);

    if (!deepDive) {
      return res.status(404).json({
        success: false,
        message: "DeepDive not found",
      });
    }

    if (deepDive.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await DeepDive.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "DeepDive deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting the DeepDive",
      error: error.message,
    });
  }
});

module.exports = router;
