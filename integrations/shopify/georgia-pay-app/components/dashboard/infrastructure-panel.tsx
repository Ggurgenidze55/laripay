'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function InfrastructurePanel({
  tbc,
  bog,
  billingMode,
}: {
  tbc: boolean;
  bog: boolean;
  billingMode: string;
}) {
  const { t } = useLocale();
  const d = t.dashboard;

  const items = [
    { label: d.apiGateway, status: d.operational, ok: true },
    { label: 'TBC Pay', status: tbc ? d.configured : d.pending, ok: tbc },
    { label: 'BOG Pay', status: bog ? d.configured : d.pending, ok: bog },
    { label: d.webhooks, status: d.delivering, ok: true },
    { label: d.billing, status: billingMode, ok: true },
  ];

  return (
    <Card className="!p-5">
      <h3 className="text-sm font-medium text-foreground/80">{d.infrastructure}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => (
          <motion.li
            key={item.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-foreground-muted">{item.label}</span>
            <Badge variant={item.ok ? 'live' : 'pending'} pulse={item.ok && item.label === d.webhooks}>
              {item.status}
            </Badge>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}
