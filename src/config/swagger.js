const swaggerJsdoc = require('swagger-jsdoc');
const { getConfig } = require('./env');

const config = getConfig();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrueTab API',
      version: '1.0.0',
      description: 'A comprehensive POS and restaurant management API',
      contact: {
        name: 'TrueTab Support',
        email: 'support@truetab.com'
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { 
              type: 'string', 
              enum: ['SUPER_ADMIN', 'BRAND_OWNER', 'BRAND_ADMIN', 'BRANCH_MANAGER', 'STAFF'] 
            },
            brandId: { type: 'string', nullable: true },
            branchId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
  },
  apis: ['./src/modules/*/*.routes.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = specs;
