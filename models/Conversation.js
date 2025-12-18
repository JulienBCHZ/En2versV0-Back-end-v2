const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    members: { type: [String], required: true }, // usernames
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Pour éviter les doublons (même paire)
conversationSchema.index({ members: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
