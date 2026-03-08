const express = require("express");
const {
  registerReader,
  loginReader,
  getReaderProfile
} = require("../controllers/readerController");
const authReader = require("../middleware/authReader");

const router = express.Router();

router.post("/register", registerReader);
router.post("/login", loginReader);
router.get("/profile", authReader, getReaderProfile);

router.get("/test", (req, res) => {
  res.json({ message: "Readers route working ✅" });
});

module.exports = router;