const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { authenticateUser } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/journals/public
 * @desc    Get public journal entries
 * @access  Public
 */
router.get('/public', journalController.getPublicJournals);

// Protected routes (require authentication)
router.use(authenticateUser);

/**
 * @route   POST /api/journals
 * @desc    Create a travel journal entry
 * @access  Private (Traveler)
 */
router.post('/', journalController.createJournal);

/**
 * @route   GET /api/journals/my-journals
 * @desc    Get my journal entries
 * @access  Private (Traveler)
 */
router.get('/my-journals', journalController.getMyJournals);

/**
 * @route   GET /api/journals/:journalId
 * @desc    Get journal by ID
 * @access  Private
 */
router.get('/:journalId', journalController.getJournalById);

/**
 * @route   PATCH /api/journals/:journalId
 * @desc    Update a journal entry
 * @access  Private (Traveler)
 */
router.patch('/:journalId', journalController.updateJournal);

/**
 * @route   DELETE /api/journals/:journalId
 * @desc    Delete a journal entry
 * @access  Private (Traveler)
 */
router.delete('/:journalId', journalController.deleteJournal);

module.exports = router;
