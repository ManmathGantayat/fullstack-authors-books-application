const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

function connectWithRetry() {
  db.connect((err) => {
    if (err) {
      console.error("❌  MySQL not ready, retrying in 5s...");
      setTimeout(connectWithRetry, 5000);
      return;
    }
    console.log("✅  MySQL connected successfully");
  });
}

connectWithRetry();

module.exports = db;
