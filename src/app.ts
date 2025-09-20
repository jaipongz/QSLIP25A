import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { DB } from './utils/database';
import authRoutes from './routes/authRoutes';
import { setupSwagger } from './utils/setupSwagger';
import { log } from 'console';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
const corsOptions = {
    origin: (origin: any, callback: any) => {
        console.log(origin,'has called');
        
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));


app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to qslip-api',
        documentation: '/api-docs'
    });
});
app.use(authRoutes);
if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
}

app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

app.listen(PORT, async () => {
    console.log('✪✪✪✪✪✪✪✪✪✪✪ ✮ Powered by JaipongZ Industry ✮ ✪✪✪✪✪✪✪✪✪✪✪');
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;