const db = require("../config/database");

// User Growth Report
exports.getUserGrowthReport = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        YEAR(createdAt) AS year,
        MONTH(createdAt) AS month_number,
        MONTHNAME(createdAt) AS month_name,
        COUNT(*) AS total_users
      FROM users
      GROUP BY YEAR(createdAt), MONTH(createdAt)
      ORDER BY year ASC, month_number ASC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("User Growth Report Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
