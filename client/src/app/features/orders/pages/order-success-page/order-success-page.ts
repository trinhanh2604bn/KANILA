import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';

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
  orderId = '';
  orderNumber = '';
  orderDate = new Date();
  readonly estimatedDelivery = this.addDays(new Date(), 3);
  paymentStatus = '';
  orderStatus = '';
  readonly timeline = [
    { key: 'pending', label: 'Đã đặt hàng' },
    { key: 'confirmed', label: 'Đã xác nhận' },
    { key: 'processing', label: 'Đang chuẩn bị' },
    { key: 'completed', label: 'Hoàn tất' },
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
  paymentMethod = 'Đang cập nhật';
  shippingMethod = 'Đang cập nhật';
  customerName = '';
  customerPhone = '';
  shippingAddress = '';
  orderedItems: OrderedItem[] = [];
  isLoading = true;
  hasError = false;
  /** True when checkout completed as guest (from router state), or when only guest summary loads. */
  isGuestSuccess = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService
  ) {
    const state = (this.router.getCurrentNavigation()?.extras?.state || history.state || {}) as any;
    const routeOrderId = this.route.snapshot.queryParamMap.get('id') || '';
    this.orderId = String(state?.orderId || routeOrderId || '').trim();
    this.orderNumber = String(state?.orderNumber || '').trim();
    if (state?.checkoutAsGuest === true) {
      this.isGuestSuccess = true;
    }

    if (!this.orderId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    this.orderService.getMyOrderById(this.orderId).pipe(take(1)).subscribe({
      next: (order) => {
        if (!order) {
          this.orderService.getGuestOrderSummary(this.orderId).pipe(take(1)).subscribe((guestOrder) => {
            if (!guestOrder) {
              this.hasError = true;
              this.isLoading = false;
              return;
            }
            this.isGuestSuccess = true;
            this.bindOrder(guestOrder);
            this.isLoading = false;
            this.hasError = false;
          });
          return;
        }
        this.isGuestSuccess = false;
        this.bindOrder(order);
        this.isLoading = false;
        this.hasError = false;
      },
      error: () => {
        this.orderService.getGuestOrderSummary(this.orderId).pipe(take(1)).subscribe((guestOrder) => {
          if (!guestOrder) {
            this.hasError = true;
            this.isLoading = false;
            return;
          }
          this.isGuestSuccess = true;
          this.bindOrder(guestOrder);
          this.isLoading = false;
          this.hasError = false;
        });
      },
    });
  }

  private bindOrder(order: any): void {
    this.orderNumber = order.order_number || this.orderNumber || this.orderId;
    this.orderDate = order.placed_at ? new Date(order.placed_at) : this.orderDate;
    this.paymentStatus = this.mapPaymentStatus(order.payment_status);
    this.orderStatus = this.mapOrderStatus(order.order_status);
    this.orderedItems = (order.items || []).map((item: any) => ({
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

    const shipping = (order.order_addresses || []).find((x: any) => x.address_type === 'shipping');
    if (shipping) {
      this.customerName = shipping.recipient_name || this.customerName;
      this.customerPhone = shipping.phone || this.customerPhone;
      this.shippingAddress = [shipping.address_line_1, shipping.district, shipping.city].filter(Boolean).join(', ');
    }
  }

  continueShopping(): void {
    this.router.navigate(['/home']);
  }

  viewOrderDetails(): void {
    if (!this.orderId) return;
    if (this.isGuestSuccess) {
      this.router.navigate(['/orders', this.orderId, 'tracking']);
      return;
    }
    this.router.navigate(['/orders', this.orderId]);
  }

  trackOrder(): void {
    if (!this.orderId) return;
    this.router.navigate(['/orders', this.orderId, 'tracking']);
  }

  goRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  goOrderLookup(): void {
    this.router.navigate(['/orders/lookup']);
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  isStepDone(key: string): boolean {
    const rank: Record<string, number> = {
      pending: 1,
      confirmed: 2,
      processing: 3,
      completed: 4,
      cancelled: 0,
    };
    const current = rank[this.normalizeStatus(this.orderStatus)] || 1;
    const step = rank[key] || 0;
    return current >= step;
  }

  private mapPaymentStatus(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'paid') return 'Đã thanh toán';
    if (s === 'authorized') return 'Đã ủy quyền';
    if (s === 'refunded') return 'Đã hoàn tiền';
    return 'Chờ thanh toán';
  }

  private mapOrderStatus(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'confirmed') return 'confirmed';
    if (s === 'processing') return 'processing';
    if (s === 'completed') return 'completed';
    if (s === 'cancelled') return 'cancelled';
    return 'pending';
  }

  private normalizeStatus(status: string): string {
    return String(status || '').toLowerCase().trim();
  }
}
