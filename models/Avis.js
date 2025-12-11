// models/Avis.js
const mongoose = require("mongoose");

const avisSchema = new mongoose.Schema(
  {
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    livre: {
      bookKey: {
        type: String,
        required: true,
        // Exemple : "/works/OL123456W"
      },
      title: {
        type: String,
        required: true,
      },
      author: {
        type: String,
        default: "Unknown author.",
      },
      coverUrl: {
        type: String,
        default: null,
      },
    },
    contenu: {
      type: String,
      minlength: 0,
      maxlength: 5000,
    },
    note: {
      type: Number,
      required: true,
      min: 0.5,
      max: 5,
    },
    contientSpoiler: {
      type: Boolean,
      default: false,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Avis", avisSchema);
