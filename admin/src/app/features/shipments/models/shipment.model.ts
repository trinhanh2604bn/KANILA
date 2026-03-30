export type ShipmentStatus = 'pending' | 'ready_to_ship' | 'shipped' | 'in_transit' | 'delivered' | 'failed' | 'returned';

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  eventCode: string;
  eventStatus: string;
  eventDescription: string;
  eventTime: string;
  locationText: string;
  /** Alias for eventStatus — used by detail component */
  status: ShipmentStatus;
}

export interface Shipment {
  id: string;
  orderId: string;
  warehouseId: string | null;
  shipmentNumber: string;
  carrierCode: string;
  serviceName: string;
  trackingNumber: string;
  shipmentStatus: ShipmentStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  shippingFeeAmount: number;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
  // UI aliases
  status: ShipmentStatus;
  carrier: string;
  estimatedDelivery: string;
  events: ShipmentEvent[];
  failureReason: string;
  orderNumber: string;
}

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: 'Pending',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  returned: 'Returned',
};

export const SHIPMENT_STATUS_FLOW: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['ready_to_ship', 'failed'],
  ready_to_ship: ['shipped', 'failed'],
  shipped: ['in_transit', 'delivered', 'failed'],
  in_transit: ['delivered', 'failed'],
  delivered: ['returned'],
  failed: ['pending'],
  returned: [],
};

export const SHIPMENT_WORKFLOW_STEPS: ShipmentStatus[] = [
  'pending', 'ready_to_ship', 'shipped', 'in_transit', 'delivered',
];
