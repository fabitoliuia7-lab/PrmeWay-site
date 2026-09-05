/**
 * Helper to generate unique human-readable sequential IDs
 * e.g., FOR-0001, PROD-0001, CLI-0001, PED-0001, COT-0001, DOC-0001, REL-0001
 */

export function generateNextId(prefix: string, existingList: { id: string }[]): string {
  if (!existingList || existingList.length === 0) {
    return `${prefix}-0001`;
  }

  let maxNum = 0;
  const regex = new RegExp(`^${prefix}-(\\d+)`, 'i');

  for (const item of existingList) {
    const match = item.id.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
}
