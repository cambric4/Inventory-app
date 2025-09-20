require("dotenv").config();
const { Client } = require("pg");

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function populate() {
  await client.connect();

  await client.query("DELETE FROM book");
  await client.query("DELETE FROM genre");

  const genresData = [
    ["Fiction", "Fictional books"],
    ["Non-Fiction", "Informative books"],
    ["Science Fiction", "Books set in the future or alternate realities"],
    ["Fantasy", "Books with magical or supernatural elements"],
    ["Mystery", "Books with crime, investigation or suspense"],
    ["Biography", "Life stories of real people"],
    ["History", "Historical books"],
    ["Children", "Books for children and young readers"]
  ];

  const genres = await Promise.all(
    genresData.map(([name, description]) =>
      client.query(
        "INSERT INTO genre (name, description) VALUES ($1, $2) RETURNING id",
        [name, description]
      )
    )
  );

  const [fiction, nonfiction, scifi, fantasy] = genres.map(g => g.rows[0].id);

  // Add some sample books
  await Promise.all([
    client.query(
      "INSERT INTO book (title, author, description, price, stock_quantity, genre_id) VALUES ($1,$2,$3,$4,$5,$6)",
      ["The Great Gatsby", "F. Scott Fitzgerald", "Classic novel", 10.99, 5, fiction]
    ),
    client.query(
      "INSERT INTO book (title, author, description, price, stock_quantity, genre_id) VALUES ($1,$2,$3,$4,$5,$6)",
      ["Sapiens", "Yuval Noah Harari", "History of humankind", 15.99, 10, nonfiction]
    ),
    client.query(
      "INSERT INTO book (title, author, description, price, stock_quantity, genre_id) VALUES ($1,$2,$3,$4,$5,$6)",
      ["Dune", "Frank Herbert", "Epic science fiction novel", 12.99, 7, scifi]
    ),
    client.query(
      "INSERT INTO book (title, author, description, price, stock_quantity, genre_id) VALUES ($1,$2,$3,$4,$5,$6)",
      ["Harry Potter and the Sorcerer's Stone", "J.K. Rowling", "Magical fantasy novel", 9.99, 15, fantasy]
    ),
  ]);

  console.log("Database populated with genres and books!");
  await client.end();
}

populate().catch(console.error);
