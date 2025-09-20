-- Drop old tables if needed
DROP TABLE IF EXISTS book_genre;
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS genre;

-- Genres table
CREATE TABLE genre (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Books table
CREATE TABLE book (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(100),
  description TEXT,
  price NUMERIC(10,2),
  stock_quantity INT DEFAULT 0
);

-- Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS book_genre (
  book_id INT REFERENCES book(id) ON DELETE CASCADE,
  genre_id INT REFERENCES genre(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, genre_id)
);
