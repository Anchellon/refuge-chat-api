const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");

// GET /api/health - Check all services
router.get("/", healthController.healthCheck);

// GET /api/health/models - List available Ollama models
router.get("/models", healthController.listModels);

module.exports = router;
