const express = require('express');
const router = express.Router();
const { pool } = require('../event_db');

router.get('/:id', (req, res) => {
  const sql = 'SELECT id, name, mission_text, contact_email, contact_phone, website_url, is_activeFROM organisationsWHERE id = ?LIMIT 1';
  pool.query(sql, [Number(req.params.id)], (err, rows) => {
    if (err) return res.status(500).send({ error: 'query failed' });
    if (!rows || rows.length === 0) return res.status(404).send({ error: 'not found' });
    res.send(rows[0]);
  });
});

module.exports = router;
