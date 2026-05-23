import prisma from '@/lib/prisma';
import {
  buildDeliveryClient,
  type CreateShipmentInput,
  type DeliveryRateInput,
} from '@/lib/georgian-delivery';
import {
  carrierCredentialsFor,
  isCarrierConfigured,
  parseCarrierCredentialsJson,
  type MerchantDeliveryConfig,
} from '@/lib/georgian-delivery/config';
import type { GeorgianCarrierId } from '@/lib/georgian-delivery/registry';
import { carrierLabel, isGeorgianCarrierId } from '@/lib/georgian-delivery/registry';

export async function getMerchantDeliveryConfig(merchantId: string): Promise<MerchantDeliveryConfig> {
  const m = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!m) throw new Error('Merchant not found');

  const defaultCarrier = (
    isGeorgianCarrierId(m.defaultCarrier || '') ? m.defaultCarrier : 'delivo'
  ) as GeorgianCarrierId;

  return {
    defaultCarrier,
    carrierCredentials: parseCarrierCredentialsJson(m.carrierCredentials),
  };
}

export { isCarrierConfigured, carrierCredentialsFor };

export async function quoteDeliveryRates(
  merchantId: string,
  input: DeliveryRateInput,
  carrier?: GeorgianCarrierId,
) {
  const config = await getMerchantDeliveryConfig(merchantId);
  const resolved = carrier && isGeorgianCarrierId(carrier) ? carrier : config.defaultCarrier;

  if (!isCarrierConfigured(config, resolved)) {
    throw new Error(
      `${carrierLabel(resolved, 'en')} is not configured. Add courier API credentials in dashboard.`,
    );
  }

  const client = buildDeliveryClient(config);
  const rates = await client.getRates(input, resolved);
  return { carrier: resolved, rates };
}

export async function createDeliveryShipment(
  merchantId: string,
  input: CreateShipmentInput & { carrier?: GeorgianCarrierId; clientReferenceId?: string },
) {
  const config = await getMerchantDeliveryConfig(merchantId);
  const resolved =
    input.carrier && isGeorgianCarrierId(input.carrier) ? input.carrier : config.defaultCarrier;

  if (!isCarrierConfigured(config, resolved)) {
    throw new Error(`${carrierLabel(resolved, 'en')} is not configured for this merchant.`);
  }

  const client = buildDeliveryClient(config);
  const result = await client.createShipment(
    {
      from: input.from,
      to: input.to,
      weight_kg: input.weight_kg,
      dimensions_cm: input.dimensions_cm,
      cod_amount: input.cod_amount,
      service: input.service,
      reference: input.reference || input.clientReferenceId,
      description: input.description,
      items: input.items,
    },
    resolved,
  );

  const shipment = await prisma.deliveryShipment.create({
    data: {
      merchantId,
      carrier: resolved,
      status: result.status || 'created',
      trackingNumber: result.trackingNumber || null,
      externalId: result.shipmentId || null,
      trackingUrl: result.trackingUrl || null,
      labelUrl: result.labelUrl || null,
      priceGel: result.priceGel != null ? Number(result.priceGel) : null,
      clientReferenceId: input.clientReferenceId || input.reference || null,
      fromAddress: input.from as object,
      toAddress: input.to as object,
      weightKg: input.weight_kg ?? null,
      service: input.service || 'standard',
      rawResponse: result.raw ? (result.raw as object) : undefined,
    },
  });

  return {
    id: shipment.id,
    object: 'delivery.shipment' as const,
    carrier: resolved,
    tracking_number: shipment.trackingNumber,
    tracking_url: shipment.trackingUrl,
    label_url: shipment.labelUrl,
    price_gel: shipment.priceGel,
    status: shipment.status,
    client_reference_id: shipment.clientReferenceId,
    created: Math.floor(shipment.createdAt.getTime() / 1000),
  };
}

export async function trackDeliveryShipment(merchantId: string, shipmentId: string) {
  const shipment = await prisma.deliveryShipment.findFirst({
    where: { id: shipmentId, merchantId },
  });
  if (!shipment?.trackingNumber) {
    throw new Error('Shipment not found or missing tracking number');
  }

  const config = await getMerchantDeliveryConfig(merchantId);
  const carrier = shipment.carrier as GeorgianCarrierId;
  const client = buildDeliveryClient(config);
  const track = await client.trackShipment(shipment.trackingNumber, carrier);

  if (track.status && track.status !== shipment.status) {
    await prisma.deliveryShipment.update({
      where: { id: shipment.id },
      data: { status: track.status },
    });
  }

  return {
    id: shipment.id,
    object: 'delivery.tracking' as const,
    carrier,
    tracking_number: shipment.trackingNumber,
    status: track.status,
    events: track.events,
  };
}

export async function getDeliveryShipment(merchantId: string, shipmentId: string) {
  const shipment = await prisma.deliveryShipment.findFirst({
    where: { id: shipmentId, merchantId },
  });
  if (!shipment) return null;

  return {
    id: shipment.id,
    object: 'delivery.shipment' as const,
    carrier: shipment.carrier,
    tracking_number: shipment.trackingNumber,
    tracking_url: shipment.trackingUrl,
    label_url: shipment.labelUrl,
    price_gel: shipment.priceGel,
    status: shipment.status,
    service: shipment.service,
    client_reference_id: shipment.clientReferenceId,
    weight_kg: shipment.weightKg,
    created: Math.floor(shipment.createdAt.getTime() / 1000),
  };
}
