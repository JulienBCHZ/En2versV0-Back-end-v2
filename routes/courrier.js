const express = require("express");
const router = express.Router();
const Courrier = require("../models/Courrier");
const isAuthenticated = require("../middleware/isAuthenticated");

// CREATE - Créer un courrier
router.post("/post", isAuthenticated, async (req, res) => {
  try {
    const courrier = new Courrier({
      contenu: req.body.contenu,
      auteur: req.user._id,
    });
    const result = await courrier.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// READ ALL - Récupérer tous les courriers
router.get("/posts", isAuthenticated, async (req, res) => {
  try {
    const courriers = await Courrier.find().populate("auteur");
    res.status(200).json(courriers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ ONE - Récupérer un courrier par ID
router.get("/post/:id", isAuthenticated, async (req, res) => {
  try {
    const courrier = await Courrier.findById(req.params.id).populate("auteur");
    if (!courrier) {
      return res.status(404).json({ message: "Mail not found." });
    }
    res.status(200).json(courrier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE - Mettre à jour un courrier
router.put("/post/:id", isAuthenticated, async (req, res) => {
  try {
    const courrier = await Courrier.findById(req.params.id);

    if (!courrier) {
      return res.status(404).json({ message: "Mail not found." });
    }

    //Vérifier que l'utilisateur est l'auteur
    if (courrier.auteur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    //Ne mettre à jour que le contenu (pas l'auteur)
    courrier.contenu = req.body.contenu;
    const result = await courrier.save();

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/post/:id", isAuthenticated, async (req, res) => {
  try {
    const courrier = await Courrier.findById(req.params.id);

    if (!courrier) {
      return res.status(404).json({ message: "Mail not found." });
    }

    //Vérifier que l'utilisateur est l'auteur
    if (courrier.auteur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    await Courrier.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Mail deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
