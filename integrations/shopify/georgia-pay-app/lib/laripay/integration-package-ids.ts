export type IntegrationPackageId =
  | 'georgia-pay'
  | 'georgia-delivery'
  | 'georgia-warehouse'
  | 'laripay-cscart'
  | 'laripay-opencart'
  | 'laripay-prestashop';

const PACKAGE_IDS = new Set<string>([
  'georgia-pay',
  'georgia-delivery',
  'georgia-warehouse',
  'laripay-cscart',
  'laripay-opencart',
  'laripay-prestashop',
]);

export function isIntegrationPackageId(id: string): id is IntegrationPackageId {
  return PACKAGE_IDS.has(id);
}
