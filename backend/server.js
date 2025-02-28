const express = require("express");
const cors = require("cors");
const { sql, poolPromise } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ API รับ Feedback และบันทึกลง DB
app.post("/feedback", async (req, res) => {
    try {
        const { user_id, rating, comment, referrer } = req.body;
        const pool = await poolPromise;

        // ✅ ถ้า `referrer` ว่าง → ใช้ `origin`
        let effectiveReferrer = referrer || req.headers.origin || "localhost:5000";

        // ✅ Normalize Referrer → `hostname + path`
        let normalizedReferrer;
        try {
            const url = new URL(effectiveReferrer);
            normalizedReferrer = `${url.host}${url.pathname}`;
        } catch (error) {
            console.error("❌ Error parsing Referrer URL:", error);
            return res.status(400).json({ message: "Invalid referrer URL" });
        }

        console.log("🌍 Referrer (Effective):", effectiveReferrer);
        console.log("🔄 Normalized Referrer:", normalizedReferrer);

        // ✅ ค้นหา `app_id`
        const result = await pool.request()
            .input("referrer", sql.NVarChar, `%${normalizedReferrer}%`)
            .query("SELECT app_id FROM Master_App WHERE app_url LIKE @referrer OR app_url LIKE @referrer + '/'");

        if (result.recordset.length === 0) {
            console.log("❌ App not found in Master_App:", normalizedReferrer);
            return res.status(400).json({ message: "App not registered" });
        }

        const app_id = result.recordset[0].app_id;

        // ✅ ตรวจสอบว่า `user_id` ถูกต้องก่อน Query
        if (!user_id) {
            return res.status(400).json({ message: "Invalid user_id" });
        }

        // ✅ ตรวจสอบว่าผู้ใช้ให้ Feedback ไปแล้วหรือยัง
        const checkFeedback = await pool.request()
            .input("user_id", sql.NVarChar, user_id)
            .input("app_id", sql.Int, app_id)
            .query(`
                SELECT COUNT(*) AS count FROM Feedback 
                WHERE user_id = @user_id 
                  AND app_id = @app_id 
                  AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
            `);

        if (checkFeedback.recordset[0].count > 0) {
            return res.status(400).json({ message: "User already gave feedback today." });
        }

        // ✅ บันทึก Feedback
        await pool.request()
            .input("user_id", sql.NVarChar, user_id)
            .input("app_id", sql.Int, app_id)
            .input("rating", sql.Int, rating)
            .input("comment", sql.NVarChar, comment)
            .query(`
                INSERT INTO Feedback (user_id, app_id, rating, comment, created_at, feedback_date) 
                VALUES (@user_id, @app_id, @rating, @comment, GETDATE(), GETDATE())
            `);

        res.status(201).json({ message: "Feedback saved" });
    } catch (err) {
        console.error("❌ Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ API ตรวจสอบ Feedback และ `last_dismiss_time`
app.get("/check-feedback/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        let referrer = req.headers.referer || req.headers.origin || "localhost:5000";

        console.log("🔍 Checking feedback for:", user_id);
        console.log("🌍 Referrer (Received):", referrer);

        if (!referrer) {
            return res.status(400).json({ message: "No referrer provided", hasFeedback: false });
        }

        // 🔄 Normalize Referrer → `hostname + path`
        let normalizedReferrer;
        try {
            const url = new URL(referrer);
            normalizedReferrer = `${url.host}${url.pathname}`;
        } catch (error) {
            console.error("❌ Error parsing Referrer URL:", error);
            return res.status(400).json({ message: "Invalid referrer URL", hasFeedback: false });
        }

        console.log("🔄 Normalized Referrer:", normalizedReferrer);

        const pool = await poolPromise;

        // ✅ ค้นหา `app_id`
        const appResult = await pool.request()
            .input("referrer", sql.NVarChar, `%${normalizedReferrer}%`)
            .query("SELECT app_id FROM Master_App WHERE app_url LIKE @referrer OR app_url LIKE @referrer + '/'");

        if (appResult.recordset.length === 0) {
            console.log("❌ App not found in Master_App:", normalizedReferrer);
            return res.status(400).json({ message: "App not registered in Master_App", hasFeedback: false });
        }

        const app_id = appResult.recordset[0].app_id;

        // ✅ เช็ค `user_id` ว่าถูกต้อง
        if (!user_id) {
            return res.status(400).json({ message: "Invalid user_id", hasFeedback: false });
        }

        // ✅ ตรวจสอบว่าให้คะแนนในช่วงเวลานี้ไปแล้วหรือยัง
        const today = new Date();
        const periodStart = today.getDate() <= 15 ? 1 : 16;
        const periodEnd = today.getDate() <= 15 ? 15 : 31;

        const result = await pool.request()
            .input("user_id", sql.NVarChar, user_id)
            .input("app_id", sql.Int, app_id)
            .query(`
                SELECT COUNT(*) AS count FROM Feedback 
                WHERE user_id = @user_id 
                  AND app_id = @app_id 
                  AND DAY(feedback_date) BETWEEN ${periodStart} AND ${periodEnd}
                  AND MONTH(feedback_date) = MONTH(GETDATE())
                  AND YEAR(feedback_date) = YEAR(GETDATE())
            `);

        const hasFeedback = result.recordset[0].count > 0;

        // ✅ ดึง `last_dismiss_time`
        const dismissResult = await pool.request()
            .input("user_id", sql.NVarChar, user_id)
            .input("app_id", sql.Int, app_id)
            .query(`
                SELECT last_dismiss_time FROM User_Feedback_Status 
                WHERE user_id = @user_id AND app_id = @app_id
            `);

        const lastDismissTime = dismissResult.recordset.length > 0 ? dismissResult.recordset[0].last_dismiss_time : null;
        const message = hasFeedback ? "User has already given feedback." : "User has not given feedback yet.";

        console.log("📡 Backend Response Debug:", {
            hasFeedback,
            lastDismissTime,
            app_id,
            message
        });

        return res.json({ hasFeedback, lastDismissTime, app_id, message });
    } catch (err) {
        console.error("❌ Error:", err);
        return res.status(500).json({ message: "Internal Server Error", hasFeedback: false });
    }
});

// ✅ API บันทึก `last_dismiss_time` เมื่อกด "ไว้คราวหลัง"
app.post("/dismiss-feedback", async (req, res) => {
  try {
      const { user_id, app_id } = req.body;
      const pool = await poolPromise;
      const localDateTime = new Date();

      await pool.request()
    .input("user_id", sql.NVarChar, user_id)
    .input("app_id", sql.Int, app_id)
    .input("last_dismiss_time", sql.DateTime, localDateTime)
    .query(`
        MERGE INTO User_Feedback_Status AS target
        USING (SELECT @user_id AS user_id, @app_id AS app_id) AS source
        ON target.user_id = source.user_id AND target.app_id = source.app_id
        WHEN MATCHED THEN
            UPDATE SET last_dismiss_time = @last_dismiss_time
        WHEN NOT MATCHED THEN
            INSERT (user_id, app_id, last_dismiss_time) 
            VALUES (@user_id, @app_id, @last_dismiss_time);
    `);

      res.json({ message: "Dismiss time recorded" });
  } catch (err) {
      console.error("❌ Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
