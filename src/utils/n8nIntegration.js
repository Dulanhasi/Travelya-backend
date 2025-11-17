const axios = require('axios');

/**
 * Send trip planning request to n8n workflow
 * @param {Object} tripData - Trip planning parameters
 * @returns {Promise<Object>} - Generated itinerary from n8n
 */
const generateItineraryViaN8N = async (tripData) => {
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        
        if (!webhookUrl) {
            throw new Error('N8N_WEBHOOK_URL not configured');
        }

        console.log('📤 Sending trip data to n8n:', tripData);

        const response = await axios.post(webhookUrl, tripData, {
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.N8N_API_KEY && {
                    'Authorization': `Bearer ${process.env.N8N_API_KEY}`
                })
            },
            timeout: 60000 // 60 seconds timeout
        });

        console.log('📥 Received itinerary from n8n');

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('❌ n8n integration error:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Cannot connect to n8n. Make sure n8n is running.');
        }
        
        if (error.response) {
            throw new Error(`n8n returned error: ${error.response.data?.message || error.response.statusText}`);
        }
        
        throw new Error(`Failed to generate itinerary: ${error.message}`);
    }
};

/**
 * Validate trip data before sending to n8n
 * @param {Object} tripData 
 * @returns {Object} - Validated and formatted trip data
 */
const validateTripData = (tripData) => {
    const required = ['destination', 'startDate', 'endDate', 'budget', 'preferences'];
    
    for (const field of required) {
        if (!tripData[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    // Format for n8n
    return {
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        budget: parseFloat(tripData.budget),
        numberOfTravelers: parseInt(tripData.numberOfTravelers) || 1,
        preferences: tripData.preferences, // Array of preferences
        activities: tripData.activities || [],
        accommodation: tripData.accommodation || 'any',
        transport: tripData.transport || 'any'
    };
};

/**
 * Enhanced version with retry logic
 */
const generateItineraryWithRetry = async (tripData, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const validatedData = validateTripData(tripData);
            return await generateItineraryViaN8N(validatedData);
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
    
    throw lastError;
};

module.exports = {
    generateItineraryViaN8N,
    validateTripData,
    generateItineraryWithRetry
};
