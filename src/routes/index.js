const express = require("express");
const router = express.Router();
const chatRoutes = require("./chatRoutes");
const healthRoutes = require("./healthRoutes");

// Mount routes
router.use("/chat", chatRoutes);
router.use("/health", healthRoutes);

module.exports = router;
