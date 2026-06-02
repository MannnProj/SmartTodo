const baseUrl = process.env.API_BASE_URL || '/api';

const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
  required: ['error'],
};

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Mannn' },
    email: { type: 'string', format: 'email', example: 'mannn@example.com' },
    created_at: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'email'],
};

const taskSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    user_id: { type: 'integer', example: 1 },
    title: { type: 'string', example: 'Review SmartTodo API docs' },
    description: { type: 'string', example: 'Check Scalar docs and OpenAPI schema' },
    task_date: { type: 'string', format: 'date', nullable: true, example: '2026-06-02' },
    task_time: { type: 'string', nullable: true, example: '13:00:00' },
    location: { type: 'string', example: 'Home' },
    priority: { type: 'string', enum: ['high', 'medium', 'low'], example: 'medium' },
    done: { type: 'boolean', example: false },
    created_at: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'user_id', 'title', 'priority', 'done'],
};

const authResponseSchema = {
  type: 'object',
  properties: {
    user: userSchema,
    accessToken: {
      type: 'string',
      description: 'JWT access token. Use this as Authorization: Bearer <token> for task endpoints.',
    },
  },
  required: ['user', 'accessToken'],
};

export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'SmartTodo API',
    version: '1.0.0',
    description: 'API documentation for SmartTodo. Task endpoints require a JWT bearer access token. Refresh uses the httpOnly refreshToken cookie set by login/register.',
  },
  servers: [
    {
      url: baseUrl,
      description: 'SmartTodo API base URL',
    },
  ],
  tags: [
    { name: 'Health', description: 'Service health checks' },
    { name: 'Auth', description: 'Authentication and session endpoints' },
    { name: 'Tasks', description: 'Authenticated task management endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      refreshCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
      },
    },
    schemas: {
      Error: errorSchema,
      User: userSchema,
      Task: taskSchema,
      AuthResponse: authResponseSchema,
      RegisterRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Mannn' },
          email: { type: 'string', format: 'email', example: 'mannn@example.com' },
          password: { type: 'string', minLength: 6, example: 'secret123' },
        },
        required: ['name', 'email', 'password'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'mannn@example.com' },
          password: { type: 'string', minLength: 6, example: 'secret123' },
        },
        required: ['email', 'password'],
      },
      TaskCreateRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Test task dari API' },
          description: { type: 'string', example: 'Created through Scalar docs' },
          task_date: { type: 'string', format: 'date', nullable: true, example: '2026-06-02' },
          task_time: { type: 'string', nullable: true, example: '13:00' },
          location: { type: 'string', example: 'Home' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium' },
        },
        required: ['title'],
      },
      TaskUpdateRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Updated task title' },
          description: { type: 'string', example: 'Updated description' },
          task_date: { type: 'string', format: 'date', nullable: true, example: '2026-06-03' },
          task_time: { type: 'string', nullable: true, example: '14:30' },
          location: { type: 'string', example: 'Office' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          done: { type: 'boolean', example: true },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API health',
        responses: {
          '200': {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                  required: ['status', 'timestamp'],
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered. A refreshToken cookie is also set.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '400': { description: 'Missing fields or invalid password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive an access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful. A refreshToken cookie is also set.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '400': { description: 'Email/password missing', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh the access token using the refreshToken cookie',
        security: [{ refreshCookie: [] }],
        responses: {
          '200': {
            description: 'New access token issued',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '401': { description: 'Missing or invalid refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out and clear the refreshToken cookie',
        responses: {
          '200': {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string', example: 'Logged out successfully' } },
                  required: ['message'],
                },
              },
            },
          },
        },
      },
    },
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks for the authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, required: false, description: 'Filter by date, e.g. 2026-06-02' },
          { name: 'month', in: 'query', schema: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }, required: false, description: 'Filter by month, e.g. 2026-06' },
        ],
        responses: {
          '200': {
            description: 'Task list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } } },
                  required: ['tasks'],
                },
              },
            },
          },
          '401': { description: 'Missing, invalid, or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskCreateRequest' } } },
        },
        responses: {
          '201': {
            description: 'Task created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { task: { $ref: '#/components/schemas/Task' } },
                  required: ['task'],
                },
              },
            },
          },
          '400': { description: 'Title is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Missing, invalid, or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/tasks/{id}': {
      patch: {
        tags: ['Tasks'],
        summary: 'Update a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Task ID' },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskUpdateRequest' } } },
        },
        responses: {
          '200': {
            description: 'Task updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { task: { $ref: '#/components/schemas/Task' } },
                  required: ['task'],
                },
              },
            },
          },
          '401': { description: 'Missing, invalid, or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Task not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Task ID' },
        ],
        responses: {
          '200': {
            description: 'Task deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string', example: 'Task deleted successfully' } },
                  required: ['message'],
                },
              },
            },
          },
          '401': { description: 'Missing, invalid, or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Task not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};
