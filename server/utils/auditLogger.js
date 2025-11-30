/**
 * Audit Logger Utility
 * Provides centralized audit logging functionality for tracking all critical operations
 */

/**
 * Log an audit event to the AuditLog table
 * 
 * @param {Object} connection - MySQL connection object
 * @param {Object} options - Audit log options
 * @param {string} options.logType - Type of log event (e.g., 'LOGIN', 'USER_CREATED', 'POINTS_UPDATED')
 * @param {number} [options.performedBy] - User ID of who performed the action
 * @param {number} [options.targetUser] - User ID of who was affected by the action
 * @param {number} [options.orgId] - Organization ID related to the action
 * @param {number} [options.transId] - Transaction ID if applicable
 * @param {string} [options.oldValue] - Previous value before change
 * @param {string} [options.newValue] - New value after change
 * @param {string} [options.ipAddress] - IP address of the requester
 * @param {Object} [options.details] - Additional details as JSON object
 * @returns {Promise<number>} - Returns the LOG_ID of the inserted audit log
 */
export async function logAudit(connection, options) {
  const {
    logType,
    performedBy = null,
    targetUser = null,
    orgId = null,
    transId = null,
    oldValue = null,
    newValue = null,
    ipAddress = null,
    details = null
  } = options;

  if (!logType) {
    throw new Error('logType is required for audit logging');
  }

  try {
    const [result] = await connection.execute(
      `INSERT INTO AuditLog 
       (LOG_TYPE, PERFORMED_BY_USER_ID, TARGET_USER_ID, ORG_ID, TRANS_ID, 
        OLD_VALUE, NEW_VALUE, IP_ADDRESS, DETAILS, LOG_DATE) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        logType,
        performedBy,
        targetUser,
        orgId,
        transId,
        oldValue,
        newValue,
        ipAddress,
        details ? JSON.stringify(details) : null
      ]
    );

    return result.insertId;
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - we don't want audit logging failures to break the main operation
    // But log the error for monitoring
    return null;
  }
}

/**
 * Audit Log Types - Standardized event types for consistency
 */
export const AuditLogTypes = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',

  // User Management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_EMAIL_CHANGED: 'USER_EMAIL_CHANGED',

  // Organization Management
  ORG_CREATED: 'ORG_CREATED',
  ORG_UPDATED: 'ORG_UPDATED',
  ORG_DELETED: 'ORG_DELETED',
  ORG_LEADER_CHANGED: 'ORG_LEADER_CHANGED',
  ORG_CATALOG_UPDATED: 'ORG_CATALOG_UPDATED',

  // Point Transactions
  POINTS_ADDED: 'POINTS_ADDED',
  POINTS_DEDUCTED: 'POINTS_DEDUCTED',
  POINTS_REDEEMED: 'POINTS_REDEEMED',

  // Point Rules
  POINT_RULE_CREATED: 'POINT_RULE_CREATED',
  POINT_RULE_UPDATED: 'POINT_RULE_UPDATED',
  POINT_RULE_DELETED: 'POINT_RULE_DELETED',

  // Driver Invitations
  INVITATION_SENT: 'INVITATION_SENT',
  INVITATION_ACCEPTED: 'INVITATION_ACCEPTED',
  INVITATION_USED: 'INVITATION_USED',

  // User-Organization Relationships
  USER_ADDED_TO_ORG: 'USER_ADDED_TO_ORG',
  USER_REMOVED_FROM_ORG: 'USER_REMOVED_FROM_ORG',

  // Bulk Operations
  BULK_UPLOAD_STARTED: 'BULK_UPLOAD_STARTED',
  BULK_UPLOAD_COMPLETED: 'BULK_UPLOAD_COMPLETED',
  BULK_UPLOAD_FAILED: 'BULK_UPLOAD_FAILED'
};

/**
 * Helper function to extract IP address from Express request
 * @param {Object} req - Express request object
 * @returns {string} - IP address
 */
export function getIpAddress(req) {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         null;
}

/**
 * Helper to create a standardized details object for user changes
 * @param {Object} changes - Object containing the changed fields
 * @returns {Object} - Formatted details object
 */
export function formatUserChangeDetails(changes) {
  return {
    changedFields: Object.keys(changes),
    timestamp: new Date().toISOString()
  };
}

