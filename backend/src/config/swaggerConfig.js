// src/config/swaggerConfig.js
const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vision Pro Platform API',
      version: '1.0.0',
      description: 'API documentation for Vision Pro immersive content platform',
      contact: {
        name: 'API Support',
        email: 'support@visionpro-platform.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5001/api',
        description: 'Development server'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;