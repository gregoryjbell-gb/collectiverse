import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin
  const passwordHash = bcrypt.hashSync('admin123', 10);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash },
  });

  // Sports
  const nfl = await prisma.sport.upsert({ where: { name: 'NFL' }, update: {}, create: { name: 'NFL', league: 'National Football League' } });
  const mlb = await prisma.sport.upsert({ where: { name: 'MLB' }, update: {}, create: { name: 'MLB', league: 'Major League Baseball' } });
  const nba = await prisma.sport.upsert({ where: { name: 'NBA' }, update: {}, create: { name: 'NBA', league: 'National Basketball Association' } });

  // Teams
  const bills = await prisma.team.create({ data: { name: 'Buffalo Bills', sportId: nfl.id, city: 'Buffalo', colors: ['#00338D', '#C60C30'] } });
  const raiders = await prisma.team.create({ data: { name: 'Los Angeles Raiders', sportId: nfl.id, city: 'Los Angeles', colors: ['#000000', '#A5ACAF'] } });
  const royals = await prisma.team.create({ data: { name: 'Kansas City Royals', sportId: mlb.id, city: 'Kansas City', colors: ['#004687', '#BD9B60'] } });
  const bulls = await prisma.team.create({ data: { name: 'Chicago Bulls', sportId: nba.id, city: 'Chicago', colors: ['#CE1141', '#000000'] } });
  const cowboys = await prisma.team.create({ data: { name: 'Dallas Cowboys', sportId: nfl.id, city: 'Dallas', colors: ['#003594', '#869397'] } });

  // Persons
  const jimKelly = await prisma.person.create({
    data: {
      displayName: 'Jim Kelly',
      biography: 'Hall of Fame quarterback who led the Buffalo Bills to four consecutive Super Bowl appearances (1991-1994). Known for his toughness, leadership, and the K-Gun no-huddle offense.',
      achievements: ['Pro Football Hall of Fame', '4x Super Bowl Appearances', '5x Pro Bowl', 'Bills All-Time Passing Leader'],
      hallOfFame: true,
      personTeams: { create: { teamId: bills.id, startYear: 1986, endYear: 1996 } },
      personSports: { create: { sportId: nfl.id } },
    },
  });

  const joshAllen = await prisma.person.create({
    data: {
      displayName: 'Josh Allen',
      biography: 'Dynamic dual-threat quarterback for the Buffalo Bills. Known for his cannon arm, rushing ability, and highlight-reel hurdles. Emerging as one of the NFL\'s elite QBs.',
      achievements: ['2x Pro Bowl', 'Bills Single-Season TD Record', 'Pro Bowl MVP 2022'],
      hallOfFame: false,
      personTeams: { create: { teamId: bills.id, startYear: 2018 } },
      personSports: { create: { sportId: nfl.id } },
    },
  });

  const thurmanThomas = await prisma.person.create({
    data: {
      displayName: 'Thurman Thomas',
      biography: 'Hall of Fame running back who was the heart of the Bills\' offense during their Super Bowl dynasty. NFL MVP in 1991 and one of the most versatile backs in history.',
      achievements: ['Pro Football Hall of Fame', 'NFL MVP 1991', '5x Pro Bowl', '4x Super Bowl Appearances'],
      hallOfFame: true,
      personTeams: { create: { teamId: bills.id, startYear: 1988, endYear: 1999 } },
      personSports: { create: { sportId: nfl.id } },
    },
  });

  const boJackson = await prisma.person.create({
    data: {
      displayName: 'Bo Jackson',
      biography: 'The greatest two-sport athlete in history. Heisman Trophy winner who starred in both the NFL and MLB. His Nike "Bo Knows" campaign made him a cultural icon.',
      achievements: ['Heisman Trophy', 'MLB All-Star', 'NFL Pro Bowl', 'Bo Knows Campaign'],
      hallOfFame: false,
      personTeams: {
        create: [
          { teamId: raiders.id, startYear: 1987, endYear: 1990 },
          { teamId: royals.id, startYear: 1986, endYear: 1990 },
        ],
      },
      personSports: { create: [{ sportId: nfl.id }, { sportId: mlb.id }] },
    },
  });

  const michaelJordan = await prisma.person.create({
    data: {
      displayName: 'Michael Jordan',
      biography: 'Widely considered the greatest basketball player of all time. Six NBA championships, five MVPs, and a global cultural icon who transcended sports.',
      achievements: ['6x NBA Champion', '5x NBA MVP', '6x Finals MVP', '14x All-Star', 'Basketball Hall of Fame'],
      hallOfFame: true,
      personTeams: { create: { teamId: bulls.id, startYear: 1984, endYear: 1998 } },
      personSports: { create: { sportId: nba.id } },
    },
  });

  // Card Sets
  const score1990 = await prisma.cardSet.create({ data: { name: '1990 Score', year: 1990, manufacturer: 'Score', sportId: nfl.id } });
  const proSet1989 = await prisma.cardSet.create({ data: { name: '1989 Pro Set', year: 1989, manufacturer: 'Pro Set', sportId: nfl.id } });
  const topps1986 = await prisma.cardSet.create({ data: { name: '1986 Topps', year: 1986, manufacturer: 'Topps', sportId: nfl.id } });
  const prizm2024 = await prisma.cardSet.create({ data: { name: '2024 Prizm', year: 2024, manufacturer: 'Panini', sportId: nfl.id } });
  const fleer1986 = await prisma.cardSet.create({ data: { name: '1986 Fleer', year: 1986, manufacturer: 'Fleer', sportId: nba.id } });
  const boSet1990 = await prisma.cardSet.create({ data: { name: '1990 Score', year: 1990, manufacturer: 'Score', sportId: mlb.id } });

  // Cards (25 sample cards)
  const cardData = [
    { personId: jimKelly.id, setId: topps1986.id, teamId: bills.id, year: 1986, cardNumber: '187', rookie: true, estimatedValue: 150, status: 'hold', whyItMatters: 'Jim Kelly\'s rookie card from the iconic 1986 Topps set. A cornerstone of any Bills collection.', funFacts: ['Kelly was drafted in 1983 but played in the USFL until 1986', 'This card features his classic Bills uniform'] },
    { personId: jimKelly.id, setId: score1990.id, teamId: bills.id, year: 1990, cardNumber: '50', estimatedValue: 5, status: 'hold', whyItMatters: 'A clean base card from the peak of Kelly\'s career during the Bills dynasty years.' },
    { personId: jimKelly.id, setId: proSet1989.id, teamId: bills.id, year: 1989, cardNumber: '22', estimatedValue: 3, status: 'sell' },
    { personId: joshAllen.id, setId: prizm2024.id, teamId: bills.id, year: 2024, cardNumber: '15', parallel: 'Silver Prizm', estimatedValue: 85, status: 'hold', whyItMatters: 'Josh Allen Silver Prizm — the modern chase card for Bills collectors.' },
    { personId: joshAllen.id, setId: prizm2024.id, teamId: bills.id, year: 2024, cardNumber: '15', parallel: 'Red White Blue', estimatedValue: 45, status: 'hold' },
    { personId: joshAllen.id, setId: prizm2024.id, teamId: bills.id, year: 2024, cardNumber: '15', estimatedValue: 12, status: 'hold' },
    { personId: joshAllen.id, setId: score1990.id, teamId: bills.id, year: 2020, cardNumber: '1', autograph: true, serialNumber: '25/50', printRun: 50, estimatedValue: 500, status: 'vault', whyItMatters: 'A rare on-card autograph with limited print run. Premium Josh Allen investment piece.' },
    { personId: thurmanThomas.id, setId: topps1986.id, teamId: bills.id, year: 1988, cardNumber: '169', rookie: true, estimatedValue: 45, status: 'hold', whyItMatters: 'Thurman Thomas rookie card. The engine of the K-Gun offense.' },
    { personId: thurmanThomas.id, setId: score1990.id, teamId: bills.id, year: 1990, cardNumber: '200', estimatedValue: 3, status: 'hold' },
    { personId: thurmanThomas.id, setId: proSet1989.id, teamId: bills.id, year: 1989, cardNumber: '32', estimatedValue: 4, status: 'sell' },
    { personId: thurmanThomas.id, setId: score1990.id, teamId: bills.id, year: 1991, cardNumber: '1', estimatedValue: 8, status: 'hold', whyItMatters: 'MVP season card. Thomas was the best all-purpose back in football in 1991.' },
    { personId: boJackson.id, setId: score1990.id, teamId: raiders.id, year: 1990, cardNumber: '332', estimatedValue: 12, status: 'hold', whyItMatters: 'Bo Jackson in Raiders silver and black. The two-sport legend at his NFL peak.' },
    { personId: boJackson.id, setId: boSet1990.id, teamId: royals.id, year: 1990, cardNumber: '697', estimatedValue: 8, status: 'hold', funFacts: ['Bo hit a 450-foot home run in the 1989 All-Star Game'] },
    { personId: boJackson.id, setId: topps1986.id, teamId: raiders.id, year: 1987, cardNumber: '327', rookie: true, estimatedValue: 75, status: 'vault', whyItMatters: 'Bo Jackson NFL rookie card. One of the most iconic cards of the late 1980s.' },
    { personId: boJackson.id, setId: score1990.id, teamId: royals.id, year: 1990, cardNumber: '1', estimatedValue: 15, status: 'hold' },
    { personId: michaelJordan.id, setId: fleer1986.id, teamId: bulls.id, year: 1986, cardNumber: '57', rookie: true, estimatedValue: 25000, status: 'vault', whyItMatters: 'The holy grail of modern basketball cards. The 1986 Fleer Michael Jordan rookie is the most iconic sports card of the modern era.', funFacts: ['A PSA 10 sold for $840,000 in 2023', 'Only 316 PSA 10s exist'] },
    { personId: michaelJordan.id, setId: fleer1986.id, teamId: bulls.id, year: 1986, cardNumber: '8', estimatedValue: 200, status: 'hold', whyItMatters: 'Jordan sticker from the 1986 Fleer set. Often overlooked but highly collectible.' },
    { personId: michaelJordan.id, setId: fleer1986.id, teamId: bulls.id, year: 1987, cardNumber: '59', estimatedValue: 80, status: 'hold' },
    { personId: michaelJordan.id, setId: fleer1986.id, teamId: bulls.id, year: 1988, cardNumber: '17', estimatedValue: 45, status: 'hold' },
    { personId: michaelJordan.id, setId: fleer1986.id, teamId: bulls.id, year: 1990, cardNumber: '26', estimatedValue: 15, status: 'sell' },
    { personId: jimKelly.id, setId: score1990.id, teamId: bills.id, year: 1991, cardNumber: '225', autograph: true, estimatedValue: 120, status: 'hold' },
    { personId: joshAllen.id, setId: prizm2024.id, teamId: bills.id, year: 2024, cardNumber: '15', parallel: 'Gold', serialNumber: '3/10', printRun: 10, estimatedValue: 2500, status: 'vault', whyItMatters: 'Ultra-rare Gold Prizm numbered to 10. A true grail for modern Bills collectors.' },
    { personId: boJackson.id, setId: score1990.id, teamId: raiders.id, year: 1990, cardNumber: '1', parallel: 'Hot Card', estimatedValue: 25, status: 'hold' },
    { personId: thurmanThomas.id, setId: score1990.id, teamId: bills.id, year: 1992, cardNumber: '100', estimatedValue: 5, status: 'hold' },
    { personId: michaelJordan.id, setId: fleer1986.id, teamId: bulls.id, year: 1992, cardNumber: '32', estimatedValue: 20, status: 'hold' },
  ];

  for (const card of cardData) {
    await prisma.card.create({ data: card });
  }

  // Create a sample collection
  const collection = await prisma.collection.create({
    data: { ownerName: 'Admin', title: 'Bills Dynasty Collection', description: 'Cards from the Buffalo Bills Super Bowl era' },
  });

  const billsCards = await prisma.card.findMany({ where: { teamId: bills.id }, take: 5 });
  for (const card of billsCards) {
    await prisma.collectionCard.create({ data: { collectionId: collection.id, cardId: card.id } });
  }

  console.log('Seed complete: 5 players, 25 cards, 1 collection, 1 admin (admin/admin123)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
