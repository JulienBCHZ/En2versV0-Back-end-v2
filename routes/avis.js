const express = require("express");
const router = express.Router();
const Avis = require("../models/Avis");

// ============================================
// POST - Créer un avis
// ============================================
router.post("/avis", async (req, res) => {
  try {
    const { contenu, note, contientSpoiler } = req.body;

    // Validation basique
    if (!contenu || !note) {
      return res.status(400).json({
        message: "Le contenu et la note sont requis",
      });
    }

    // Créer le nouvel avis
    const nouvelAvis = new Avis({
      auteur: req.user._id, // L'utilisateur connecté
      avatar: req.user.avatar || "default-avatar.png",
      contenu,
      note,
      contientSpoiler: contientSpoiler || false,
    });

    await nouvelAvis.save();

    // Populer l'auteur avant de renvoyer
    await nouvelAvis.populate("auteur", "username avatar");

    res.status(201).json({
      message: "Avis créé avec succès",
      avis: nouvelAvis,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la création de l'avis",
      error: error.message,
    });
  }
});

// ============================================
// GET - Récupérer tous les avis
// ============================================
router.get("/avis", async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const avis = await Avis.find()
      .populate("auteur", "username avatar") // Récupère les infos de l'auteur
      .sort(sort) // Tri par date décroissante par défaut
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Avis.countDocuments();

    res.status(200).json({
      avis,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération des avis",
      error: error.message,
    });
  }
});

// ============================================
// GET - Récupérer un avis par ID
// ============================================
router.get("/avis/:id", async (req, res) => {
  try {
    const avis = await Avis.findById(req.params.id).populate(
      "auteur",
      "username avatar"
    );

    if (!avis) {
      return res.status(404).json({
        message: "Avis non trouvé",
      });
    }

    res.status(200).json(avis);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération de l'avis",
      error: error.message,
    });
  }
});

// ============================================
// GET - Récupérer les avis d'un utilisateur
// ============================================
router.get("/avis/user/:userId", async (req, res) => {
  try {
    const avis = await Avis.find({ auteur: req.params.userId })
      .populate("auteur", "username avatar")
      .sort("-createdAt");

    res.status(200).json({
      count: avis.length,
      avis,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération des avis",
      error: error.message,
    });
  }
});

// ============================================
// PUT - Modifier un avis
// ============================================
router.put("/avis/:id", async (req, res) => {
  try {
    const { contenu, note, contientSpoiler } = req.body;

    const avis = await Avis.findById(req.params.id);

    if (!avis) {
      return res.status(404).json({
        message: "Avis non trouvé",
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (avis.auteur.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Non autorisé à modifier cet avis",
      });
    }

    // Mettre à jour les champs
    if (contenu) avis.contenu = contenu;
    if (note) avis.note = note;
    if (contientSpoiler !== undefined) avis.contientSpoiler = contientSpoiler;

    await avis.save(); // Le middleware pre-save mettra à jour updatedAt

    res.status(200).json({
      message: "Avis modifié avec succès",
      avis,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la modification de l'avis",
      error: error.message,
    });
  }
});

// ============================================
// DELETE - Supprimer un avis
// ============================================
router.delete("/avis/:id", async (req, res) => {
  try {
    const avis = await Avis.findById(req.params.id);

    if (!avis) {
      return res.status(404).json({
        message: "Avis non trouvé",
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (avis.auteur.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Non autorisé à supprimer cet avis",
      });
    }

    await Avis.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Avis supprimé avec succès",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la suppression de l'avis",
      error: error.message,
    });
  }
});

module.exports = router;
