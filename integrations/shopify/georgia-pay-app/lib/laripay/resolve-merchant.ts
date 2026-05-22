import prisma from '@/lib/prisma';

export async function resolveMerchantId(idOrSlug: string): Promise<string | null> {
  const merchant = await prisma.merchant.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    select: { id: true },
  });
  return merchant?.id ?? null;
}
