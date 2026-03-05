const express = require("express");
const router = express.Router();
const misController = require("../controllers/misController");

// User Growth Report
router.get("/user-growth", misController.getUserGrowthReport);

module.exports = router;
