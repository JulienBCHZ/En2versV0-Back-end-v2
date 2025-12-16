const mongoose = require("mongoose");

// Define the sub-schema for the book
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
  { _id: false } // no _id needed for this sub-document
);

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

reviewsSchema.index({ author: 1, "book.bookKey": 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewsSchema);
