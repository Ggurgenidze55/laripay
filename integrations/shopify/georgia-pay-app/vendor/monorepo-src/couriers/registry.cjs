'use strict';

/** Georgian courier / delivery carriers for e-commerce. */
const GEORGIAN_CARRIERS = [
  {
    id: 'delivo',
    name: 'Delivo',
    nameKa: 'Delivo',
    status: 'live',
    services: ['standard', 'express', 'same_day'],
    cod: true,
    tracking: true,
    envPrefix: 'DELIVO',
  },
  {
    id: 'onway',
    name: 'OnWay',
    nameKa: 'OnWay',
    status: 'live',
    services: ['standard', 'express'],
    cod: true,
    tracking: true,
    envPrefix: 'ONWAY',
  },
  {
    id: 'georgian_post',
    name: 'Georgian Post',
    nameKa: 'საქართველოს ფოსტა',
    status: 'live',
    services: ['standard', 'registered', 'express'],
    cod: true,
    tracking: true,
    envPrefix: 'GEORGIAN_POST',
  },
  {
    id: 'glovo',
    name: 'Glovo',
    nameKa: 'Glovo',
    status: 'beta',
    services: ['courier', 'same_day'],
    cod: false,
    tracking: true,
    envPrefix: 'GLOVO',
  },
  {
    id: 'wolt',
    name: 'Wolt Drive',
    nameKa: 'Wolt Drive',
    status: 'beta',
    services: ['courier', 'same_day'],
    cod: false,
    tracking: true,
    envPrefix: 'WOLT',
  },
  {
    id: 'bolt',
    name: 'Bolt Delivery',
    nameKa: 'Bolt Delivery',
    status: 'beta',
    services: ['courier'],
    cod: false,
    tracking: true,
    envPrefix: 'BOLT',
  },
  {
    id: 'kiwipost',
    name: 'KiwiPost',
    nameKa: 'KiwiPost',
    status: 'beta',
    services: ['locker', 'courier'],
    cod: true,
    tracking: true,
    envPrefix: 'KIWIPOST',
  },
  {
    id: 'optimo',
    name: 'Optimo Express',
    nameKa: 'Optimo Express',
    status: 'beta',
    services: ['standard', 'express'],
    cod: true,
    tracking: true,
    envPrefix: 'OPTIMO',
  },
  {
    id: 'multiline',
    name: 'MultiLine Express',
    nameKa: 'MultiLine Express',
    status: 'beta',
    services: ['standard'],
    cod: true,
    tracking: true,
    envPrefix: 'MULTILINE',
  },
  {
    id: 'dhl',
    name: 'DHL Georgia',
    nameKa: 'DHL საქართველო',
    status: 'live',
    services: ['express', 'international'],
    cod: false,
    tracking: true,
    envPrefix: 'DHL',
  },
  {
    id: 'fedex',
    name: 'FedEx Georgia',
    nameKa: 'FedEx საქართველო',
    status: 'beta',
    services: ['express', 'international'],
    cod: false,
    tracking: true,
    envPrefix: 'FEDEX',
  },
  {
    id: 'ups',
    name: 'UPS Georgia',
    nameKa: 'UPS საქართველო',
    status: 'beta',
    services: ['express', 'international'],
    cod: false,
    tracking: true,
    envPrefix: 'UPS',
  },
];

const CARRIER_IDS = GEORGIAN_CARRIERS.map((c) => c.id);

function isGeorgianCarrierId(id) {
  return CARRIER_IDS.includes(id);
}

function getCarrier(id) {
  return GEORGIAN_CARRIERS.find((c) => c.id === id) || null;
}

module.exports = { GEORGIAN_CARRIERS, CARRIER_IDS, isGeorgianCarrierId, getCarrier };
