require("dotenv").config();
const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function populate() {
  await client.connect();

  await client.query("DELETE FROM item");
  await client.query("DELETE FROM category");

  const categories = await Promise.all([
    client.query(
      "INSERT INTO category (name, description) VALUES ($1, $2) RETURNING id",
      ["Electronics", "Gadgets and devices"]
    ),
    client.query(
      "INSERT INTO category (name, description) VALUES ($1, $2) RETURNING id",
      ["Books", "Fiction and non-fiction"]
    ),
  ]);

  const [electronics, books] = categories.map((c) => c.rows[0].id);

  await Promise.all([
    client.query(
      "INSERT INTO item (name, description, price, stock_quantity, category_id) VALUES ($1, $2, $3, $4, $5)",
      ["Laptop", "15-inch screen", 999.99, 10, electronics]
    ),
    client.query(
      "INSERT INTO item (name, description, price, stock_quantity, category_id) VALUES ($1, $2, $3, $4, $5)",
      ["Headphones", "Noise cancelling", 199.99, 25, electronics]
    ),
    client.query(
      "INSERT INTO item (name, description, price, stock_quantity, category_id) VALUES ($1, $2, $3, $4, $5)",
      ["Novel", "Best-selling mystery book", 14.99, 50, books]
    ),
  ]);

  console.log("Database populated!");
  await client.end();
}

populate().catch((err) => console.error(err));
