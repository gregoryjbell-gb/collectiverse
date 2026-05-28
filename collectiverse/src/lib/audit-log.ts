import { prisma } from './prisma';
import { NextRequest } from 'next/server';

export type AuditEntityType = 'INVENTORY_ITEM' | 'INVENTORY_GROUP' | 'LISTING' | 'TRANSFER' | 'CARD' | 'CARD_SET' | 'USER';
export type AuditAction = 'CREATED' | 'UPDATED' | 'DELETED' | 'LISTED' | 'SOLD' | 'TRANSFER_INITIATED' | 'TRANSFER_ACCEPTED' | 'TRANSFER_DECLINED' | 'MEDIA_UPLOADED' | 'STATUS_CHANGED';

interface CreateAuditLogParams {
  actorUserId: string;
  targetUserId?: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  before?: any;
  after?: any;
  notes?: string;
  request?: NextRequest;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  const { actorUserId, targetUserId, entityType, entityId, action, before, after, notes, request } = params;

  try {
    await (prisma as any).auditLog.create({
      data: {
        actorUserId,
        targetUserId: targetUserId || null,
        entityType,
        entityId,
        action,
        beforeJson: before ? JSON.stringify(before) : null,
        afterJson: after ? JSON.stringify(after) : null,
        ipAddress: request?.headers.get('x-forwarded-for') || request?.ip || null,
        userAgent: request?.headers.get('user-agent') || null,
        notes: notes || null,
      },
    });
  } catch {
    // Audit logging should never break the main flow
    console.error('Failed to create audit log');
  }
}
