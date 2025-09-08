import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: mysql.PoolOptions = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qslip_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    charset: 'utf8mb4',
    timezone: '+00:00',
    debug: false,
    trace: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

const pool = mysql.createPool(dbConfig);

class Database {
    private static instance: Database;
    private pool: mysql.Pool;

    private constructor() {
        this.pool = pool;
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public async getConnection(): Promise<mysql.PoolConnection> {
        try {
            const connection = await this.pool.getConnection();
            return connection;
        } catch (error: any) {
            console.error('❌ Database connection failed:', error.message);
            throw error;
        }
    }

    public async execute<T>(query: string, params: any[] = []): Promise<T> {
        let connection: mysql.PoolConnection | null = null;

        try {
            connection = await this.getConnection();
            const [rows] = await connection.execute(query, params);
            return rows as T;
        } catch (error: any) {
            console.error('❌ Query execution failed:', error.message);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    public async checkConnection(): Promise<boolean> {
        try {
            const connection = await this.getConnection();
            await connection.ping();
            connection.release();
            return true;
        } catch (error: any) {
            console.error('❌ Database connection check failed:', error.message);
            return false;
        }
    }

    public async close(): Promise<void> {
        try {
            await this.pool.end();
        } catch (error: any) {
            console.error('❌ Error closing connection pool:', error.message);
        }
    }

    public getPoolStats(): any {
        return {
            connectionLimit: dbConfig.connectionLimit,
            note: 'MySQL2 does not provide built-in pool statistics methods'
        };
    }

    public async getDatabaseStatus(): Promise<any> {
        try {
            const [result] = await this.execute<any>('SHOW STATUS LIKE "Threads_connected"');
            return {
                threadsConnected: result[0]?.Value || 0,
                connectionLimit: dbConfig.connectionLimit
            };
        } catch (error) {
            return { error: 'Failed to get database status' };
        }
    }
}

export const DB = Database.getInstance();