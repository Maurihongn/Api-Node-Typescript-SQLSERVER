import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';

//Metadata info abour our API
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NOIRANDBLANC API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Utiliza el token JWT que te da el login y pegalo aca, no hace falta poner Bearer al principio',
        },
      },
      schemas: {
        ActivationCode: {
          type: 'object',
          properties: {
            codeId: {
              type: 'integer',
            },
            userId: {
              type: 'integer',
            },
            code: {
              type: 'string',
            },
            isUsed: {
              type: 'boolean',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            categoryId: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            creationDate: {
              type: 'string',
              format: 'date-time',
            },
            isActive: {
              type: 'boolean',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Item',
              },
            },
          },
        },
        Item: {
          type: 'object',
          properties: {
            itemId: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            price: {
              type: 'number',
            },
            isActive: {
              type: 'boolean',
            },
            description: {
              type: 'string',
            },
            creationDate: {
              type: 'string',
              format: 'date-time',
            },
            categoryId: {
              type: 'integer',
            },
            category: {
              $ref: '#/components/schemas/Category',
            },
            itemImage: {
              type: 'string',
            },
            orderItems: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem',
              },
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            orderId: {
              type: 'integer',
            },
            tableNumber: {
              type: 'integer',
            },
            orderStatusId: {
              type: 'integer',
            },
            numberOfPeople: {
              type: 'integer',
            },
            creationDate: {
              type: 'string',
              format: 'date-time',
            },
            userId: {
              type: 'integer',
            },
            orderStatus: {
              $ref: '#/components/schemas/OrderStatus',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            orderItems: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem',
              },
            },
            totalPrice: {
              type: 'number',
            },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            orderItemId: {
              type: 'integer',
            },
            orderId: {
              type: 'integer',
            },
            itemId: {
              type: 'integer',
            },
            quantity: {
              type: 'integer',
            },
            unitPrice: {
              type: 'number',
            },
            totalPrice: {
              type: 'number',
            },
            order: {
              $ref: '#/components/schemas/Order',
            },
            item: {
              $ref: '#/components/schemas/Item',
            },
          },
        },
        OrderStatus: {
          type: 'object',
          properties: {
            orderStatusId: {
              type: 'integer',
            },
            statusName: {
              type: 'string',
            },
            orders: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Order',
              },
            },
          },
        },
        Reservation: {
          type: 'object',
          properties: {
            reservationId: {
              type: 'integer',
            },
            reservationDate: {
              type: 'string',
              format: 'date-time',
            },
            reservationStatusId: {
              type: 'integer',
            },
            userId: {
              type: 'integer',
            },
            reservationStatus: {
              $ref: '#/components/schemas/ReservationStatus',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        ReservationStatus: {
          type: 'object',
          properties: {
            reservationStatusId: {
              type: 'integer',
            },
            statusName: {
              type: 'string',
            },
            reservations: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Reservation',
              },
            },
          },
        },
        Role: {
          type: 'object',
          properties: {
            roleId: {
              type: 'integer',
            },
            roleName: {
              type: 'string',
            },
            roleValue: {
              type: 'string',
            },
            users: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            userId: {
              type: 'integer',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
            },
            profileImage: {
              type: 'string',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            address: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            birthDate: {
              type: 'string',
              format: 'date-time',
            },
            hireDate: {
              type: 'string',
              format: 'date-time',
            },
            roleId: {
              type: 'integer',
            },
            salary: {
              type: 'number',
            },
            isActive: {
              type: 'boolean',
            },
            activationCodes: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ActivationCode',
              },
            },
            orders: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Order',
              },
            },
            reservations: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Reservation',
              },
            },
            role: {
              $ref: '#/components/schemas/Role',
            },
          },
        },
      },
    },
  },
  apis: [`${path.join(__dirname, './routes/*.routes.ts')}`],
};

//DOCS en JSON format
const swaggerSpec = swaggerJsdoc(options);

//Function to setup our docs

export const swaggerDocs = (app: Express, port: number) => {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Docs disponibles en https://localhost:${port}/api/v1/docs`);
};
