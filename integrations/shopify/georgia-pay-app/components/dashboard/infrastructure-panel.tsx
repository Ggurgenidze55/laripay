'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function InfrastructurePanel({
  tbc,
  bog,
  billingMode,
}: {
  tbc: boolean;
  bog: boolean;
  billingMode: string;
}) {
  const items = [
    { label: 'API Gateway', status: 'Operational', ok: true },
    { label: 'TBC Pay', status: tbc ? 'Configured' : 'Pending', ok: tbc },
    { label: 'BOG Pay', status: bog ? 'Configured' : 'Pending', ok: bog },
    { label: 'Webhooks', status: 'Delivering', ok: true },
    { label: 'Billing', status: billingMode, ok: true },
  ];

  return (
    <Card className="!p-5">
      <h3 className="text-sm font-medium text-white/80">Infrastructure</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => (
          <motion.li
            key={item.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-white/50">{item.label}</span>
            <Badge variant={item.ok ? 'live' : 'pending'} pulse={item.ok && item.label === 'Webhooks'}>
              {item.status}
            </Badge>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}
