const express = require("express");
const router = express.Router();
const chatRoutes = require("./chatRoutes");

// Mount routes
router.use("/chat", chatRoutes);

module.exports = router;
