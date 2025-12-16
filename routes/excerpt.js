const express = require("express");
const router = express.Router();
const Excerpt = require("../models/Excerpt");
const authMiddleware = require("../middleware/isAuthenticated");
const isAuthenticated = require("../middleware/isAuthenticated");

// CREATE - Create a new excerpt
router.post("/excerpt", isAuthenticated, async (req, res) => {
  try {
    const { book, content } = req.body;

    if (!book || !book.bookKey || !book.title) {
      return res.status(400).json({
        success: false,
        message: "The book must contain at least bookKey and title.",
      });
    }

    const newExcerpt = new Excerpt({
      author: req.user._id,

      book: {
        bookKey: book.bookKey,
        title: book.title,
        author: book.author || "Unknown author",
        coverUrl: book.coverUrl || null,
      },
      content,
    });

    const savedExcerpt = await newExcerpt.save();
    await savedExcerpt.populate(
      "author",
      "account.username email account.avatar"
    );

    res.status(201).json({
      success: true,
      message: "Excerpt created successfully",
      data: savedExcerpt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating the excerpt",
      error: error.message,
    });
  }
});

// READ ALL - Get all excerpts
router.get("/excerpt", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const excerpts = await Excerpt.find()
      .populate("author", "username email avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Excerpt.countDocuments();

    res.status(200).json({
      success: true,
      data: excerpts,
      likes: letter.likes,
      likesCount: letter.likes.length,
      isLikedByUser: letter.likes.some(
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
      message: "Error retrieving excerpts",
      error: error.message,
    });
  }
});

// READ BY BOOK - Get excerpts by bookKey
router.get("/excerpt/book/:bookKey", async (req, res) => {
  try {
    const { bookKey } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const excerpts = await Excerpt.find({ "book.bookKey": bookKey })
      .populate("author", "account.username email account.avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Excerpt.countDocuments({ "book.bookKey": bookKey });

    res.status(200).json({
      success: true,
      data: excerpts,
      likes: letter.likes,
      likesCount: letter.likes.length,
      isLikedByUser: letter.likes.some(
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
      message: "Error retrieving excerpts",
      error: error.message,
    });
  }
});
// TOGGLE LIKE - Like/Unlike a excerpt
router.post("/excerpt/:id/like", isAuthenticated, async (req, res) => {
  try {
    const excerpt = await Excerpt.findById(req.params.id);

    if (!excerpt) {
      return res.status(404).json({ message: "excerpt not found." });
    }

    const userId = req.user._id;
    const hasLiked = excerpt.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (hasLiked) {
      // Unlike
      excerpt.likes = excerpt.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like
      excerpt.likes.push(userId);
    }

    await excerpt.save();

    res.status(200).json({
      message: hasLiked ? "excerpt unliked." : "excerpt liked.",
      likesCount: excerpt.likes.length,
      isLikedByUser: !hasLiked,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// READ ONE - Get an excerpt by ID
router.get("/excerpt/:id", async (req, res) => {
  try {
    const excerpt = await Excerpt.findById(req.params.id).populate(
      "author",
      "account.username email account.avatar"
    );

    if (!excerpt) {
      return res.status(404).json({
        success: false,
        message: "Excerpt not found",
      });
    }

    res.status(200).json({
      success: true,
      data: excerpt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving the excerpt",
      error: error.message,
    });
  }
});

// UPDATE - Modify an excerpt
router.put("/excerpt/:id", isAuthenticated, async (req, res) => {
  try {
    const excerpt = await Excerpt.findById(req.params.id);

    if (!excerpt) {
      return res.status(404).json({
        success: false,
        message: "Excerpt not found",
      });
    }

    if (excerpt.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { content } = req.body;
    if (content !== undefined) excerpt.content = content;

    const updated = await excerpt.save();
    await updated.populate("author", "account.username email account.avatar");

    res.status(200).json({
      success: true,
      message: "Excerpt updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating the excerpt",
      error: error.message,
    });
  }
});

// DELETE - Delete an excerpt
router.delete("/excerpt/:id", isAuthenticated, async (req, res) => {
  try {
    const excerpt = await Excerpt.findById(req.params.id);

    if (!excerpt) {
      return res.status(404).json({
        success: false,
        message: "Excerpt not found",
      });
    }

    if (excerpt.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await Excerpt.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Excerpt deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting the excerpt",
      error: error.message,
    });
  }
});

module.exports = router;
