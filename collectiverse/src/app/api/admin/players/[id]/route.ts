import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const { personTeams, ...personData } = data;

  // Update person fields
  const allowedFields = ['displayName', 'biography', 'achievements', 'hallOfFame', 'aliases', 'funFacts', 'whyCollectorsCare', 'imageUrl'];
  const updateData: any = {};
  for (const field of allowedFields) {
    if (personData[field] !== undefined) {
      updateData[field] = personData[field];
    }
  }

  const person = await prisma.person.update({ where: { id: params.id }, data: updateData });

  // Handle personTeams if provided
  if (personTeams !== undefined) {
    // Delete existing team associations
    await prisma.personTeam.deleteMany({ where: { personId: params.id } });

    // Also update personSports based on teams
    await prisma.personSport.deleteMany({ where: { personId: params.id } });

    const sportIds = new Set<string>();

    // Create new team associations
    for (const entry of personTeams) {
      if (!entry.teamId) continue;

      await prisma.personTeam.create({
        data: {
          personId: params.id,
          teamId: entry.teamId,
          startYear: entry.startYear || null,
          endYear: entry.endYear || null,
        },
      });

      // Track sports from teams
      const team = await prisma.team.findUnique({ where: { id: entry.teamId }, select: { sportId: true } });
      if (team) sportIds.add(team.sportId);
    }

    // Recreate personSports
    const uniqueSportIds = Array.from(sportIds);
    for (let i = 0; i < uniqueSportIds.length; i++) {
      await prisma.personSport.create({
        data: { personId: params.id, sportId: uniqueSportIds[i] },
      });
    }
  }

  return NextResponse.json({ person });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.person.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
