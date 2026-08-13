import AuditLog from '../models/AuditLog';

export const logAuditAction = async (
  organizationId: string,
  userId: string,
  action: string,
  resource: string,
  metadata?: any
) => {
  try {
    await AuditLog.create({
      organizationId,
      userId,
      action,
      resource,
      metadata
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
};
