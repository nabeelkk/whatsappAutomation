const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware to handle errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Auth validators
 */
const authValidators = {
  register: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
    validate
  ],

  login: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    validate
  ]
};

/**
 * Contact validators
 */
const contactValidators = {
  create: [
    body('phoneNumber')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format (E.164)'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    
    validate
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid contact ID'),
    
    body('phoneNumber')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    validate
  ],

  bulkAction: [
    body('action')
      .notEmpty()
      .withMessage('Action is required')
      .isIn(['addTags', 'removeTags', 'delete', 'optOut', 'optIn'])
      .withMessage('Invalid action'),
    
    body('contactIds')
      .isArray({ min: 1 })
      .withMessage('Contact IDs must be a non-empty array'),
    
    body('contactIds.*')
      .isMongoId()
      .withMessage('Invalid contact ID'),
    
    validate
  ]
};

/**
 * Message validators
 */
const messageValidators = {
  send: [
    body('contactId')
      .notEmpty()
      .withMessage('Contact ID is required')
      .isMongoId()
      .withMessage('Invalid contact ID'),
    
    body('whatsappNumberId')
      .notEmpty()
      .withMessage('WhatsApp number ID is required')
      .isMongoId()
      .withMessage('Invalid WhatsApp number ID'),
    
    body('type')
      .notEmpty()
      .withMessage('Message type is required')
      .isIn(['text', 'image', 'video', 'audio', 'document', 'button', 'list', 'template', 'carousel'])
      .withMessage('Invalid message type'),
    
    body('content')
      .notEmpty()
      .withMessage('Message content is required')
      .isObject()
      .withMessage('Content must be an object'),
    
    validate
  ],

  bulkSend: [
    body('contactIds')
      .isArray({ min: 1 })
      .withMessage('Contact IDs must be a non-empty array'),
    
    body('contactIds.*')
      .isMongoId()
      .withMessage('Invalid contact ID'),
    
    body('whatsappNumberId')
      .notEmpty()
      .withMessage('WhatsApp number ID is required')
      .isMongoId()
      .withMessage('Invalid WhatsApp number ID'),
    
    body('type')
      .notEmpty()
      .withMessage('Message type is required')
      .isIn(['text', 'image', 'video', 'audio', 'document', 'button', 'list', 'template'])
      .withMessage('Invalid message type'),
    
    body('content')
      .notEmpty()
      .withMessage('Message content is required'),
    
    validate
  ]
};

/**
 * Template validators
 */
const templateValidators = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Template name is required')
      .matches(/^[a-z0-9_]+$/)
      .withMessage('Template name must be lowercase alphanumeric with underscores'),
    
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['MARKETING', 'UTILITY', 'AUTHENTICATION'])
      .withMessage('Invalid category'),
    
    body('language')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('Language must be 2-letter code'),
    
    body('components')
      .isArray({ min: 1 })
      .withMessage('Components must be a non-empty array'),
    
    validate
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid template ID'),
    
    validate
  ]
};

/**
 * Campaign validators
 */
const campaignValidators = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Campaign name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Campaign name must be between 3 and 100 characters'),
    
    body('type')
      .notEmpty()
      .withMessage('Campaign type is required')
      .isIn(['immediate', 'scheduled', 'recurring'])
      .withMessage('Invalid campaign type'),
    
    body('whatsappNumberId')
      .notEmpty()
      .withMessage('WhatsApp number ID is required')
      .isMongoId()
      .withMessage('Invalid WhatsApp number ID'),
    
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isObject()
      .withMessage('Message must be an object'),
    
    body('message.type')
      .notEmpty()
      .withMessage('Message type is required')
      .isIn(['text', 'template', 'button', 'list', 'media'])
      .withMessage('Invalid message type'),
    
    body('filters')
      .optional()
      .isObject()
      .withMessage('Filters must be an object'),
    
    validate
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid campaign ID'),
    
    validate
  ]
};

/**
 * Chatbot validators
 */
const chatbotValidators = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Chatbot name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Chatbot name must be between 3 and 100 characters'),
    
    body('triggerKeywords')
      .isArray({ min: 1 })
      .withMessage('Trigger keywords must be a non-empty array'),
    
    body('flows')
      .isArray({ min: 1 })
      .withMessage('Flows must be a non-empty array'),
    
    validate
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid chatbot ID'),
    
    validate
  ]
};

/**
 * WhatsApp number validators
 */
const whatsappNumberValidators = {
  create: [
    body('phoneNumber')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    
    body('phoneNumberId')
      .trim()
      .notEmpty()
      .withMessage('Phone number ID is required'),
    
    body('accessToken')
      .trim()
      .notEmpty()
      .withMessage('Access token is required')
      .isLength({ min: 10 })
      .withMessage('Access token is too short'),
    
    body('displayName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Display name must be between 1 and 100 characters'),
    
    validate
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid WhatsApp number ID'),
    
    validate
  ]
};

/**
 * Query validators
 */
const queryValidators = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    validate
  ],

  search: [
    query('search')
      .optional({checkFalsy: true})
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
    
    validate
  ],

  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    
    validate
  ]
};

/**
 * MongoDB ID validator
 */
const mongoIdValidator = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  
  validate
];

/**
 * Custom sanitizers
 */
const sanitizers = {
  phoneNumber: (value) => {
    return value.replace(/\D/g, '').replace(/^(?!\+)/, '+');
  },

  slug: (value) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  tags: (value) => {
    if (typeof value === 'string') {
      return value.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    return value;
  }
};

module.exports = {
  validate,
  authValidators,
  contactValidators,
  messageValidators,
  templateValidators,
  campaignValidators,
  chatbotValidators,
  whatsappNumberValidators,
  queryValidators,
  mongoIdValidator,
  sanitizers
};