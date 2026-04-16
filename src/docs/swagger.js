const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Live Polling System API',
      version: '1.0.0',
      description: `
## Real-Time Polling System Backend

A scalable backend with **WebSocket-powered live voting**, JWT authentication, and role-based access control.

### Key Concepts
- **Admin** users create and delete polls
- **User** accounts can cast one vote per poll
- **WebSocket** clients connect to poll rooms for live result updates

### WebSocket Events
Connect at \`ws://localhost:5000\` with \`{ auth: { token: "<jwt>" } }\`

| Event         | Direction       | Payload                        |
|---------------|-----------------|--------------------------------|
| \`join_poll\`   | Client → Server | \`{ pollId }\`                 |
| \`vote\`        | Client → Server | \`{ pollId, optionId }\`       |
| \`leave_poll\`  | Client → Server | \`{ pollId }\`                 |
| \`poll_update\` | Server → Client | results object                 |
| \`error\`       | Server → Client | \`{ message }\`                |
      `,
      contact: { name: 'API Support', email: 'support@example.com' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id:    { type: 'string', example: '64a1b2c3d4e5f6g7h8i9j0k1' },
            name:  { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', example: 'jane@example.com' },
            role:  { type: 'string', enum: ['admin', 'user'] },
          },
        },
        Poll: {
          type: 'object',
          properties: {
            id:         { type: 'string' },
            question:   { type: 'string', example: 'Best programming language?' },
            options:    {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id:       { type: 'string' },
                  text:      { type: 'string' },
                  voteCount: { type: 'integer' },
                },
              },
            },
            totalVotes: { type: 'integer' },
            expiresAt:  { type: 'string', format: 'date-time' },
            createdBy:  { $ref: '#/components/schemas/User' },
          },
        },
        PollResults: {
          type: 'object',
          properties: {
            question:   { type: 'string' },
            totalVotes: { type: 'integer' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  optionId:   { type: 'string' },
                  text:       { type: 'string' },
                  voteCount:  { type: 'integer' },
                  percentage: { type: 'string', example: '45.50' },
                },
              },
            },
            winner: { type: 'object' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },

    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name:     { type: 'string', example: 'Jane Doe' },
                    email:    { type: 'string', example: 'jane@example.com' },
                    password: { type: 'string', minLength: 6, example: 'secret1' },
                    role:     { type: 'string', enum: ['admin', 'user'], default: 'user' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully' },
            400: { description: 'Validation error or email already registered' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email:    { type: 'string', example: 'jane@example.com' },
                    password: { type: 'string', example: 'secret1' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful, returns token' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Current user data' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/polls': {
        get: {
          tags: ['Polls'],
          summary: 'List all active polls',
          responses: { 200: { description: 'Array of active polls' } },
        },
        post: {
          tags: ['Polls'],
          summary: 'Create a new poll (Admin only)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['question', 'options', 'expiresAt'],
                  properties: {
                    question:  { type: 'string', example: 'Best JS framework?' },
                    options:   { type: 'array', items: { type: 'string' }, example: ['React', 'Vue', 'Angular'] },
                    expiresAt: { type: 'string', format: 'date-time', example: '2025-12-31T23:59:00Z' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Poll created' },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/polls/{id}': {
        get: {
          tags: ['Polls'],
          summary: 'Get a single poll by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Poll object' }, 404: { description: 'Poll not found' } },
        },
        delete: {
          tags: ['Polls'],
          summary: 'Delete a poll (Admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Poll deleted' }, 403: { description: 'Admin access required' } },
        },
      },
      '/api/polls/{id}/results': {
        get: {
          tags: ['Polls'],
          summary: 'Get live results for a poll',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Poll results with percentages and winner' } },
        },
      },
      '/api/polls/{id}/vote': {
        post: {
          tags: ['Polls'],
          summary: 'Cast a vote on a poll (authenticated users)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['optionId'],
                  properties: { optionId: { type: 'string', example: '64a1b2c3d4e5f6g7h8i9j0k2' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Vote cast, returns updated poll' },
            409: { description: 'Already voted' },
            400: { description: 'Poll expired or invalid option' },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
