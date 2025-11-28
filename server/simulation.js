import pool from './db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

let intervalHandle = null;

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// adjust points for a random driver membership
async function adjustRandomPoints(connection) {
  const [rows] = await connection.execute(`
    SELECT u.USER_ID, uo.ORG_ID, COALESCE(uo.POINT_TOTAL,0) AS POINT_TOTAL
    FROM Users u
    JOIN UserOrganizations uo ON u.USER_ID = uo.USER_ID
    WHERE u.USER_TYPE = 'driver'
  `);

  if (rows.length === 0) return false;
  const r = pick(rows);
  const delta = randInt(-20, 100); // configurable magnitude
  const newTotal = Math.max(0, Number(r.POINT_TOTAL || 0) + delta);

  await connection.execute(
    'UPDATE UserOrganizations SET POINT_TOTAL = ? WHERE USER_ID = ? AND ORG_ID = ?',
    [newTotal, r.USER_ID, r.ORG_ID]
  );
  console.log(`Simulation: adjusted points for USER_ID=${r.USER_ID} ORG_ID=${r.ORG_ID} by ${delta} -> ${newTotal}`);
  return true;
}

// assign an existing unassigned driver or create+assign one
async function assignUnassignedDriver(connection) {
  const [unassigned] = await connection.execute(`
    SELECT u.USER_ID, u.EMAIL FROM Users u
    WHERE u.USER_TYPE = 'driver' AND NOT EXISTS (SELECT 1 FROM UserOrganizations uo WHERE uo.USER_ID = u.USER_ID)
    LIMIT 1
  `);

  const [orgs] = await connection.execute('SELECT ORG_ID FROM Organizations');
  if (orgs.length === 0) return false;

  const org = pick(orgs);
  let userId;

  if (unassigned.length > 0) {
    userId = unassigned[0].USER_ID;

    const [existsRows] = await connection.execute(
      'SELECT 1 FROM UserOrganizations WHERE USER_ID = ? AND ORG_ID = ?',
      [userId, org.ORG_ID]
    );
    if (existsRows.length > 0) {
      console.log(`Simulation: USER_ID=${userId} already member of ORG_ID=${org.ORG_ID}, skipping assign`);
      return false;
    }

    await connection.execute(
      'INSERT IGNORE INTO UserOrganizations (USER_ID, ORG_ID, POINT_TOTAL) VALUES (?, ?, ?)',
      [userId, org.ORG_ID, 0]
    );
    console.log(`Simulation: assigned existing USER_ID=${userId} to ORG_ID=${org.ORG_ID}`);
    return true;
  }

  // fallback: create new driver and assign
  try {
    await connection.beginTransaction();

    const [maxUserRows] = await connection.query('SELECT MAX(USER_ID) AS maxId FROM Users FOR UPDATE');
    const nextUserId = ((maxUserRows[0] && maxUserRows[0].maxId) || 0) + 1;
    const email = `sim_driver_${nextUserId}@example.com`;
    const username = `sim_driver_${nextUserId}`;
    const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

    await connection.execute(
      'INSERT INTO Users (USER_ID, USERNAME, EMAIL, F_NAME, L_NAME, PASSWORD, USER_TYPE) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nextUserId, username, email, 'Sim', 'Driver', hashedPassword, 'driver']
    );

    await connection.execute(
      'INSERT IGNORE INTO UserOrganizations (USER_ID, ORG_ID, POINT_TOTAL) VALUES (?, ?, ?)',
      [nextUserId, org.ORG_ID, 0]
    );

    await connection.commit();
    console.log(`Simulation: created new driver USER_ID=${nextUserId} and assigned to ORG_ID=${org.ORG_ID}`);
    return true;
  } catch (err) {
    console.error('Simulation assign/create error, rolling back:', err);
    try { await connection.rollback(); } catch (e) { /* ignore */ }
    return false;
  }
}

// create a random account (driver or sponsor) and optionally assign to an org
async function createRandomAccount(connection, options = {}) {
  // options.assignProbability: probability [0..1] to attempt assignment to an org
  // options.forceType: 'driver'|'sponsor' to force type
  const assignProb = typeof options.assignProbability === 'number' ? options.assignProbability : 0.6;
  const forceType = options.forceType || null;

  try {
    await connection.beginTransaction();

    // compute next USER_ID safely
    const [maxUserRows] = await connection.query('SELECT MAX(USER_ID) AS maxId FROM Users FOR UPDATE');
    const nextUserId = ((maxUserRows[0] && maxUserRows[0].maxId) || 0) + 1;

    const isDriver = forceType ? (forceType === 'driver') : (Math.random() < 0.8); // mostly drivers
    const userTypeDb = isDriver ? 'driver' : 'sponsor';

    const username = `sim_sim${nextUserId}`;
    const email = `sim_${userTypeDb}_${nextUserId}@example.com`;
    const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

    await connection.execute(
      'INSERT INTO Users (USER_ID, USERNAME, EMAIL, F_NAME, L_NAME, PASSWORD, USER_TYPE) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nextUserId, username, email, 'Sim', isDriver ? 'Driver' : 'Sponsor', hashedPassword, userTypeDb]
    );

    let assigned = false;
    const [orgs] = await connection.execute('SELECT ORG_ID FROM Organizations');
    if (orgs.length > 0 && Math.random() < assignProb) {
      const org = pick(orgs);
      // safe insert membership (INSERT IGNORE to avoid duplicates)
      await connection.execute(
        'INSERT IGNORE INTO UserOrganizations (USER_ID, ORG_ID, POINT_TOTAL) VALUES (?, ?, ?)',
        [nextUserId, org.ORG_ID, 0]
      );
      assigned = true;
    }

    await connection.commit();
    console.log(`Simulation: created account USER_ID=${nextUserId} type=${userTypeDb}${assigned ? ' (assigned to org)' : ''}`);
    return true;
  } catch (err) {
    console.error('Simulation createRandomAccount error, rolling back:', err);
    try { await connection.rollback(); } catch (e) { /* ignore */ }
    return false;
  }
}

async function tick() {
  const connection = await pool.getConnection();
  try {
    // Weighted probabilities:
    //  - 70% adjust points
    //  - 20% assign unassigned driver (or create+assign)
    //  - 10% create a random account
    const p = Math.random();
    if (p < 0.7) {
      await adjustRandomPoints(connection);
    } else if (p < 0.9) {
      await assignUnassignedDriver(connection);
    } else {
      await createRandomAccount(connection);
    }
  } catch (err) {
    console.error('Simulation tick error:', err);
  } finally {
    connection.release();
  }
}

export default function startSimulation(opts = {}) {
  const intervalMs = Number(process.env.SIM_INTERVAL_MS || opts.intervalMs || 60000); // default 60s
  if (intervalHandle) {
    console.log('Simulation already running');
    return;
  }
  console.log(`Starting simulation: interval=${intervalMs}ms`);
  // run immediately then on interval
  tick();
  intervalHandle = setInterval(tick, intervalMs);
}

export function stopSimulation() {
  if (!intervalHandle) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
  console.log('Simulation stopped');
}