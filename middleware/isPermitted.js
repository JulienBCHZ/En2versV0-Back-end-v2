const User = require("../models/User");

const isPermitted = async (req, res, next) => {
  const { id } = req.params;
  const authUserToken = req.user.token;

  try {
    const getUser = await User.findById(id).select("-salt -hash");
    if (!getUser) return res.status(400).json({ message: "User not found" });
    if (authUserToken !== getUser.token)
      return res.status(401).json({ message: "Unauthorized" });

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isPermitted;
