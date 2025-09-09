import swaggerAutogen from 'swagger-autogen';
require('dotenv').config();
import path from 'path';

const doc = {
    info: {
        version: "1.0.0",
        title: "Authentication API",
        description: "API documentation for the Authentication system"
    },
    host: process.env.BASE_URL || 'localhost:3000',
    basePath: "/",
    schemes: process.env.NODE_ENV === 'production' ? ['https'] : ['http', 'https'],
    securityDefinitions: {
        bearerAuth: {
            type: "apiKey",
            name: "Quick slip api",
            in: "header",
            description: "Enter 'Bearer' [space] and then your token."
        }
    },
    tags: [
        {
            name: "Authentication",
            description: "Endpoints for user authentication and authorization"
        }
    ],
    definitions: {
        User: {
            id: "string",
            username: "string",
            email: "string",
            password: "string"
        },
        RegisterRequest: {
            $username: "string",
            $email: "string",
            $password: "string"
        },
        LoginRequest: {
            $email: "string",
            $password: "string"
        },
        AuthResponse: {
            user: {
                $ref: "#/definitions/User"
            },
            token: "string",
            refreshToken: "string"
        },
        ErrorResponse: {
            message: "string",
            error: "string"
        }
    }
};

const outputFile = path.join(__dirname, '../../swagger_output.json');
const endpointsFiles = ['./src/routes/authRoutes.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc);