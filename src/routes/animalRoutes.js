const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateUser);

/**
 * @route   POST /api/animals/recognize
 * @desc    Log animal recognition result
 * @access  Private (Traveler)
 */
router.post('/recognize', animalController.logRecognition);

/**
 * @route   GET /api/animals/history
 * @desc    Get user's recognition history
 * @access  Private (Traveler)
 */
router.get('/history', animalController.getRecognitionHistory);

/**
 * @route   GET /api/animals/stats
 * @desc    Get recognition statistics
 * @access  Private (Traveler)
 */
router.get('/stats', animalController.getRecognitionStats);

/**
 * @route   GET /api/animals/info/:animalName
 * @desc    Get detailed information about an animal
 * @access  Private (Traveler)
 */
router.get('/info/:animalName', animalController.getAnimalInfo);

/**
 * @route   DELETE /api/animals/:recognitionId
 * @desc    Delete recognition entry
 * @access  Private (Traveler)
 */
router.delete('/:recognitionId', animalController.deleteRecognition);

module.exports = router;
