const mysql = require('mysql2');

const cfg = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'charityevents_db',
  dateStrings: true
};

// use pool
const pool = mysql.createPool(cfg);

module.exports = {
  getConnection: () => pool.getConnection((err, conn) => {
    if (err) throw err;
    return conn;
  }),
  pool
};
