import { prisma } from './prisma';

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  try {
    await (prisma as any).notification.create({ data: params });
  } catch {
    console.error('Failed to create notification');
  }
}
