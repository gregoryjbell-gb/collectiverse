import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const ticketType = searchParams.get('ticketType');
  const eventType = searchParams.get('eventType');

  const where: any = {};
  if (q) where.OR = [{ eventName: { contains: q, mode: 'insensitive' } }, { venue: { contains: q, mode: 'insensitive' } }, { team: { contains: q, mode: 'insensitive' } }, { performer: { contains: q, mode: 'insensitive' } }];
  if (ticketType) where.ticketType = ticketType;
  if (eventType) where.eventType = eventType;

  const tickets = await (prisma as any).ticketCollectible.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { ticketType, eventName, eventType, eventDate, venue, city, state, country, performer, team, opponent, section, row, seat, ticketNumber, signed, authenticationCompany, authenticationCertNumber, notableEvent, notableEventNotes } = body;
  if (!ticketType || !eventName || !eventType) return NextResponse.json({ error: 'ticketType, eventName, eventType required' }, { status: 400 });

  const title = team && opponent ? `${team} vs ${opponent} ${ticketType.replace(/_/g, ' ')}` : `${eventName} ${ticketType.replace(/_/g, ' ')}`;
  const subtitle = [venue, eventDate ? new Date(eventDate).toLocaleDateString() : null].filter(Boolean).join(' — ') || null;
  const year = eventDate ? new Date(eventDate).getFullYear() : null;

  const collectible = await (prisma as any).collectible.create({
    data: { collectibleType: 'TICKET', title, subtitle, year, franchise: team || performer || null, status: 'ACTIVE' },
  });

  const ticket = await (prisma as any).ticketCollectible.create({
    data: {
      collectibleId: collectible.id, ticketType, eventName, eventType,
      eventDate: eventDate ? new Date(eventDate) : null, venue: venue || null, city: city || null, state: state || null, country: country || null,
      performer: performer || null, team: team || null, opponent: opponent || null,
      section: section || null, row: row || null, seat: seat || null, ticketNumber: ticketNumber || null,
      signed: signed || false, authenticationCompany: authenticationCompany || null, authenticationCertNumber: authenticationCertNumber || null,
      notableEvent: notableEvent || false, notableEventNotes: notableEventNotes || null,
    },
  });

  return NextResponse.json({ ticket, collectible }, { status: 201 });
}
