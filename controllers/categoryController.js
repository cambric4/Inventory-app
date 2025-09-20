const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ===== List all categories =====
exports.category_list = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT category.*, COUNT(item.id) AS item_count
      FROM category
      LEFT JOIN item ON item.category_id = category.id
      GROUP BY category.id
      ORDER BY category.name
    `);

    res.render("categories/category_list", { categories: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

// ===== Category detail =====
exports.category_detail = async (req, res) => {
  try {
    const { id } = req.params;

    const catResult = await pool.query("SELECT * FROM category WHERE id=$1", [id]);
    const category = catResult.rows[0];

    if (!category) return res.status(404).send("Category not found");

    const itemsResult = await pool.query("SELECT * FROM item WHERE category_id=$1 ORDER BY name", [id]);
    const items = itemsResult.rows;

    res.render("categories/category_detail", { category, items });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

// ===== Create =====
exports.category_create_get = (req, res) => {
  res.render("categories/category_form", { category: {} });
};

exports.category_create_post = async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query(
      "INSERT INTO category (name, description) VALUES ($1, $2)",
      [name, description]
    );
    res.redirect("/categories");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

// ===== Update =====
exports.category_update_get = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM category WHERE id=$1", [id]);
    res.render("categories/category_form", { category: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

exports.category_update_post = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    await pool.query(
      "UPDATE category SET name=$1, description=$2 WHERE id=$3",
      [name, description, id]
    );
    res.redirect(`/categories/${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

// ===== Delete =====
exports.category_delete_get = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM category WHERE id=$1", [id]);
    const category = rows[0];

    const itemsResult = await pool.query("SELECT * FROM item WHERE category_id=$1", [id]);
    const items = itemsResult.rows;

    res.render("categories/category_delete", { category, items });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

exports.category_delete_post = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_password } = req.body;

    if (admin_password !== process.env.ADMIN_PASSWORD) {
      return res.send("Incorrect admin password.");
    }

    // Option: remove category from items (set category_id=null) instead of deleting items
    await pool.query("UPDATE item SET category_id=NULL WHERE category_id=$1", [id]);
    await pool.query("DELETE FROM category WHERE id=$1", [id]);

    res.redirect("/categories");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

