import { createPool, Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';

class DataBase {

    private pool: Pool;

    constructor() {
        this.pool = createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'wbot_db',
            connectionLimit: 1000000000,
            namedPlaceholders: true
        });
    }

    public async getConnection(): Promise<PoolConnection> {
        return await this.pool.getConnection();
    }

    public async executeQuery(sql: string, values?: any[]): Promise<RowDataPacket[]> {
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute(sql, values);
            return rows as RowDataPacket[];
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            connection.release();
        }
    }

    public async readDailyReport(table: string, startIndex: number, endIndex: number, id: string): Promise<{ allWorkingOk: boolean, affects: string[], notAffects: string[], withObservation: string[] }> {
        const sql = `SELECT * FROM ${table} ORDER BY ${id} DESC LIMIT 1`;
        const result = await this.executeQuery(sql);
        const value = result.map(row => Object.values(row)) as string[][];
        let allWorkingOk = true;
        let affects: string[] = [];
        let notAffects: string[] = [];
        let withObservation: string[] = [];
        const removedArray = value.splice(0, 1)[0];
        const newResult: string[] = value.concat(removedArray).flat();
        for (let i = startIndex; i <= endIndex; i++) {


            if (newResult[i].includes('Afeta o negócio') || newResult[i].includes('Afeta operação')) {
                allWorkingOk = false;
                affects.push(newResult[i], newResult[i + 1]);
            }

            if (newResult[i].includes('Não afeta o negócio') || newResult[i].includes('Não afeta operação')) {
                allWorkingOk = false;
                notAffects.push(newResult[i], newResult[i + 1]);
            }

            if (newResult[i].includes('com observações')) {
                allWorkingOk = false;
                withObservation.push(newResult[i], newResult[i + 1]);
            }
        }
        return ({ allWorkingOk, affects, notAffects, withObservation })
    }

    public async getDate(table: string) {
        const sql = `SELECT gc_date FROM ${table} ORDER BY gc_id DESC LIMIT 1`
        return await this.executeQuery(sql);
    }

    public async getColumns(table: string): Promise<string[]> {
        const results = await this.executeQuery(`DESCRIBE ${table}`);
        let columns = results.map(result => result.Field);
        return columns;
    }

    public async insertColumns(table: string, values: string[]) {
        const columns = await this.getColumns(table)
        const query = `INSERT INTO ${table} (${columns.slice(1).join(', ')}) VALUES (${values});`;
        await this.executeQuery(query);
        // console.log("Query executada");
    }
}

export default new DataBase();