import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { CheckoutService } from '../../../checkout/services/checkout.service';

interface OrderedItem {
  id: string;
  brand: string;
  name: string;
  variant: string;
  image: string;
  quantity: number;
  lineTotal: number;
}

interface RecoItem {
  name: string;
  brand: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-order-success-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-success-page.html',
  styleUrls: ['./order-success-page.css'],
})
export class OrderSuccessPageComponent {
  orderNumber = `KAN-${Date.now().toString().slice(-8)}`;
  orderDate = new Date();
  readonly estimatedDelivery = this.addDays(new Date(), 3);
  paymentStatus = 'Đã xác nhận';
  readonly timeline = [
    { label: 'Đã đặt hàng', done: true },
    { label: 'Đã xác nhận', done: false },
    { label: 'Đang chuẩn bị', done: false },
    { label: 'Đang giao', done: false },
    { label: 'Hoàn tất', done: false },
  ];
  readonly recommendations: RecoItem[] = [
    { name: 'Glow Cushion Foundation', brand: 'KLAIRS', price: 390000, image: 'assets/images/banner/new_product.png' },
    { name: 'Velvet Blush Palette', brand: '3CE', price: 320000, image: 'assets/images/banner/bestseller.png' },
    { name: 'Hydra Lip Oil', brand: 'COCOON', price: 260000, image: 'assets/images/banner/all-product.png' },
  ];

  subtotal = 0;
  discount = 0;
  shippingFee = 0;
  totalPaid = 0;
  paymentMethod = 'Thanh toán khi nhận hàng';
  shippingMethod = 'Giao tiêu chuẩn';
  customerName = 'Ngọc Ánh';
  customerPhone = '09xxxxxxxx';
  shippingAddress = 'TP. Ho Chi Minh';
  orderedItems: OrderedItem[] = [];
  isLoading = true;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly checkoutService: CheckoutService
  ) {
    const state = (this.router.getCurrentNavigation()?.extras?.state || history.state || {}) as any;
    const routeOrderId = this.route.snapshot.queryParamMap.get('id') || '';
    const orderId = state?.orderId || routeOrderId || '';

    this.subtotal = Number(state?.subtotal || 1290000);
    this.discount = Number(state?.discount || 120000);
    this.shippingFee = Number(state?.shippingFee || 0);
    this.totalPaid = Number(state?.grandTotal || Math.max(0, this.subtotal - this.discount + this.shippingFee));
    this.paymentMethod = state?.paymentMethod || 'Thanh toán khi nhận hàng';
    this.shippingMethod = state?.shippingMethod || 'Giao tiêu chuẩn';
    this.customerName = state?.contactName || 'Ngọc Ánh';
    this.customerPhone = state?.phone || '09xxxxxxxx';
    this.shippingAddress = state?.address || 'TP. Ho Chi Minh';

    const fallback: OrderedItem[] = [
      {
        id: '1',
        brand: '3CE',
        name: 'Velvet Lip Tint',
        variant: 'Màu #Taupe',
        image: 'assets/images/banner/new_product.png',
        quantity: 1,
        lineTotal: 320000,
      },
      {
        id: '2',
        brand: 'KLAIRS',
        name: 'Hydrating Grip Primer',
        variant: '30ml',
        image: 'assets/images/banner/bestseller.png',
        quantity: 2,
        lineTotal: 640000,
      },
    ];

    this.orderedItems = Array.isArray(state?.items) && state.items.length
      ? state.items.map((x: any, idx: number) => ({
          id: x.id || String(idx + 1),
          brand: x.brand || 'KANILA',
          name: x.name || 'Sản phẩm',
          variant: x.variant || 'Default',
          image: x.image || 'assets/images/banner/nen.png',
          quantity: Number(x.quantity || 1),
          lineTotal: Number((x.price || 0) * (x.quantity || 1)),
        }))
      : fallback;

    this.orderNumber = state?.orderNumber || this.orderNumber;
    if (!orderId) {
      this.isLoading = false;
      return;
    }
    this.checkoutService.getOrderById(orderId).pipe(take(1)).subscribe((order) => {
      this.isLoading = false;
      if (!order) return;
      this.orderNumber = order.order_number || this.orderNumber;
      this.orderDate = order.placed_at ? new Date(order.placed_at) : this.orderDate;
      this.paymentStatus = order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán';
      this.orderedItems = (order.items || []).map((item) => ({
        id: item._id,
        brand: 'KANILA',
        name: item.product_name_snapshot,
        variant: item.variant_name_snapshot,
        image: 'assets/images/banner/nen.png',
        quantity: Number(item.quantity || 1),
        lineTotal: Number(item.line_total_amount || 0),
      }));
      this.subtotal = Number(order.order_total?.subtotal_amount || this.subtotal);
      this.discount = Number(order.order_total?.order_discount_amount || this.discount);
      this.shippingFee = Number(order.order_total?.shipping_fee_amount || this.shippingFee);
      this.totalPaid = Number(order.order_total?.grand_total_amount || this.totalPaid);

      const shipping = (order.order_addresses || []).find((x) => x.address_type === 'shipping');
      if (shipping) {
        this.customerName = shipping.recipient_name || this.customerName;
        this.customerPhone = shipping.phone || this.customerPhone;
        this.shippingAddress = [shipping.address_line_1, shipping.district, shipping.city].filter(Boolean).join(', ');
      }
    });
  }

  continueShopping(): void {
    this.router.navigate(['/home']);
  }

  viewOrderDetails(): void {
    this.router.navigate(['/orders']);
  }

  trackOrder(): void {
    this.router.navigate(['/orders']);
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
}
