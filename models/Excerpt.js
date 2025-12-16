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
      default: "Unknown author",
    },
    coverUrl: {
      type: String,
      default: null,
    },
  },
  { _id: false } // no _id needed for this sub-document
);

const ExcerptSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: bookSchema, // use the sub-schema
      required: true,
    },
    content: {
      type: String,
      minlength: 0,
      maxlength: 5000,
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

module.exports = mongoose.model("Excerpt", ExcerptSchema);
