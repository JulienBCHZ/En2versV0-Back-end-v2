const mongoose = require("mongoose");

// Définir le sous-schéma pour le livre
const bookSchema = new mongoose.Schema(
  {
    bookKey: {
      type: String,
      required: true,
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
  { _id: false } // Pas besoin d'un _id pour ce sous-document
);

// Schéma des avis
const reviewsSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: bookSchema, 
      required: true,
    },
    content: {
      type: String,
      minlength: 0,
      maxlength: 2000,
    },
    rating: { 
      type: Number,
      required: true,
      min: 0.5,
      max: 5,
      validate: {
        validator: (v) => v % 0.5 === 0,
        message: "The rating must be a multiple of 0.5",
      },
    },
    containsSpoiler: {
      type: Boolean,
      default: false,
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Empêcher un utilisateur de poster deux fois un avis pour le même livre
reviewsSchema.index(
  { author: 1, "book.bookKey": 1 },
  { unique: true }
);

module.exports = mongoose.model("Review", reviewsSchema);
