import express from 'express';
import pool from '../db.js';
import nodemailer from 'nodemailer';

const router = express.Router();

router.get('/notifications/my', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT NOTIF_ID, USER_ID, NOTIF_TYPE, NOTIF_CONTENT FROM Notifications WHERE USER_ID = ? ORDER BY NOTIF_ID DESC',
      [userId]
    );
    connection.release();
    return res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
});


router.post('/notifications/send', async (req, res) => {
  // Accepts either:
  // - { notif_id: number, recipients: { type: 'user'|'org'|'users'|'all', user_id?, org_id?, user_ids? } }
  // - { notif_type, notif_content, recipients: ... } for a one-off custom send
  const { notif_id, NOTIF_TYPE, NOTIF_CONTENT, notif_type, notif_content, recipients } = req.body;

  let type = NOTIF_TYPE || notif_type || null;
  let content = NOTIF_CONTENT || notif_content || null;
  let notifId = null;

  try {
    const connection = await pool.getConnection();

    // If notif_id provided, load it
    if (notif_id) {
      const [rows] = await connection.execute(
        'SELECT NOTIF_ID, NOTIF_TYPE, NOTIF_CONTENT FROM Notifications WHERE NOTIF_ID = ?',
        [notif_id]
      );
      if (!rows || rows.length === 0) {
        connection.release();
        return res.status(404).json({ status: 'error', message: 'Notification type not found' });
      }
      notifId = rows[0].NOTIF_ID;
      type = rows[0].NOTIF_TYPE;
      content = rows[0].NOTIF_CONTENT;
    } else if (type && content) {
      // Custom send: do not create a Notifications entry unless desired
      notifId = null;
    } else {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Either notif_id or notif_type + notif_content required' });
    }

    // Determine recipients -> normalize to array of USER_IDs
    let userIds = [];
    if (!recipients) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Recipients required' });
    }

    if (recipients === 'all' || (recipients && recipients.type === 'all')) {
      const [allUsers] = await connection.query('SELECT USER_ID FROM Users');
      userIds = allUsers.map(u => u.USER_ID);
    } else if (recipients.type === 'user' && recipients.user_id) {
      // validate user exists
      const [userRows] = await connection.execute('SELECT USER_ID FROM Users WHERE USER_ID = ?', [recipients.user_id]);
      if (!userRows || userRows.length === 0) {
        connection.release();
        return res.status(404).json({ status: 'error', message: 'Recipient user not found' });
      }
      userIds = [userRows[0].USER_ID];
    } else if (recipients.type === 'org' && recipients.org_id) {
      // Organization-based sending: select users by ORG_ID
      const [orgUsers] = await connection.execute('SELECT USER_ID FROM Users WHERE ORG_ID = ?', [recipients.org_id]);
      userIds = orgUsers.map(u => u.USER_ID);
    } else if (recipients.type === 'users' && Array.isArray(recipients.user_ids)) {
      userIds = recipients.user_ids.map(id => Number(id)).filter(n => !isNaN(n));
    } else {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Invalid recipients format' });
    }

    if (userIds.length === 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'No recipients found' });
    }

    // Insert into Notifications for each recipient
    const insertValues = userIds.map(uid => [notifId, uid, type, content]);
    const placeholders = insertValues.map(() => '(?, ?, ?, ?)').join(', ');
    const flatValues = insertValues.flat();

    await connection.query(
      `INSERT INTO Notifications (NOTIF_ID, USER_ID, NOTIF_TYPE, NOTIF_CONTENT) VALUES ${placeholders}`,
      flatValues
    );

    // Send emails to recipients
    try {
      // Get user emails
      const emailPlaceholders = userIds.map(() => '?').join(', ');
      const [userEmails] = await connection.query(
        `SELECT USER_ID, EMAIL, F_NAME, L_NAME FROM Users WHERE USER_ID IN (${emailPlaceholders})`,
        userIds
      );

      // Configure email transporter
      const transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY
        }
      });

      // Send email to each recipient
      const emailPromises = userEmails.map(user => {
        return transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.EMAIL,
          subject: `Notification: ${type}`,
          html: `
            <h2>New Notification</h2>
            <p>Hello ${user.F_NAME || 'User'},</p>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Message:</strong> ${content}</p>
            <br>
            <p style="color: #666; font-size: 12px;">This is an automated notification from the system.</p>
          `
        });
      });

      await Promise.all(emailPromises);
      console.log(`Sent ${emailPromises.length} notification emails`);
    } catch (emailErr) {
      console.error('Error sending notification emails:', emailErr);
      // Don't fail the request if emails fail - notifications are already saved
    }

    connection.release();
    res.json({ status: 'success', message: 'Notification sent', notifId, recipients: userIds.length });
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred', error: err.message });
  }
});

export default router;
