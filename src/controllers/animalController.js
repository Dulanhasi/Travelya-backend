const db = require('../config/database');

/**
 * Log animal recognition result
 * POST /api/animals/recognize
 */
exports.logRecognition = async (req, res, next) => {
    try {
        const { animalName, confidence, imageUrl, locationLat, locationLng } = req.body;
        const userId = req.user.uid;

        // Get travelerId
        const [travelers] = await db.query(
            'SELECT travelerId FROM travelers WHERE userId = (SELECT userId FROM users WHERE firebaseUid = ?)',
            [userId]
        );

        if (travelers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Traveler profile not found'
            });
        }

        const travelerId = travelers[0].travelerId;

        // Insert recognition log
        const [result] = await db.query(
            `INSERT INTO animal_recognitions 
            (travelerId, animalName, confidence, imageUrl, locationLat, locationLng) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [travelerId, animalName, confidence, imageUrl, locationLat, locationLng]
        );

        res.status(201).json({
            success: true,
            message: 'Animal recognition logged successfully',
            data: {
                recognitionId: result.insertId,
                animalName,
                confidence
            }
        });
    } catch (error) {
        console.error('Log recognition error:', error);
        next(error);
    }
};

/**
 * Get user's recognition history
 * GET /api/animals/history
 */
exports.getRecognitionHistory = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const limit = parseInt(req.query.limit) || 50;

        const [recognitions] = await db.query(
            `SELECT 
                ar.recognitionId,
                ar.animalName,
                ar.confidence,
                ar.imageUrl,
                ar.locationLat,
                ar.locationLng,
                ar.recognizedAt
            FROM animal_recognitions ar
            JOIN travelers t ON ar.travelerId = t.travelerId
            JOIN users u ON t.userId = u.userId
            WHERE u.firebaseUid = ?
            ORDER BY ar.recognizedAt DESC
            LIMIT ?`,
            [userId, limit]
        );

        res.json({
            success: true,
            data: recognitions
        });
    } catch (error) {
        console.error('Get recognition history error:', error);
        next(error);
    }
};

/**
 * Get recognition statistics
 * GET /api/animals/stats
 */
exports.getRecognitionStats = async (req, res, next) => {
    try {
        const userId = req.user.uid;

        const [stats] = await db.query(
            `SELECT 
                COUNT(*) as totalRecognitions,
                COUNT(DISTINCT animalName) as uniqueAnimals,
                AVG(confidence) as avgConfidence
            FROM animal_recognitions ar
            JOIN travelers t ON ar.travelerId = t.travelerId
            JOIN users u ON t.userId = u.userId
            WHERE u.firebaseUid = ?`,
            [userId]
        );

        const [topAnimals] = await db.query(
            `SELECT 
                animalName,
                COUNT(*) as count
            FROM animal_recognitions ar
            JOIN travelers t ON ar.travelerId = t.travelerId
            JOIN users u ON t.userId = u.userId
            WHERE u.firebaseUid = ?
            GROUP BY animalName
            ORDER BY count DESC
            LIMIT 5`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                summary: stats[0],
                topAnimals
            }
        });
    } catch (error) {
        console.error('Get recognition stats error:', error);
        next(error);
    }
};

/**
 * Delete recognition entry
 * DELETE /api/animals/:recognitionId
 */
exports.deleteRecognition = async (req, res, next) => {
    try {
        const { recognitionId } = req.params;
        const userId = req.user.uid;

        const [result] = await db.query(
            `DELETE ar FROM animal_recognitions ar
            JOIN travelers t ON ar.travelerId = t.travelerId
            JOIN users u ON t.userId = u.userId
            WHERE ar.recognitionId = ? AND u.firebaseUid = ?`,
            [recognitionId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recognition not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'Recognition deleted successfully'
        });
    } catch (error) {
        console.error('Delete recognition error:', error);
        next(error);
    }
};

/**
 * Get animal information (from predefined database or API)
 * GET /api/animals/info/:animalName
 */
exports.getAnimalInfo = async (req, res, next) => {
    try {
        const { animalName } = req.params;

        // This is a placeholder - you can expand this with a proper animal database
        // or integrate with an external API for animal information
        const animalDatabase = {
            'elephant': {
                scientificName: 'Elephas maximus',
                habitat: 'Forests and grasslands',
                conservation: 'Endangered',
                description: 'Asian elephants are found in Sri Lankan national parks',
                diet: 'Herbivore',
                lifespan: '60-70 years',
                funFact: 'Sri Lankan elephants are one of three recognized subspecies of Asian elephants'
            },
            'leopard': {
                scientificName: 'Panthera pardus kotiya',
                habitat: 'Dry forests and scrublands',
                conservation: 'Endangered',
                description: 'Sri Lankan leopard is a subspecies native to Sri Lanka',
                diet: 'Carnivore',
                lifespan: '12-17 years',
                funFact: 'Sri Lanka has the highest leopard density in the world'
            },
            'peacock': {
                scientificName: 'Pavo cristatus',
                habitat: 'Forests and cultivated areas',
                conservation: 'Least Concern',
                description: 'Indian Peafowl commonly found in Sri Lanka',
                diet: 'Omnivore',
                lifespan: '15-20 years',
                funFact: 'Male peacocks display their magnificent tail feathers to attract females'
            }
            // Add more animals as needed
        };

        const animalInfo = animalDatabase[animalName.toLowerCase()];

        if (!animalInfo) {
            return res.json({
                success: true,
                data: {
                    name: animalName,
                    message: 'Detailed information not available for this animal',
                    basicInfo: 'This animal was successfully recognized. More details coming soon!'
                }
            });
        }

        res.json({
            success: true,
            data: {
                name: animalName,
                ...animalInfo
            }
        });
    } catch (error) {
        console.error('Get animal info error:', error);
        next(error);
    }
};
