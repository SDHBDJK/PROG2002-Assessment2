const express = require('express');
const router = express.Router();
const { pool } = require('../event_db');

// tool: concat where clause
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
    if (err) {
      return res.status(500).send({ error: 'query failed' });
    }
    res.send(rows);
  });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);

  const sqlEvent = `
    SELECT 
      e.*, 
      c.name AS category_name, 
      o.name AS organisation_name, o.mission_text, o.contact_email, o.contact_phone, o.website_url
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN organisations o ON e.organisation_id = o.id
    WHERE e.id = ?
    LIMIT 1
  `;

  const sqlRegStats = `
    SELECT 
      COUNT(*) AS reg_count,
      COALESCE(SUM(r.quantity), 0) AS total_qty,
      COALESCE(SUM(r.amount), 0.00) AS total_amount
    FROM registrations r
    WHERE r.event_id = ?
      AND r.status <> 'cancelled'
  `;

  pool.query(sqlEvent, [id], (err, rows) => {
    if (err) {
      return res.status(500).send({ error: 'query failed' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).send({ error: 'not found' });
    }

    const event = rows[0];

    pool.query(sqlRegStats, [id], (err2, statsRows) => {
      if (err2) {
        return res.status(500).send({ error: 'stats query failed' });
      }
      const stats = statsRows && statsRows[0] ? statsRows[0] : { reg_count: 0, total_qty: 0, total_amount: 0.0 };

      res.send({
        ...event,
        registration_stats: stats,
        progress: {
          goal_amount: Number(event.goal_amount || 0),
          raised_amount: Number(stats.total_amount || 0),
          percent: Math.min(100, Math.round((Number(stats.total_amount || 0) / event.goal_amount) * 100))
        }
      });
    });
  });
});

router.post('/search', (req, res) => {
  const { date, location, category_id } = req.body;

  const where = ['e.is_suspended = 0'];
  const params = [];

  if (date) {
    where.push('(e.start_datetime <= ? AND e.end_datetime >= ?)');
    params.push(`${date} 23:59:59`, `${date} 00:00:00`);
  }

  if (location) {
    where.push('(e.city LIKE ? OR e.state_region LIKE ? OR e.postcode LIKE ?)');
    const like = `%${location}%`;
    params.push(like, like, like);
  }

  if (category_id) {
    where.push('e.category_id = ?');
    params.push(Number(category_id));
  }

  const sql = `
    SELECT 
      e.id, e.name, e.short_description, e.city, e.state_region, e.postcode,
      e.venue_name, e.start_datetime, e.end_datetime, e.image_url, e.goal_amount,
      c.id AS category_id, c.name AS category_name,
      o.id AS organisation_id, o.name AS organisation_name
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN organisations o ON e.organisation_id = o.id
    WHERE ${where.join(' AND ')}
    ORDER BY e.start_datetime ASC, e.id ASC
  `;

  console.log(sql);

  pool.query(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).send({ error: 'query failed' });
    }
    res.send(rows);
  });
});

module.exports = router;
