export interface MyOrderListItemView {
  _id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  placed_at: string;
  grand_total_amount: number;
  subtotal_amount: number;
  shipping_fee_amount: number;
  item_count: number;
  total_quantity: number;
  first_item_name: string;
  first_item_variant: string;
  shipment_status: string | null;
  tracking_number: string | null;
}

export interface OrderAddressView {
  address_type: 'shipping' | 'billing';
  recipient_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  district?: string;
  city: string;
}

export interface OrderItemView {
  _id: string;
  product_name_snapshot: string;
  variant_name_snapshot: string;
  quantity: number;
  unit_final_price_amount?: number;
  line_total_amount: number;
}

export interface OrderTotalView {
  subtotal_amount: number;
  order_discount_amount: number;
  shipping_fee_amount: number;
  grand_total_amount: number;
}

export interface OrderStatusHistoryView {
  _id: string;
  old_order_status?: string;
  new_order_status?: string;
  old_payment_status?: string;
  new_payment_status?: string;
  old_fulfillment_status?: string;
  new_fulfillment_status?: string;
  change_reason?: string;
  changed_at: string;
}

export interface OrderDetailView {
  _id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  customer_note?: string;
  placed_at: string;
  items: OrderItemView[];
  order_total: OrderTotalView | null;
  order_addresses: OrderAddressView[];
  status_history: OrderStatusHistoryView[];
}

export interface OrderTrackingEventView {
  code: string;
  status: string;
  description: string;
  timestamp: string;
  location: string;
  source: string;
}

export interface OrderTrackingView {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  paymentMethod: string | null;
  shipment: {
    shipmentId: string;
    shipmentNumber: string;
    shipmentStatus: string;
    carrierCode: string | null;
    serviceName: string | null;
    trackingNumber: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
  latestUpdateAt: string;
  events: OrderTrackingEventView[];
}
