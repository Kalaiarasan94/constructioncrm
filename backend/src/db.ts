import mysql from 'mysql2/promise';

// Configure your local MySQL database connection details here
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',             // Default MySQL username
  password: '',                 // Default PHPMyAdmin/XAMPP password is empty
  database: 'construction_erp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = {
  /**
   * Helper utility to execute queries.
   * mysql2 returns an array: [rows, fields]. We return just the rows to keep usage clean.
   */
  query: async (sql: string, params?: any[]): Promise<any> => {
    const [rows] = await pool.execute(sql, params);
    return { rows: rows as any[] };
  }
};