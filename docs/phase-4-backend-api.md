# Phase 4: Node.js Backend API Gateway

> **Goal**: Build the Express.js API gateway that handles authentication, file uploads, database operations, and communication with the Python inference service.

---

## Overview

This phase creates the Node.js backend that serves as the central API gateway:
- User authentication (JWT-based)
- Input validation and sanitization
- Image upload handling (Multer → S3/local storage)
- Communication with Python inference service
- PostgreSQL database for users and predictions

**Estimated Effort**: 3-4 days  
**Prerequisites**: Phase 3 completed (inference service running)  
**Port**: 5000

---

## 4.1 Project Setup

### 4.1.1 Initialize Backend Project

```bash
mkdir -p backend/src/{routes,controllers,middleware,models,utils,config}
cd backend
npm init -y
```

### 4.1.2 Install Dependencies

```bash
npm install express cors helmet dotenv jsonwebtoken bcryptjs \
  sequelize pg pg-hstore multer axios express-validator \
  express-rate-limit morgan uuid

npm install -D nodemon
```

### 4.1.3 Package.json Scripts

```json
{
  "name": "fake-news-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "db:migrate": "npx sequelize-cli db:migrate",
    "db:seed": "npx sequelize-cli db:seed:all"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "sequelize": "^6.35.0",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "multer": "^1.4.5-lts.1",
    "axios": "^1.6.0",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5",
    "morgan": "^1.10.0",
    "uuid": "^9.0.1"
  }
}
```

---

## 4.2 Environment Configuration

```bash
# backend/.env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fakenews
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fakenews
DB_USER=user
DB_PASSWORD=password

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# AWS S3 (optional - for production)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET=fake-news-images

# ML Service
ML_SERVICE_URL=http://localhost:8000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

---

## 4.3 Database Configuration

### 4.3.1 Sequelize Configuration

```javascript
// backend/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    underscored: true,  // Use snake_case for columns
    timestamps: true
  }
});

module.exports = sequelize;
```

### 4.3.2 User Model

```javascript
// backend/src/models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Instance method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hide password in JSON responses
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
```

### 4.3.3 Prediction Model

```javascript
// backend/src/models/Prediction.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prediction = sequelize.define('Prediction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  label: {
    type: DataTypes.ENUM('REAL', 'FAKE'),
    allowNull: false
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
      max: 1
    }
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  modality: {
    type: DataTypes.ENUM('text_only', 'multimodal'),
    allowNull: false,
    defaultValue: 'text_only'
  },
  feedback: {
    type: DataTypes.ENUM('correct', 'incorrect'),
    allowNull: true
  }
}, {
  tableName: 'predictions'
});

module.exports = Prediction;
```

### 4.3.4 Model Index

```javascript
// backend/src/models/index.js
const sequelize = require('../config/database');
const User = require('./User');
const Prediction = require('./Prediction');

// Define associations
User.hasMany(Prediction, { foreignKey: 'userId', as: 'predictions' });
Prediction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Prediction
};
```

---

## 4.4 Middleware

### 4.4.1 Authentication Middleware

```javascript
// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

// Admin-only middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
```

### 4.4.2 Upload Middleware

```javascript
// backend/src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

module.exports = upload;
```

### 4.4.3 Validation Middleware

```javascript
// backend/src/middleware/validate.js
const { body, validationResult } = require('express-validator');

// Validation rules for prediction
const validatePredict = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 1000 })
    .withMessage('Title must be less than 1000 characters'),
  
  body('body')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Body must be less than 10000 characters'),
];

// Validation rules for registration
const validateRegister = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be less than 100 characters'),
];

// Validation rules for login
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Validation rules for feedback
const validateFeedback = [
  body('feedback')
    .isIn(['correct', 'incorrect'])
    .withMessage('Feedback must be "correct" or "incorrect"'),
];

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

module.exports = {
  validatePredict,
  validateRegister,
  validateLogin,
  validateFeedback,
  handleValidationErrors
};
```

---

## 4.5 Utility Functions

### 4.5.1 Python Service Client

```javascript
// backend/src/utils/pythonClient.js
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const pythonClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 30000, // 30 second timeout for inference
  headers: {
    'Content-Type': 'application/json'
  }
});

// Health check
const checkMLServiceHealth = async () => {
  try {
    const response = await pythonClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('ML service health check failed:', error.message);
    throw new Error('ML service unavailable');
  }
};

// Run prediction
const predict = async (title, body = '', imageUrl = null) => {
  try {
    const response = await pythonClient.post('/predict', {
      title,
      body,
      image_url: imageUrl
    });
    return response.data;
  } catch (error) {
    console.error('ML prediction failed:', error.message);
    if (error.response) {
      throw new Error(error.response.data.detail || 'Prediction failed');
    }
    throw new Error('ML service unavailable');
  }
};

module.exports = {
  pythonClient,
  checkMLServiceHealth,
  predict
};
```

### 4.5.2 S3 Upload Helper (Optional)

```javascript
// backend/src/utils/s3.js
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Initialize S3 client (only if credentials are provided)
let s3Client = null;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
}

const uploadToS3 = async (file) => {
  if (!s3Client) {
    // Fallback to local storage
    return `/uploads/${file.filename}`;
  }

  const fileContent = fs.readFileSync(file.path);
  const key = `uploads/${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: file.mimetype
  }));

  // Delete local file after S3 upload
  fs.unlinkSync(file.path);

  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
};

const deleteFromS3 = async (url) => {
  if (!s3Client || !url.includes('s3.amazonaws.com')) {
    return; // Skip for local files
  }

  const key = url.split('.com/')[1];
  await s3Client.send(new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key
  }));
};

module.exports = { uploadToS3, deleteFromS3 };
```

### 4.5.3 JWT Helper

```javascript
// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
```

---

## 4.6 Controllers

### 4.6.1 Auth Controller

```javascript
// backend/src/controllers/authController.js
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({ email, password, name });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const getProfile = async (req, res) => {
  res.json({ user: req.user.toJSON() });
};

module.exports = { register, login, getProfile };
```

### 4.6.2 Predict Controller

```javascript
// backend/src/controllers/predictController.js
const { Prediction } = require('../models');
const { predict: mlPredict } = require('../utils/pythonClient');
const { uploadToS3 } = require('../utils/s3');

const predict = async (req, res) => {
  try {
    const { title, body } = req.body;
    const imageFile = req.file;

    // Upload image if provided
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadToS3(imageFile);
      
      // If local file, construct full URL
      if (imageUrl.startsWith('/uploads')) {
        imageUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;
      }
    }

    // Call Python inference service
    const result = await mlPredict(title, body || '', imageUrl);

    // Save prediction to database
    const prediction = await Prediction.create({
      userId: req.user.id,
      title,
      body,
      imageUrl,
      label: result.label,
      confidence: result.confidence,
      explanation: result.explanation,
      modality: result.modality
    });

    res.json({
      id: prediction.id,
      label: result.label,
      confidence: result.confidence,
      explanation: result.explanation,
      modality: result.modality,
      imageUrl
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ 
      error: 'Prediction failed', 
      details: error.message 
    });
  }
};

const getPrediction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prediction = await Prediction.findOne({
      where: { id, userId: req.user.id }
    });

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json(prediction);
  } catch (error) {
    console.error('Get prediction error:', error);
    res.status(500).json({ error: 'Failed to retrieve prediction' });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const prediction = await Prediction.findOne({
      where: { id, userId: req.user.id }
    });

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    prediction.feedback = feedback;
    await prediction.save();

    res.json({ 
      message: 'Feedback submitted successfully',
      prediction 
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

module.exports = { predict, getPrediction, submitFeedback };
```

### 4.6.3 History Controller

```javascript
// backend/src/controllers/historyController.js
const { Prediction } = require('../models');
const { Op } = require('sequelize');

const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, label, startDate, endDate } = req.query;

    // Build where clause
    const where = { userId: req.user.id };
    
    if (label) {
      where.label = label.toUpperCase();
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Fetch predictions with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows: predictions } = await Prediction.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      predictions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total predictions
    const total = await Prediction.count({ where: { userId } });
    
    // By label
    const byLabel = await Prediction.findAll({
      where: { userId },
      attributes: [
        'label',
        [sequelize.fn('COUNT', sequelize.col('label')), 'count']
      ],
      group: ['label']
    });

    // Average confidence
    const avgConfidence = await Prediction.findOne({
      where: { userId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('confidence')), 'avgConfidence']
      ]
    });

    // Feedback stats
    const feedbackStats = await Prediction.findAll({
      where: { userId, feedback: { [Op.ne]: null } },
      attributes: [
        'feedback',
        [sequelize.fn('COUNT', sequelize.col('feedback')), 'count']
      ],
      group: ['feedback']
    });

    res.json({
      total,
      byLabel: byLabel.reduce((acc, item) => {
        acc[item.label] = parseInt(item.getDataValue('count'));
        return acc;
      }, {}),
      avgConfidence: parseFloat(avgConfidence?.getDataValue('avgConfidence') || 0),
      feedback: feedbackStats.reduce((acc, item) => {
        acc[item.feedback] = parseInt(item.getDataValue('count'));
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = { getHistory, getStats };
```

---

## 4.7 Routes

### 4.7.1 Auth Routes

```javascript
// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validate');

router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
```

### 4.7.2 Predict Routes

```javascript
// backend/src/routes/predict.js
const express = require('express');
const router = express.Router();
const { predict, getPrediction, submitFeedback } = require('../controllers/predictController');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validatePredict, validateFeedback, handleValidationErrors } = require('../middleware/validate');

router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  validatePredict,
  handleValidationErrors,
  predict
);

router.get('/:id', authMiddleware, getPrediction);

router.post(
  '/:id/feedback',
  authMiddleware,
  validateFeedback,
  handleValidationErrors,
  submitFeedback
);

module.exports = router;
```

### 4.7.3 History Routes

```javascript
// backend/src/routes/history.js
const express = require('express');
const router = express.Router();
const { getHistory, getStats } = require('../controllers/historyController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, getHistory);
router.get('/stats', authMiddleware, getStats);

module.exports = router;
```

---

## 4.8 Main Server File

```javascript
// backend/src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const { checkMLServiceHealth } = require('./utils/pythonClient');

// Import routes
const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const historyRoutes = require('./routes/history');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});

const predictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 predictions per 15 minutes
  message: { error: 'Too many predictions, please try again later.' }
});

app.use('/api', limiter);
app.use('/api/predict', predictLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const mlHealth = await checkMLServiceHealth();
    res.json({
      status: 'ok',
      database: 'connected',
      mlService: mlHealth
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      database: 'connected',
      mlService: 'unavailable'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database synced');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

---

## 4.9 Running the Backend

### 4.9.1 Database Setup

```bash
# Create PostgreSQL database
createdb fakenews

# Or using psql
psql -U postgres -c "CREATE DATABASE fakenews;"
```

### 4.9.2 Start Server

```bash
cd backend
npm install
npm run dev
```

### 4.9.3 Test Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Predict (with token from login)
curl -X POST http://localhost:5000/api/predict \
  -H "Authorization: Bearer <token>" \
  -F "title=Breaking news headline" \
  -F "body=Article body text"

# Predict with image
curl -X POST http://localhost:5000/api/predict \
  -H "Authorization: Bearer <token>" \
  -F "title=Breaking news" \
  -F "image=@/path/to/image.jpg"
```

---

## 4.10 Deliverables Checklist

After completing Phase 4, you should have:

- [ ] Backend project structure created
- [ ] All dependencies installed
- [ ] Database models: User, Prediction
- [ ] Middleware: auth, upload, validation
- [ ] Controllers: auth, predict, history
- [ ] Routes: /api/auth, /api/predict, /api/history
- [ ] Server running on port 5000
- [ ] All endpoints tested and working:
  - `POST /api/auth/register` ✓
  - `POST /api/auth/login` ✓
  - `GET /api/auth/profile` ✓
  - `POST /api/predict` ✓
  - `GET /api/predict/:id` ✓
  - `POST /api/predict/:id/feedback` ✓
  - `GET /api/history` ✓
  - `GET /api/history/stats` ✓
  - `GET /api/health` ✓

---

## Next Phase

Once the backend API is working, proceed to **Phase 5: Next.js Frontend**.
