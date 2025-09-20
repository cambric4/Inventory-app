const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ===== List all items =====
exports.item_list = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT item.*, category.id AS category_id, category.name AS category_name
      FROM item
      LEFT JOIN category ON item.category_id = category.id
      ORDER BY item.name
    `);

    const items = rows.map(row => ({
      ...row,
      category: row.category_id ? { id: row.category_id, name: row.category_name } : null
    }));

    res.render("items/item_list", { items });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

// ===== Item detail =====
exports.item_detail = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT item.*, category.id AS category_id, category.name AS category_name
      FROM item
      LEFT JOIN category ON item.category_id = category.id
      WHERE item.id=$1
    `, [id]);

    const item = rows[0];
    if (item) item.category = item.category_id ? { id: item.category_id, name: item.category_name } : null;

    res.render("items/item_detail", { item });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

// ===== Create =====
exports.item_create_get = async (req, res) => {
  try {
    const categories = await pool.query("SELECT * FROM category ORDER BY name");
    res.render("items/item_form", { item: {}, categories: categories.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

exports.item_create_post = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category_id } = req.body;
    await pool.query(`
      INSERT INTO item (name, description, price, stock_quantity, category_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [name, description, price, stock_quantity, category_id]);
    res.redirect("/items");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

// ===== Update =====
exports.item_update_get = async (req, res) => {
  try {
    const { id } = req.params;
    const itemResult = await pool.query("SELECT * FROM item WHERE id=$1", [id]);
    const categoriesResult = await pool.query("SELECT * FROM category ORDER BY name");
    res.render("items/item_form", { item: itemResult.rows[0], categories: categoriesResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

exports.item_update_post = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category_id } = req.body;
    await pool.query(`
      UPDATE item
      SET name=$1, description=$2, price=$3, stock_quantity=$4, category_id=$5
      WHERE id=$6
    `, [name, description, price, stock_quantity, category_id, id]);
    res.redirect(`/items/${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

// ===== Delete =====
exports.item_delete_get = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM item WHERE id=$1", [id]);
    res.render("items/item_delete", { item: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

exports.item_delete_post = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_password } = req.body;

    if (admin_password !== process.env.ADMIN_PASSWORD) {
      return res.send("Incorrect admin password.");
    }

    await pool.query("DELETE FROM item WHERE id=$1", [id]);
    res.redirect("/items");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};
