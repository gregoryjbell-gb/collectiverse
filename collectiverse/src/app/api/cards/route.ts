import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const { playerName, sportName, year, setName, manufacturer, cardNumber, teamName, parallel, rookie, autograph, relic, serialNumber, printRun, frontImageUrl, backImageUrl, funFacts, whyItMatters } = data;

  if (!playerName || !sportName || !year || !setName || !cardNumber) {
    return NextResponse.json({ error: 'playerName, sportName, year, setName, and cardNumber are required' }, { status: 400 });
  }

  // Find or create Sport
  let sport = await prisma.sport.findUnique({ where: { name: sportName } });
  if (!sport) {
    sport = await prisma.sport.create({ data: { name: sportName } });
  }

  // Find or create Person
  let person = await prisma.person.findFirst({ where: { displayName: { equals: playerName, mode: 'insensitive' } } });
  if (!person) {
    person = await prisma.person.create({ data: { displayName: playerName } });
    // Link person to sport
    await prisma.personSport.create({ data: { personId: person.id, sportId: sport.id } }).catch(() => {});
  }

  // Find or create CardSet
  let cardSet = await prisma.cardSet.findFirst({
    where: { name: { equals: setName, mode: 'insensitive' }, year: parseInt(year) },
  });
  if (!cardSet) {
    cardSet = await prisma.cardSet.create({
      data: { name: setName, year: parseInt(year), manufacturer: manufacturer || null, sportId: sport.id },
    });
  }

  // Find or create Team (optional)
  let teamId: string | null = null;
  if (teamName) {
    let team = await prisma.team.findFirst({ where: { name: { equals: teamName, mode: 'insensitive' } } });
    if (!team) {
      team = await prisma.team.create({ data: { name: teamName, sportId: sport.id } });
    }
    teamId = team.id;
  }

  // Check for duplicate: person + set + year + cardNumber + parallel
  const existing = await prisma.card.findFirst({
    where: {
      personId: person.id,
      setId: cardSet.id,
      year: parseInt(year),
      cardNumber: String(cardNumber),
      parallel: parallel || null,
    },
    include: {
      person: { select: { id: true, displayName: true } },
      team: { select: { id: true, name: true } },
      set: { select: { id: true, name: true, year: true, manufacturer: true, sport: { select: { name: true } } } },
    },
  });

  if (existing) {
    // Return existing card instead of creating duplicate
    return NextResponse.json({
      card: {
        cardId: existing.id,
        playerName: existing.person?.displayName || '',
        setName: existing.set?.name || '',
        manufacturer: existing.set?.manufacturer || '',
        year: existing.year,
        sport: existing.set?.sport?.name || '',
        teamName: existing.team?.name || '',
        cardNumber: existing.cardNumber,
        rookie: existing.rookie,
        autograph: existing.autograph,
        relic: existing.relic,
        parallel: existing.parallel,
        frontImageUrl: existing.frontImageUrl,
      },
      existing: true,
    });
  }

  // Create new Card
  const card = await prisma.card.create({
    data: {
      personId: person.id,
      setId: cardSet.id,
      teamId,
      year: parseInt(year),
      cardNumber: String(cardNumber),
      parallel: parallel || null,
      rookie: rookie || false,
      autograph: autograph || false,
      relic: relic || false,
      serialNumber: serialNumber || null,
      printRun: printRun ? parseInt(printRun) : null,
      frontImageUrl: frontImageUrl || null,
      backImageUrl: backImageUrl || null,
      funFacts: funFacts || [],
      whyItMatters: whyItMatters || null,
    },
    include: {
      person: { select: { id: true, displayName: true } },
      team: { select: { id: true, name: true } },
      set: { select: { id: true, name: true, year: true, manufacturer: true, sport: { select: { name: true } } } },
    },
  });

  return NextResponse.json({
    card: {
      cardId: card.id,
      playerName: card.person?.displayName || '',
      setName: card.set?.name || '',
      manufacturer: card.set?.manufacturer || '',
      year: card.year,
      sport: card.set?.sport?.name || '',
      teamName: card.team?.name || '',
      cardNumber: card.cardNumber,
      rookie: card.rookie,
      autograph: card.autograph,
      relic: card.relic,
      parallel: card.parallel,
      frontImageUrl: card.frontImageUrl,
    },
    existing: false,
  }, { status: 201 });
}
