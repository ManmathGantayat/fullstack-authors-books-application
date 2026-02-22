const db = require('../configs/db');

function BooksController() { }

const getQuery = `
SELECT 
  b.id as id,
  b.title as title,
  b.releaseDate as releaseDate,
  b.description as description,
  b.pages as pages,
  b.createdAt as createdAt,
  b.updatedAt as updatedAt,
  a.id as authorId,
  a.name as name,
  a.birthday as birthday,
  a.bio as bio
FROM book b
INNER JOIN author a ON b.authorId = a.id
`;

BooksController.prototype.get = async (req, res) => {
  db.query(getQuery, (err, books) => {
    if (err) {
      console.error("GET books error:", err);
      return res.status(500).json({
        message: "Error executing query.",
      });
    }

    return res.status(200).json({
      books: books || [],
    });
  });
};

BooksController.prototype.create = async (req, res) => {
  const {
    title,
    description,
    releaseDate,
    pages,
    author: authorId,
  } = req.body;

  db.query(
    'INSERT INTO book (title, releaseDate, description, pages, authorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, new Date(releaseDate), description, pages, authorId, new Date(), new Date()],
    (err) => {
      if (err) {
        console.error("CREATE book error:", err);
        return res.status(500).json({
          message: "Error executing query.",
        });
      }

      db.query(getQuery, (err, books) => {
        if (err) {
          console.error("FETCH books after create error:", err);
          return res.status(500).json({
            message: "Error executing query.",
          });
        }

        return res.status(200).json({
          message: "Book created successfully!",
          books: books || [],
        });
      });
    }
  );
};

BooksController.prototype.update = async (req, res) => {
  const bookId = req.params.id;
  const {
    title,
    description,
    releaseDate,
    pages,
    author: authorId,
  } = req.body;

  db.query(
    'UPDATE book SET title = ?, releaseDate = ?, description = ?, pages = ?, authorId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [title, new Date(releaseDate), description, pages, authorId, bookId],
    (err) => {
      if (err) {
        console.error("UPDATE book error:", err);
        return res.status(500).json({
          message: "Error executing query.",
        });
      }

      db.query(getQuery, (err, books) => {
        if (err) {
          console.error("FETCH books after update error:", err);
          return res.status(500).json({
            message: "Error executing query.",
          });
        }

        return res.status(200).json({
          message: "Book updated successfully!",
          books: books || [],
        });
      });
    }
  );
};

BooksController.prototype.delete = async (req, res) => {
  const bookId = req.params.id;

  db.query('DELETE FROM book WHERE id = ?', [bookId], (err) => {
    if (err) {
      console.error("DELETE book error:", err);
      return res.status(500).json({
        message: "Error executing query.",
      });
    }

    db.query(getQuery, (err, books) => {
      if (err) {
        console.error("FETCH books after delete error:", err);
        return res.status(500).json({
          message: "Error executing query.",
        });
      }

      return res.status(200).json({
        message: "Book deleted successfully!",
        books: books || [],
      });
    });
  });
};

module.exports = new BooksController();
