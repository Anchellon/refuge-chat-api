const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// POST /api/chat - Send a message
router.post("/", chatController.sendMessage);

// GET /api/chat/health - Check Ollama health
router.get("/health", chatController.healthCheck);

// GET /api/chat/models - List available models
router.get("/models", chatController.listModels);

module.exports = router;
