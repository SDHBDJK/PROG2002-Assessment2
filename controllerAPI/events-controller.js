const express = require('express');
const router = express.Router();
const { pool } = require('../event_db');

// tool：concat where clause
function buildWhere({ upcomingOnly = true, notSuspended = true }) {
  const where = [];
  const params = [];

  if (upcomingOnly) {
    // end date time >= current date time
    where.push('e.end_datetime >= NOW()');
  }
  if (notSuspended) {
    where.push('e.is_suspended = 0');
  }
  return { where, params };
}

// GET /api/events
router.get('/', (req, res) => {
  const { where, params } = buildWhere({
    upcomingOnly: false,
    notSuspended: true
  });

  const sql = `
    SELECT 
      e.id, e.name, e.short_description, e.city, e.state_region, e.postcode,
      e.venue_name, e.start_datetime, e.end_datetime, e.image_url, e.goal_amount,
      c.id AS category_id, c.name AS category_name,
      o.id AS organisation_id, o.name AS organisation_name
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN organisations o ON e.organisation_id = o.id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY e.start_datetime ASC, e.id ASC
  `;

  pool.query(sql, params, (err, rows) => {
    if (err) return res.status(500).send({ error: 'query failed' });
    res.send(rows);
  });
});

module.exports = router;
