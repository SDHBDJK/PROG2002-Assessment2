const express = require('express');
const router = express.Router();
const { pool } = require('../event_db');

router.get('/', (req, res) => {
  const sql = `
    SELECT id, name, description 
    FROM categories 
    WHERE is_active = 1
    ORDER BY name ASC
  `;
  pool.query(sql, [], (err, rows) => {
    if (err) return res.status(500).send({ error: 'query failed' });
    res.send(rows);
  });
});

module.exports = router;
