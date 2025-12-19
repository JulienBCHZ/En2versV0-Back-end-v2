const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    fromUsername: { type: String, required: true, index: true },
    toUsername: { type: String, required: true, index: true },
    text: { type: String, trim: true, maxlength: 2000, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);