import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT = 30000; // 30 seconds

// Create axios instance for ML service
const mlClient = axios.create({
    baseURL: ML_SERVICE_URL,
    timeout: ML_TIMEOUT,
    headers: {
        'User-Agent': 'FakeNewsBackend/1.0'
    }
});

/**
 * Check ML service health
 * @returns {Promise<Object>} Health check response
 */
export const checkMLServiceHealth = async () => {
    try {
        const response = await mlClient.get('/health');
        return response.data;
    } catch (error) {
        throw new Error(`ML service health check failed: ${error.message}`);
    }
};

/**
 * Make prediction using ML service
 * @param {FormData} formData - Form data with title, body, and optional image
 * @returns {Promise<Object>} Prediction response
 */
export const predict = async (formData) => {
    try {
        const response = await mlClient.post('/predict', formData, {
            headers: formData.getHeaders ? formData.getHeaders() : {}
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            // ML service returned an error
            const status = error.response.status;
            const message = error.response.data?.detail || error.response.data?.message || 'Prediction failed';
            throw new Error(`ML service error (${status}): ${message}`);
        } else if (error.code === 'ECONNREFUSED') {
            throw new Error('ML service is unavailable. Please ensure it is running.');
        } else if (error.code === 'ETIMEDOUT') {
            throw new Error('ML service request timed out. Please try again.');
        } else {
            throw new Error(`Failed to communicate with ML service: ${error.message}`);
        }
    }
};

export default {
    checkMLServiceHealth,
    predict
};
