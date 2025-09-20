const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// List all genres with book counts
exports.genre_list = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT genre.*, COUNT(book_genre.book_id) AS book_count
    FROM genre
    LEFT JOIN book_genre ON genre.id = book_genre.genre_id
    GROUP BY genre.id
    ORDER BY genre.name
  `);
  res.render("genres/genre_list", { genres: rows });
};

// Genre detail: show genre info and all books in it
exports.genre_detail = async (req, res) => {
  const { id } = req.params;

  // Get genre info
  const genreResult = await pool.query("SELECT * FROM genre WHERE id=$1", [id]);
  const genre = genreResult.rows[0];
  if (!genre) return res.send("Genre not found");

  // Get all books in this genre
  const booksResult = await pool.query(`
    SELECT book.*, 
           COALESCE(json_agg(json_build_object('id', g.id, 'name', g.name)) 
                    FILTER (WHERE g.id IS NOT NULL), '[]') AS genres
    FROM book
    LEFT JOIN book_genre bg ON book.id = bg.book_id
    LEFT JOIN genre g ON g.id = bg.genre_id
    WHERE book.id IN (
      SELECT book_id FROM book_genre WHERE genre_id=$1
    )
    GROUP BY book.id
    ORDER BY book.title
  `, [id]);

  res.render("genres/genre_detail", { genre, books: booksResult.rows });
};

// Create
exports.genre_create_get = (req, res) => res.render("genres/genre_form", { genre: {} });

exports.genre_create_post = async (req, res) => {
  const { name, description } = req.body;
  await pool.query(
    "INSERT INTO genre (name, description) VALUES ($1, $2)",
    [name, description]
  );
  res.redirect("/genres");
};

// Update
exports.genre_update_get = async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query("SELECT * FROM genre WHERE id=$1", [id]);
  res.render("genres/genre_form", { genre: rows[0] });
};

exports.genre_update_post = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  await pool.query(
    "UPDATE genre SET name=$1, description=$2 WHERE id=$3",
    [name, description, id]
  );
  res.redirect(`/genres/${id}`);
};

// Delete
exports.genre_delete_get = async (req, res) => {
  const { id } = req.params;

  const genreResult = await pool.query("SELECT * FROM genre WHERE id=$1", [id]);
  const genre = genreResult.rows[0];

  // Find all books that belong to this genre
  const booksResult = await pool.query(`
    SELECT book.*
    FROM book
    JOIN book_genre bg ON book.id = bg.book_id
    WHERE bg.genre_id = $1
  `, [id]);

  res.render("genres/genre_delete", { genre, books: booksResult.rows });
};

exports.genre_delete_post = async (req, res) => {
  const { id } = req.params;
  const { admin_password } = req.body;

  if (admin_password !== process.env.ADMIN_PASSWORD) {
    return res.send("Incorrect admin password.");
  }

  // Remove the genre from all books in the junction table
  await pool.query("DELETE FROM book_genre WHERE genre_id=$1", [id]);

  // Delete the genre itself
  await pool.query("DELETE FROM genre WHERE id=$1", [id]);

  res.redirect("/genres");
};
