const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// POST /api/chat - Send a message
router.post("/", chatController.sendMessage);

module.exports = router;
