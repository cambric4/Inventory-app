const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.index = async (req, res) => {
  try {
    const categoryCount = await pool.query("SELECT COUNT(*) FROM category");
    const itemCount = await pool.query("SELECT COUNT(*) FROM item");

    res.render("index", {
      categoryCount: categoryCount.rows[0].count,
      itemCount: itemCount.rows[0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};
