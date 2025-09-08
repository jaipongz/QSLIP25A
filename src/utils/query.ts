import { DB } from './database';

export class QueryBuilder {
    static async select<T>(table: string, columns: string[] = ['*'], where: string = '', params: any[] = []): Promise<T> {
        const columnList = columns.join(', ');
        let query = `SELECT ${columnList} FROM ${table}`;

        if (where) {
            query += ` WHERE ${where}`;
        }

        return await DB.execute<T>(query, params);
    }

    static async insert<T>(table: string, data: Record<string, any>): Promise<any> {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map(() => '?').join(', ');

        const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
        const result = await DB.execute<any>(query, values);

        return result;
    }

    static async update<T>(table: string, data: Record<string, any>, where: string, params: any[] = []): Promise<any> {
        const setClause = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(', ');

        const values = [...Object.values(data), ...params];
        const query = `UPDATE ${table} SET ${setClause} WHERE ${where}`;

        return await DB.execute<any>(query, values);
    }

    static async delete(table: string, where: string, params: any[] = []): Promise<any> {
        const query = `DELETE FROM ${table} WHERE ${where}`;
        return await DB.execute<any>(query, params);
    }
}