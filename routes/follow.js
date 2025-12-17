const express = require("express");
const router = express.Router();
const Follow = require("../models/Follow");
const User = require("../models/User");
const authMiddleware = require("../middleware/isAuthenticated");

router.use(authMiddleware);

// POST - Toggle Follow
router.post("/:userId/toggle-follow", async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas vous follow vous-même",
      });
    }

    const userToFollow = await User.findById(followingId);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });

    let isFollowing;

    if (existingFollow) {
      await Follow.findByIdAndDelete(existingFollow._id);
      isFollowing = false;
    } else {
      await Follow.create({
        follower: followerId,
        following: followingId,
      });
      isFollowing = true;
    }

    const followersCount = await Follow.countDocuments({
      following: followingId,
    });
    const followingCount = await Follow.countDocuments({
      follower: followingId,
    });

    res.status(200).json({
      success: true,
      data: { isFollowing, followersCount, followingCount },
    });
  } catch (error) {
    console.error("Erreur toggleFollow:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET - Ceux que je suis
router.get("/me/following", async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const following = await Follow.find({ follower: userId })
      .populate("following", "username avatar bio")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ follower: userId });

    res.status(200).json({
      success: true,
      data: following.map((f) => f.following),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur getMyFollowing:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET - Ceux qui me suivent
router.get("/me/followers", async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const followers = await Follow.find({ following: userId })
      .populate("follower", "username avatar bio")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ following: userId });

    res.status(200).json({
      success: true,
      data: followers.map((f) => f.follower),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur getMyFollowers:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET - Followers d'un utilisateur
router.get("/:userId/followers", async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const followers = await Follow.find({ following: userId })
      .populate("follower", "username avatar bio")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ following: userId });

    const myFollowing = await Follow.find({ follower: currentUserId }).select(
      "following"
    );
    const myFollowingIds = myFollowing.map((f) => f.following.toString());

    const data = followers.map((f) => ({
      ...f.follower.toObject(),
      isFollowedByMe: myFollowingIds.includes(f.follower._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur getUserFollowers:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET - Followings d'un utilisateur
router.get("/:userId/following", async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const following = await Follow.find({ follower: userId })
      .populate("following", "username avatar bio")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ follower: userId });

    const myFollowing = await Follow.find({ follower: currentUserId }).select(
      "following"
    );
    const myFollowingIds = myFollowing.map((f) => f.following.toString());

    const data = following.map((f) => ({
      ...f.following.toObject(),
      isFollowedByMe: myFollowingIds.includes(f.following._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur getUserFollowing:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

module.exports = router;
