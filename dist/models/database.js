"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = require("mysql2/promise");
class DataBase {
    constructor() {
        this.pool = (0, promise_1.createPool)({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'wbot_db',
            connectionLimit: 1000000000,
            namedPlaceholders: true
        });
    }
    async getConnection() {
        return await this.pool.getConnection();
    }
    async executeQuery(sql, values) {
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute(sql, values);
            return rows;
        }
        catch (err) {
            console.error(err);
            throw err;
        }
        finally {
            connection.release();
        }
    }
    async readDailyReport(table, startIndex, endIndex, id) {
        const sql = `SELECT * FROM ${table} ORDER BY ${id} DESC LIMIT 1`;
        const result = await this.executeQuery(sql);
        const value = result.map(row => Object.values(row));
        let allWorkingOk = true;
        let affects = [];
        let notAffects = [];
        let withObservation = [];
        const removedArray = value.splice(0, 1)[0];
        const newResult = value.concat(removedArray).flat();
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
        return ({ allWorkingOk, affects, notAffects, withObservation });
    }
    async getDate(table) {
        const sql = `SELECT gc_date FROM ${table} ORDER BY gc_id DESC LIMIT 1`;
        return await this.executeQuery(sql);
    }
    async getColumns(table) {
        const results = await this.executeQuery(`DESCRIBE ${table}`);
        let columns = results.map(result => result.Field);
        return columns;
    }
    async insertColumns(table, values) {
        const columns = await this.getColumns(table);
        const query = `INSERT INTO ${table} (${columns.slice(1).join(', ')}) VALUES (${values});`;
        await this.executeQuery(query);
        // console.log("Query executada");
    }
}
exports.default = new DataBase();
