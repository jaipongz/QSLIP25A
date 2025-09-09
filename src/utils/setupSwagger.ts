import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

export const setupSwagger = (app: express.Application): void => {
  try {
    const swaggerFilePath = path.resolve(__dirname, '../../swagger_output.json');
    
    if (fs.existsSync(swaggerFilePath)) {
      const swaggerDocument = require(swaggerFilePath);
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      console.log('Swagger UI is available at /api-docs');
    } else {
      console.warn('Swagger documentation file not found. Run "npm run swagger" to generate it.');
    }
  } catch (error) {
    console.error('Error setting up Swagger:', error);
  }
};