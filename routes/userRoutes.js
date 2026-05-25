const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  setUserTracks,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect,allUsers);
router.route("/").post(registerUser);
router.post("/login", authUser);
router.put("/tracks", protect, setUserTracks);

module.exports = router;