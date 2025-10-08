// routes/mrv.js
const express = require("express");
const multer = require("multer");
const { uploadMRV , getMRVs } = require("../controllers/MRVController.js");

const router = express.Router();
const upload = multer(); // memory storage

router.post("/upload", upload.array("files"), uploadMRV);
router.get("/:projectId", getMRVs);

module.exports = router;
