import { body, validationResult } from 'express-validator';

/**
 * Validate prediction request
 */
export const validatePredict = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 5, max: 1000 }).withMessage('Title must be 5-1000 characters'),
    
    body('body')
        .optional()
        .isLength({ max: 10000 }).withMessage('Body must not exceed 10000 characters')
];

/**
 * Validate user registration
 */
export const validateRegister = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/\d/).withMessage('Password must contain at least one number'),
    
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    
    body('role')
        .optional()
        .isIn(['user', 'admin']).withMessage('Role must be user or admin')
];

/**
 * Validate login request
 */
export const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address'),
    
    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * Validate feedback submission
 */
export const validateFeedback = [
    body('feedback')
        .notEmpty().withMessage('Feedback is required')
        .isIn(['correct', 'incorrect']).withMessage('Feedback must be "correct" or "incorrect"')
];

/**
 * Handle validation errors middleware
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    
    next();
};
