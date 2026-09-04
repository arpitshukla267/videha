import type { OrderStatus, PublicOrderTrackingInfo } from "../../types/crm";

export type TrackableOrderSummary = {
  orderCode: string;
  company: string;
  country: string;
  products: string;
  orderStatus: OrderStatus;
  expectedDelivery: string;
  destinationPort?: string;
};

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86400000).toISOString();
}

/** Rich demo consignments so tracking UI always has something to show. */
export const DEMO_TRACKING: Record<string, PublicOrderTrackingInfo> = {
  "VO-2026-0182": {
    orderCode: "VO-2026-0182",
    customerCompany: "Pacific Rim Commodities Corp",
    country: "United States",
    products: "Assam Orthodox Golden Flowery Pekoe Black Tea (50 MT Vacuum Pack)",
    quantity: "50 Metric Tons",
    orderStatus: "In Transit",
    expectedDelivery: daysFromNow(14),
    destinationPort: "Port of Oakland, CA, USA",
    shippingCarrier: "Mediterranean Shipping Company (MSC)",
    trackingNumber: "MSCU8944120",
    statusHistory: [
      {
        status: "Order Confirmed",
        timestamp: daysAgo(28),
        notes: "PO signed · 30% deposit confirmed",
      },
      {
        status: "Processing",
        timestamp: daysAgo(25),
        notes: "Warehouse allocation from Assam confirmed",
      },
      {
        status: "Production",
        timestamp: daysAgo(22),
        notes: "Blending and grading completed",
      },
      {
        status: "Packed",
        timestamp: daysAgo(18),
        notes: "Vacuum foil packaging + fumigation stamp",
      },
      {
        status: "Shipped",
        timestamp: daysAgo(12),
        notes: "Loaded at JNPT Mumbai on MSC Rosa",
      },
      {
        status: "In Transit",
        timestamp: daysAgo(9),
        notes: "Vessel cleared international waters en-route to Oakland",
      },
    ],
  },
  "VO-2026-0183": {
    orderCode: "VO-2026-0183",
    customerCompany: "Al-Madina Hospitality Group",
    country: "United Arab Emirates",
    products: "Handmade Antique Brass Tableware, Chafing Dishes & Water Goblets",
    quantity: "1,200 Sets",
    orderStatus: "Packed",
    expectedDelivery: daysFromNow(10),
    destinationPort: "Jebel Ali Port, Dubai",
    shippingCarrier: "Maersk Line",
    trackingNumber: "MAEU7612093",
    statusHistory: [
      {
        status: "Order Confirmed",
        timestamp: daysAgo(20),
        notes: "Hospitality tender accepted",
      },
      {
        status: "Processing",
        timestamp: daysAgo(17),
        notes: "Artisan workshop booked in Moradabad",
      },
      {
        status: "Production",
        timestamp: daysAgo(12),
        notes: "Casting and antique finish underway",
      },
      {
        status: "Packed",
        timestamp: daysAgo(4),
        notes: "Wooden pallets ready · awaiting terminal gate",
      },
    ],
  },
  "VO-2026-0184": {
    orderCode: "VO-2026-0184",
    customerCompany: "Nordic Organic Superfoods AB",
    country: "Sweden",
    products: "Organic Raw Deseeded Tamarind & Dry Ginger Slices",
    quantity: "25 Metric Tons",
    orderStatus: "Production",
    expectedDelivery: daysFromNow(24),
    destinationPort: "Port of Gothenburg, Sweden",
    shippingCarrier: "Hapag-Lloyd",
    trackingNumber: "HLCU9018273",
    statusHistory: [
      {
        status: "Order Confirmed",
        timestamp: daysAgo(12),
        notes: "EU organic cert pack agreed",
      },
      {
        status: "Processing",
        timestamp: daysAgo(9),
        notes: "Sourcing locked with Tamil Nadu co-op",
      },
      {
        status: "Production",
        timestamp: daysAgo(3),
        notes: "Dehydration and sorting in progress",
      },
    ],
  },
  "VO-2026-0180": {
    orderCode: "VO-2026-0180",
    customerCompany: "Bavaria Spice Wholesale",
    country: "Germany",
    products: "Tellicherry Black Pepper (TGSEB Grade) - 40 MT",
    quantity: "40 Metric Tons",
    orderStatus: "Delivered",
    expectedDelivery: daysAgo(8),
    destinationPort: "Port of Hamburg, Germany",
    shippingCarrier: "CMA CGM",
    trackingNumber: "CMAU3819201",
    statusHistory: [
      {
        status: "Order Confirmed",
        timestamp: daysAgo(45),
        notes: "Contract closed with LC",
      },
      {
        status: "Processing",
        timestamp: daysAgo(40),
        notes: "Estate lot reserved",
      },
      {
        status: "Production",
        timestamp: daysAgo(35),
        notes: "Steam sterilisation complete",
      },
      {
        status: "Packed",
        timestamp: daysAgo(30),
        notes: "Food-grade bags sealed",
      },
      {
        status: "Shipped",
        timestamp: daysAgo(24),
        notes: "Departed Cochin port",
      },
      {
        status: "In Transit",
        timestamp: daysAgo(18),
        notes: "Transhipment via Rotterdam",
      },
      {
        status: "Delivered",
        timestamp: daysAgo(8),
        notes: "POD signed · balance payment cleared",
      },
    ],
  },
};

export const DEMO_ORDER_LIST: TrackableOrderSummary[] = Object.values(DEMO_TRACKING).map(
  (o) => ({
    orderCode: o.orderCode,
    company: o.customerCompany,
    country: o.country,
    products: o.products,
    orderStatus: o.orderStatus,
    expectedDelivery: o.expectedDelivery,
    destinationPort: o.destinationPort,
  }),
);

export function getDemoTracking(orderCode: string): PublicOrderTrackingInfo | null {
  const key = orderCode.trim().toUpperCase();
  return DEMO_TRACKING[key] || null;
}
