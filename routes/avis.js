const express = require("express");
const router = express.Router();
const Avis = require("../models/Avis");
const isAuthenticated = require("../middleware/isAuthenticated");
const mongoose = require("mongoose");

// POST - Créer un avis pour un livre
router.post("/avis", isAuthenticated, async (req, res) => {
  try {
    const { contenu, note, contientSpoiler, livre } = req.body;

    // Validation basique
    if (note === undefined) {
      return res.status(400).json({
        message: "The note is required.",
      });
    }

    // Validation du livre
    if (!livre || !livre.bookKey) {
      return res.status(400).json({
        message: "The book information (bookKey) is required.",
      });
    }

    // Créer l'avis
    const nouvelAvis = new Avis({
      auteur: req.user._id,
      livre: {
        bookKey: livre.bookKey,
        title: livre.title,
        author: livre.author || "Unknown author.",
        coverUrl: livre.coverUrl || null,
      },
      contenu,
      note,
      contientSpoiler: contientSpoiler || false,
    });

    await nouvelAvis.save();

    // Populer l'auteur avant de renvoyer
    await nouvelAvis.populate("auteur", "username avatar");

    res.status(201).json({
      message: "Review successfully created.",
      avis: nouvelAvis,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while creating the review.",
      error: error.message,
    });
  }
});

// GET - Récupérer tous les avis
router.get("/avis", async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const avis = await Avis.find()
      .populate("auteur", "username avatar")
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Avis.countDocuments();

    res.status(200).json({
      avis,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while retrieving the reviews.",
      error: error.message,
    });
  }
});

// GET - Récupérer les avis d'un livre spécifique
router.get("/avis/book", async (req, res) => {
  const { bookKey } = req.query;
  try {
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Query flexible pour le bookKey
    const query = {
      $or: [
        { "livre.bookKey": bookKey },
        { "livre.bookKey": `/works/${bookKey}` },
        { "livre.bookKey": bookKey.replace("/works/", "") },
      ],
    };

    // Récupérer les avis paginés
    const avis = await Avis.find(query)
      .populate("auteur", "username avatar")
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Avis.countDocuments(query);

    res.status(200).json({
      bookKey,
      avis,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while retrieving the book’s reviews.",
      error: error.message,
    });
  }
});

// GET - Récupérer les statistiques d'un livre
router.get("/avis/book/:bookKey/stats", async (req, res) => {
  try {
    const { bookKey } = req.params;

    // Query flexible pour le bookKey
    const query = {
      $or: [
        { "livre.bookKey": bookKey },
        { "livre.bookKey": `/works/${bookKey}` },
        { "livre.bookKey": bookKey.replace("/works/", "") },
      ],
    };

    // Récupérer tous les avis
    const allAvis = await Avis.find(query).select("note"); // Juste les notes
    const totalReviews = allAvis.length;

    const averageRating =
      totalReviews > 0
        ? allAvis.reduce((sum, avis) => sum + avis.note, 0) / totalReviews
        : 0;

    const ratingDistribution = {
      0.5: 0,
      1: 0,
      1.5: 0,
      2: 0,
      2.5: 0,
      3: 0,
      3.5: 0,
      4: 0,
      4.5: 0,
      5: 0,
    };
    allAvis.forEach((avis) => {
      const roundedNote = Math.round(avis.note * 2) / 2;
      if (ratingDistribution.hasOwnProperty(roundedNote)) {
        ratingDistribution[roundedNote]++;
      }
    });

    res.status(200).json({
      bookKey,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while retrieving the statistics.",
      error: error.message,
    });
  }
});

// GET - Récupérer les avis d'un utilisateur
router.get("/avis/user/:userId", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const avis = await Avis.find({ auteur: req.params.userId })
      .populate("auteur", "username avatar")
      .sort("-createdAt")
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Avis.countDocuments({ auteur: req.params.userId });

    res.status(200).json({
      avis,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while retrieving the reviews.",
      error: error.message,
    });
  }
});

// GET - Récupérer un avis par ID
router.get("/avis/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID." });
    }

    const avis = await Avis.findById(req.params.id).populate(
      "auteur",
      "username avatar"
    );

    if (!avis) {
      return res.status(404).json({
        message: "Review not found.",
      });
    }

    res.status(200).json(avis);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while retrieving the review.",
      error: error.message,
    });
  }
});

// PUT - Modifier un avis
router.put("/avis/:id", isAuthenticated, async (req, res) => {
  try {
    const { contenu, note, contientSpoiler } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID." });
    }

    const avis = await Avis.findById(req.params.id);

    if (!avis) {
      return res.status(404).json({
        message: "Review not found.",
      });
    }

    if (avis.auteur.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to edit this review.",
      });
    }

    if (contenu !== undefined) avis.contenu = contenu;
    if (note !== undefined) avis.note = note;
    if (contientSpoiler !== undefined) avis.contientSpoiler = contientSpoiler;

    await avis.save();
    await avis.populate("author.", "username avatar");

    res.status(200).json({
      message: "Review successfully updated.",
      avis,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while updating the review.",
      error: error.message,
    });
  }
});

// DELETE - Supprimer un avis
router.delete("/avis/:id", isAuthenticated, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid ID.",
      });
    }

    const avis = await Avis.findById(req.params.id);

    if (!avis) {
      return res.status(404).json({
        message: "Review not found.",
      });
    }

    if (avis.auteur.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to delete this review.",
      });
    }

    await Avis.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Review successfully deleted.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while deleting the review.",
      error: error.message,
    });
  }
});

// POST - Liker/Unliker un avis
router.post("/avis/:id/like", isAuthenticated, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID invalide" });
    }
    const avis = await Avis.findById(req.params.id);

    if (!avis) {
      return res.status(404).json({
        message: "Review not found.",
      });
    }

    const userId = req.user._id;
    const hasLiked = avis.likes.includes(userId);

    if (hasLiked) {
      // Unlike
      avis.likes = avis.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like
      avis.likes.push(userId);
    }

    await avis.save();

    res.status(200).json({
      message: hasLiked ? "Like removed." : "Review liked.",
      likesCount: avis.likes.length,
      hasLiked: !hasLiked,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while liking.",
      error: error.message,
    });
  }
});

module.exports = router;
