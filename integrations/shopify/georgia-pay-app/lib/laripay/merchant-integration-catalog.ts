import type { IntegrationPlatformId } from '@/lib/laripay/integration-platform';

export type WordPressPluginId = 'georgia-pay' | 'georgia-delivery' | 'georgia-warehouse';

export type IntegrationCatalogEntry = {
  id: IntegrationPlatformId;
  status: 'available' | 'beta';
  pluginDownloads: WordPressPluginId[];
  docsPath: string;
  requiresApiKey: boolean;
  requiresBank: boolean;
};

export const MERCHANT_INTEGRATION_CATALOG: IntegrationCatalogEntry[] = [
  {
    id: 'shopify',
    status: 'beta',
    pluginDownloads: [],
    docsPath: 'integrations#shopify',
    requiresApiKey: false,
    requiresBank: true,
  },
  {
    id: 'woocommerce',
    status: 'beta',
    pluginDownloads: ['georgia-pay', 'georgia-delivery', 'georgia-warehouse'],
    docsPath: 'integrations#woocommerce',
    requiresApiKey: true,
    requiresBank: true,
  },
  {
    id: 'wordpress',
    status: 'beta',
    pluginDownloads: ['georgia-pay'],
    docsPath: 'integrations#woocommerce',
    requiresApiKey: true,
    requiresBank: true,
  },
  {
    id: 'cscart',
    status: 'beta',
    pluginDownloads: [],
    docsPath: 'integrations',
    requiresApiKey: true,
    requiresBank: true,
  },
  {
    id: 'opencart',
    status: 'beta',
    pluginDownloads: [],
    docsPath: 'integrations',
    requiresApiKey: true,
    requiresBank: true,
  },
  {
    id: 'prestashop',
    status: 'beta',
    pluginDownloads: [],
    docsPath: 'integrations',
    requiresApiKey: true,
    requiresBank: true,
  },
  {
    id: 'api',
    status: 'available',
    pluginDownloads: [],
    docsPath: 'docs#api',
    requiresApiKey: true,
    requiresBank: true,
  },
];

export function catalogEntry(id: IntegrationPlatformId): IntegrationCatalogEntry | undefined {
  return MERCHANT_INTEGRATION_CATALOG.find((c) => c.id === id);
}
