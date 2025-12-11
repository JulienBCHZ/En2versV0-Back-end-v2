const mongoose = require("mongoose");

const courrierSchema = new mongoose.Schema(
  {
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "The author is required."],
    },
    contenu: {
      type: String,
      required: [true, "The content is required."],
    },
  },
  {
    timestamps: true,
  }
);

const Courrier = mongoose.model("Courrier", courrierSchema);

module.exports = Courrier;
