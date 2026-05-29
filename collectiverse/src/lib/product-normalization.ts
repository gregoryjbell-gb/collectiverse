import { prisma } from './prisma';

/**
 * Normalize manufacturer name for matching.
 */
export function normalizeManufacturerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(inc|llc|corp|corporation|co|ltd|company|international)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize brand name for matching.
 */
export function normalizeBrandName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize product/release name for matching.
 */
export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(series|edition|update|hobby|retail|blaster|mega|hanger)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize set name for matching.
 */
export function normalizeSetName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(set|collection|series|complete)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve or create a Manufacturer record.
 */
export async function resolveManufacturer(name: string): Promise<any> {
  if (!name) return null;
  const normalized = normalizeManufacturerName(name);

  // Try exact normalized match
  let mfr = await (prisma as any).manufacturer.findUnique({ where: { normalizedName: normalized } });
  if (mfr) return mfr;

  // Try name match
  mfr = await (prisma as any).manufacturer.findUnique({ where: { name } });
  if (mfr) return mfr;

  // Create new
  mfr = await (prisma as any).manufacturer.create({
    data: { name, normalizedName: normalized },
  });
  return mfr;
}

/**
 * Resolve or create a Brand record under a manufacturer.
 */
export async function resolveBrand(manufacturerId: string, name: string): Promise<any> {
  if (!name || !manufacturerId) return null;
  const normalized = normalizeBrandName(name);

  // Try exact match
  let brand = await (prisma as any).brand.findFirst({
    where: { manufacturerId, normalizedName: normalized },
  });
  if (brand) return brand;

  // Create new
  brand = await (prisma as any).brand.create({
    data: { manufacturerId, name, normalizedName: normalized },
  });
  return brand;
}

/**
 * Resolve or create a ProductRelease.
 */
export async function resolveProductRelease(params: {
  manufacturerId: string;
  brandId?: string | null;
  year: number;
  name: string;
  category?: string;
  sportId?: string | null;
  franchise?: string | null;
}): Promise<any> {
  const { manufacturerId, brandId, year, name, category, sportId, franchise } = params;

  // Try to find existing
  let release = await (prisma as any).productRelease.findFirst({
    where: { manufacturerId, year, name },
  });
  if (release) return release;

  // Create new
  release = await (prisma as any).productRelease.create({
    data: {
      manufacturerId,
      brandId: brandId || null,
      year,
      name,
      category: category || 'SPORTS_CARD',
      sportId: sportId || null,
      franchise: franchise || null,
    },
  });
  return release;
}

/**
 * Resolve or create a ChecklistSection within a ProductRelease.
 */
export async function resolveChecklistSection(params: {
  productReleaseId: string;
  name: string;
  sectionType?: string;
  parentSectionId?: string | null;
}): Promise<any> {
  const { productReleaseId, name, sectionType, parentSectionId } = params;

  let section = await (prisma as any).checklistSection.findFirst({
    where: { productReleaseId, name },
  });
  if (section) return section;

  section = await (prisma as any).checklistSection.create({
    data: {
      productReleaseId,
      name,
      sectionType: sectionType || 'BASE',
      parentSectionId: parentSectionId || null,
    },
  });
  return section;
}

/**
 * Resolve the full product hierarchy from import row data.
 * Returns { manufacturer, brand, productRelease, checklistSection }
 */
export async function resolveProductHierarchy(params: {
  manufacturer?: string | null;
  brand?: string | null;
  product?: string | null;
  setName?: string | null;
  year?: number | null;
  series?: string | null;
  category?: string | null;
  sportId?: string | null;
  franchise?: string | null;
  parallel?: string | null;
}): Promise<{
  manufacturer: any | null;
  brand: any | null;
  productRelease: any | null;
  checklistSection: any | null;
}> {
  let manufacturer = null;
  let brand = null;
  let productRelease = null;
  let checklistSection = null;

  // 1. Resolve manufacturer
  if (params.manufacturer) {
    manufacturer = await resolveManufacturer(params.manufacturer);
  }

  // 2. Resolve brand
  if (manufacturer && params.brand) {
    brand = await resolveBrand(manufacturer.id, params.brand);
  }

  // 3. Resolve product release
  if (manufacturer && params.year) {
    const releaseName = params.product || params.setName || `${params.manufacturer} ${params.year}`;
    productRelease = await resolveProductRelease({
      manufacturerId: manufacturer.id,
      brandId: brand?.id,
      year: params.year,
      name: releaseName,
      category: params.category || undefined,
      sportId: params.sportId,
      franchise: params.franchise,
    });
  }

  // 4. Resolve checklist section
  if (productRelease) {
    const sectionName = params.series || params.parallel || 'Base';
    const sectionType = params.parallel ? 'PARALLEL' : (params.series && params.series !== 'Base' ? 'SUBSET' : 'BASE');
    checklistSection = await resolveChecklistSection({
      productReleaseId: productRelease.id,
      name: sectionName,
      sectionType,
    });
  }

  return { manufacturer, brand, productRelease, checklistSection };
}
