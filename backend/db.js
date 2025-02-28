const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433, // รองรับพอร์ตจาก .env
  options: {
    encrypt: false, // ถ้าใช้ Azure SQL Server ให้เปลี่ยนเป็น true
    enableArithAbort: true // ป้องกันข้อผิดพลาดเกี่ยวกับ Arithmetic operations
  }
};

// สร้าง Connection Pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ Connected to SQL Server:", process.env.DB_SERVER);
    return pool;
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
  });

module.exports = { sql, poolPromise };
