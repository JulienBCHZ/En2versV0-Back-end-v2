const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const isAuthenticated = require("../middleware/isAuthenticated");
const isPermitted = require("../middleware/isPermitted"); // TO CHECK IF THE USER IS THE GOOD ONE TO ACCESS TO PERSONNAL PAGES
const User = require("../models/User");
const convertToBase64 = require("../utils/convertToBase64");

// READ USER INFO
router.get(
  "/user/profile/:id",
  isAuthenticated,
  isPermitted,
  async (req, res) => {
    const { id } = req.params;
    // const authUserToken = req.user.token;
    //   console.log("USER", getUser);

    try {
      const getUserProfile = await User.findById(id).select(
        "-salt -hash -token"
      );
      if (!getUserProfile)
        return res.status(400).json({ message: "User not found !" });

      // CHECK IF CONNECTED USER IS THE GOOD ONE
      // if (getUserProfile.token !== authUserToken)
      //   return res.status(401).json({ message: "Unauthorized !" });

      res.status(201).json({ user: getUserProfile });
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong...",
        errorMessage: error.message,
      });
    }
  }
);

// UPDATE USER INFO
router.put("/user/:id", isAuthenticated, isPermitted, async (req, res) => {
  const {
    fullname,
    email,
    firstBookTitle,
    firstBookAuthor,
    secondBookTitle,
    secondBookAuthor,
    firstStyle,
    secondStyle,
    thirdStyle,
    birth,
    genre,
    country,
    city,
    description,
  } = req.body;
  const { id } = req.params;
  // const authUserToken = req.user.token;

  try {
    // FIND USER BY USER ID
    const userUpdate = await User.findById(id).select("-salt -hash");
    if (!userUpdate)
      return res.status(400).json({ message: "User not found !" });

    // CHECK IF CONNECTED USER IS THE GOOD ONE
    // if (userUpdate.token !== authUserToken)
    //   return res.status(401).json({ message: "Unauthorized !" });

    // UPDATE USER INFO
    if (fullname) userUpdate.fullname = fullname;

    if (email) userUpdate.email = email;

    if (firstBookTitle) userUpdate.favBooks.firstBook.title = firstBookTitle;

    if (firstBookTitle) userUpdate.favBooks.firstBook.title = firstBookTitle;

    if (secondBookTitle) userUpdate.favBooks.secondBook.title = firstBookTitle;

    if (firstBookAuthor)
      userUpdate.favBooks.firstBook.author_name = firstBookAuthor;

    if (secondBookAuthor)
      userUpdate.favBooks.secondBook.author_name = secondBookAuthor;

    if (firstStyle) userUpdate.style.firstStyle = firstStyle;

    if (secondStyle) userUpdate.style.secondStyle = secondStyle;

    if (thirdStyle) userUpdate.style.thirdStyle = thirdStyle;

    if (birth) userUpdate.birth = birth;

    if (genre) userUpdate.genre = genre;

    if (country) userUpdate.country = genre;

    if (city) userUpdate.city = city;

    if (description) userUpdate.description = description;

    await userUpdate.save();

    res.status(201).json({
      message: "User successfully updated.",
      user: userUpdate,
    });
  } catch (error) {
    res.status(500).json({
      message: "User hasn't been updated...",
      errorMessage: error.message,
    });
  }
});

// USER AVATAR UPLOAD
router.put(
  "/user/avatar/:id",
  isAuthenticated,
  isPermitted,
  fileUpload(),
  async (req, res) => {
    const { id } = req.params;
    // const authUserToken = req.user.token;
    try {
      // FIND USER BY USER ID
      const userAvatarUpload = await User.findById(id).select("-salt -hash");
      if (!userAvatarUpload)
        return res.status(400).json({ message: "User not found !" });

      // CHECK IF CONNECTED USER IS THE GOOD ONE
      // if (userAvatarUpload.token !== authUserToken)
      //   return res.status(401).json({ message: "Unauthorized !" });

      // GET AVATAR & UPLOAD ON CLOUDINARY
      if (req.files) {
        const fileToString = convertToBase64(req.files.image);
        const cloudinaryResponse = await cloudinary.uploader.upload(
          fileToString,
          { asset_folder: `/${userAvatarUpload.account.username}/avatar` }
        );
        // UPDATE AVATAR ON USER ACCOUNT
        if (cloudinaryResponse)
          userAvatarUpload.account.avatar = cloudinaryResponse;
      } else {
        return res.status(406).json({ message: "Please upload an image !" });
      }

      await userAvatarUpload.save();

      res.status(201).json({
        message: "Avatar has been updated !",
        user: {
          account: {
            username: userAvatarUpload.account.username,
            avatar: userAvatarUpload.account.avatar,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Avatar hasn't been updated...",
        errorMessage: error.message,
      });
    }
  }
);

// UPDATE USER PASSWORD
router.put(
  "/user/password/:id",
  isAuthenticated,
  isPermitted,
  async (req, res) => {
    const { password, newPassword } = req.body;
    const { id } = req.params;
    if (newPassword < 6)
      return res.json({ message: "New password is too short !" });

    try {
      const getUserToUpdate = await User.findById(id);
      if (!getUserToUpdate)
        return res.status(400).json({ message: "User not found !" });

      const passwordSalt = password + getUserToUpdate.salt;
      const hashUpdate = SHA256(passwordSalt).toString(encBase64);

      if (hashUpdate === getUserToUpdate.hash) {
        // Encryption new password
        const newSalt = uid2(16);

        const newPasswordSalt = newPassword + newSalt;

        const newHash = SHA256(newPasswordSalt).toString(encBase64);

        // Update in User password

        getUserToUpdate.salt = newSalt;
        getUserToUpdate.hash = newHash;

        await getUserToUpdate.save();

        return res.status(201).json({ message: "Password updated !" });
      } else {
        return res.status(401).json({ message: "Check passwords !" });
      }
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong...",
        errorMessage: error.message,
      });
    }
  }
);

// READ USER BY USERNAME
router.get("/user", isAuthenticated, async (req, res) => {
  try {
    const { username, page, skip, limit } = req.query;

    if (!username) {
      return res.json({ message: "A username is required !" });
    }

    let getSkip = skip || 0;
    let getLimit = limit || 10;
    if (page) getSkip = getLimit * page - 10;

    const search = new RegExp(username, "i");

    const getUser = await User.find({
      "account.username": search,
    })
      .select("-salt -hash -token -fullname -email")
      .limit(getLimit)
      .skip(getSkip);

    res.status(201).json({ user: getUser });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong...",
      errorMessage: error.message,
    });
  }
});

// READ USER BY ID
router.get("/user/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    const getUserById = await User.findById(id).select(
      "-salt -hash -token -fullname -email"
    );
    if (!getUserById)
      return res.status(400).json({ message: "User not found !" });

    res.status(201).json({ user: getUserById });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong...",
      errorMessage: error.message,
    });
  }
});

// DELETE USER FROM DATABASE
router.delete("/user/:id", isAuthenticated, isPermitted, async (req, res) => {
  const { id } = req.params;
  // const authUserToken = req.user.token;
  // console.log("TOKEN", authUserToken);

  try {
    const getUser = await User.findById(id).select("-salt -hash");
    if (!getUser) return res.status(400).json({ message: "User not found !" });

    // CHECK IF CONNECTED USER IS THE GOOD ONE
    // if (getUser.token !== authUserToken)
    //   return res.status(401).json({ message: "Unauthorized !" });

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "User has been deleted !" });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong...",
      errorMessage: error.message,
    });
  }
});

module.exports = router;
