const express = require("express");
const router = express.Router();
const journalController = require("../controllers/journalController");
const { authenticateUser } = require("../middleware/authMiddleware");

// All journal routes require authentication
router.use(authenticateUser);

/* ============================
   JOURNAL ROUTES
============================ */

/**
 * @route   POST /api/journals
 * @desc    Create journal
 */
router.post("/", journalController.createJournal);

/**
 * @route   GET /api/journals/my
 * @desc    Get my journals (restore sync)
 */
router.get("/my", journalController.getMyJournals);

/**
 * @route   PATCH /api/journals/:journalId
 * @desc    Update journal
 */
router.patch("/:journalId", journalController.updateJournal);

/**
 * @route   PATCH /api/journals/:journalId/delete
 * @desc    Soft delete journal
 */
router.patch("/:journalId/delete", journalController.deleteJournal);

/* ============================
   JOURNAL ENTRY ROUTES
============================ */

/**
 * @route   POST /api/journals/:journalId/entries
 * @desc    Add entry
 */
router.post("/:journalId/entries", journalController.addJournalEntry);

/**
 * @route   PATCH /api/journals/entries/:entryId
 * @desc    Update entry
 */
router.patch("/entries/:entryId", journalController.updateJournalEntry);

/**
 * @route   PATCH /api/journals/entries/:entryId/delete
 * @desc    Soft delete entry
 */
router.patch("/entries/:entryId/delete", journalController.deleteJournalEntry);

module.exports = router;
