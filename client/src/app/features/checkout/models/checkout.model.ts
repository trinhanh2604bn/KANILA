export interface CheckoutIssue {
  code: string;
  message: string;
  cartItemId?: string;
  availableStock?: number;
  requestedQuantity?: number;
  snapshotUnitPrice?: number;
  currentUnitPrice?: number;
}

export interface BuyNowCheckoutPayload {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface CheckoutAddressPayload {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  city: string;
  countryCode?: string;
  postalCode?: string;
}

export interface CheckoutSelectedItem {
  cartItemId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CheckoutSessionView {
  sessionId: string;
  checkoutStatus: 'in_progress' | 'completed' | 'expired';
  cartId: string;
  customerId: string;
  shippingAddress: {
    recipient_name: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string;
    ward?: string;
    district?: string;
    city: string;
    country_code?: string;
    postal_code?: string;
  } | null;
  selectedShippingMethodId: string | null;
  selectedPaymentMethodId: string | null;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  expiresAt?: string | null;
  selectedItems: CheckoutSelectedItem[];
  appliedCouponCode?: string | null;
}

export interface CheckoutSessionUpdatePayload {
  shippingMethodId?: string | null;
  paymentMethodId?: string | null;
  couponCode?: string | null;
  shippingAddress?: CheckoutAddressPayload;
}

export interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  paymentTransactionId: string | null;
}

export interface ShippingMethodOption {
  _id: string;
  shipping_method_name: string;
  shipping_method_code: string;
  service_level?: string;
  is_active?: boolean;
}

export interface PaymentMethodOption {
  _id: string;
  payment_method_name: string;
  payment_method_code: string;
  method_type: string;
  is_active?: boolean;
}

export interface OrderDetailView {
  _id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  placed_at: string;
  items: Array<{
    _id: string;
    product_name_snapshot: string;
    variant_name_snapshot: string;
    quantity: number;
    line_total_amount: number;
  }>;
  order_total?: {
    subtotal_amount: number;
    order_discount_amount: number;
    shipping_fee_amount: number;
    grand_total_amount: number;
  } | null;
  order_addresses?: Array<{
    address_type: 'shipping' | 'billing';
    recipient_name: string;
    phone: string;
    address_line_1: string;
    district?: string;
    city: string;
  }>;
}
