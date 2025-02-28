const { poolPromise } = require("./db");

async function testConnection() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT GETDATE() AS CurrentTime");
    console.log("✅ Database Connected, Server Time:", result.recordset[0].CurrentTime);
  } catch (error) {
    console.error("❌ Connection Error:", error);
  }
}

testConnection();
