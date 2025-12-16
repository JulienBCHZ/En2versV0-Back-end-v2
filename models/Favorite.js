const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
      default: "Unknown author",
    },
    firstPublishYear: {
      type: Number,
      default: null,
    },
    coverId: {
      type: Number,
      default: null,
    },
    coverUrl: {
      type: String,
      default: null,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ user: 1, bookKey: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
