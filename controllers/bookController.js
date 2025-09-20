const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// List all books
exports.book_list = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT book.id, book.title, book.author, book.price, book.stock_quantity,
           COALESCE(array_agg(json_build_object('id', genre.id, 'name', genre.name)) 
                    FILTER (WHERE genre.id IS NOT NULL), '{}') AS genres
    FROM book
    LEFT JOIN book_genre ON book.id = book_genre.book_id
    LEFT JOIN genre ON book_genre.genre_id = genre.id
    GROUP BY book.id
    ORDER BY book.title
  `);
  res.render("books/book_list", { books: rows });
};

// Book detail
exports.book_detail = async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(`
    SELECT book.*, COALESCE(array_agg(json_build_object('id', genre.id, 'name', genre.name)) 
                    FILTER (WHERE genre.id IS NOT NULL), '{}') AS genres
    FROM book
    LEFT JOIN book_genre ON book.id = book_genre.book_id
    LEFT JOIN genre ON book_genre.genre_id = genre.id
    WHERE book.id=$1
    GROUP BY book.id
  `, [id]);
  res.render("books/book_detail", { book: rows[0] });
};

// Create book form
exports.book_create_get = async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM genre ORDER BY name");
  res.render("books/book_form", { book: {}, genres: rows });
};

// Create book POST
exports.book_create_post = async (req, res) => {
  const { title, author, description, price, stock_quantity, genre_ids } = req.body;

  const { rows } = await pool.query(`
    INSERT INTO book (title, author, description, price, stock_quantity)
    VALUES ($1,$2,$3,$4,$5) RETURNING id
  `, [title, author, description, price, stock_quantity]);

  const bookId = rows[0].id;

  if (genre_ids) {
    const genresArray = Array.isArray(genre_ids) ? genre_ids : [genre_ids];
    await Promise.all(
      genresArray.map(genre_id =>
        pool.query("INSERT INTO book_genre (book_id, genre_id) VALUES ($1,$2)", [bookId, genre_id])
      )
    );
  }

  res.redirect("/books");
};

// Update book form
exports.book_update_get = async (req, res) => {
  const { id } = req.params;

  const bookResult = await pool.query("SELECT * FROM book WHERE id=$1", [id]);
  const book = bookResult.rows[0];

  const genresResult = await pool.query("SELECT * FROM genre ORDER BY name");
  const bookGenresResult = await pool.query("SELECT genre_id FROM book_genre WHERE book_id=$1", [id]);

  book.genre_ids = bookGenresResult.rows.map(r => r.genre_id); // for checkboxes

  res.render("books/book_form", { book, genres: genresResult.rows });
};

// Update book POST
exports.book_update_post = async (req, res) => {
  const { id } = req.params;
  const { title, author, description, price, stock_quantity, genre_ids } = req.body;

  await pool.query(`
    UPDATE book SET title=$1, author=$2, description=$3, price=$4, stock_quantity=$5
    WHERE id=$6
  `, [title, author, description, price, stock_quantity, id]);

  // Update book_genre
  await pool.query("DELETE FROM book_genre WHERE book_id=$1", [id]);

  if (genre_ids) {
    const genresArray = Array.isArray(genre_ids) ? genre_ids : [genre_ids];
    await Promise.all(
      genresArray.map(genre_id =>
        pool.query("INSERT INTO book_genre (book_id, genre_id) VALUES ($1,$2)", [id, genre_id])
      )
    );
  }

  res.redirect(`/books/${id}`);
};

// Delete book GET
exports.book_delete_get = async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query("SELECT * FROM book WHERE id=$1", [id]);
  res.render("books/book_delete", { book: rows[0] });
};

// Delete book POST
exports.book_delete_post = async (req, res) => {
  const { id } = req.params;
  const { admin_password } = req.body;

  if (admin_password !== process.env.ADMIN_PASSWORD) {
    return res.send("Incorrect admin password.");
  }

  await pool.query("DELETE FROM book WHERE id=$1", [id]);
  res.redirect("/books");
};
