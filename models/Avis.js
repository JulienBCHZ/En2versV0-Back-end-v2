const mongoose = require("mongoose");

const avisSchema = new mongoose.Schema({
  auteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  avatar: {
    type: String,
    default: "default-avatar.png",
  },
  contenu: {
    type: String,
    required: [true, "Le contenu est requis"],
  },
  note: {
    type: Number,
    required: [true, "La note est requise"],
    min: [1, "La note minimum est 1"],
    max: [5, "La note maximum est 5"],
  },
  contientSpoiler: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pour mettre à jour updatedAt
avisSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Avis = mongoose.model("Avis", avisSchema);

module.exports = Avis;
