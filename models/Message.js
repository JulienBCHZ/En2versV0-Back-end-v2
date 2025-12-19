const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderUsername: { type: String, required: true },
    text: { type: String, trim: true, maxlength: 2000 },
    image: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
