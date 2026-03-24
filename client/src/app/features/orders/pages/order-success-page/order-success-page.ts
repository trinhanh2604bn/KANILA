import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

interface OrderedItem {
  id: string;
  brand: string;
  name: string;
  variant: string;
  image: string;
  quantity: number;
  lineTotal: number;
}

@Component({
  selector: 'app-order-success-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-success-page.html',
  styleUrls: ['./order-success-page.css'],
})
export class OrderSuccessPageComponent {
  readonly orderNumber = `KAN-${Date.now().toString().slice(-8)}`;
  readonly orderDate = new Date();
  readonly estimatedDelivery = this.addDays(new Date(), 3);
  readonly paymentStatus = 'Đã xác nhận';
  readonly timeline = [
    { label: 'Đã đặt hàng', done: true },
    { label: 'Đã xác nhận', done: false },
    { label: 'Đang chuẩn bị', done: false },
    { label: 'Đang giao', done: false },
    { label: 'Hoàn tất', done: false },
  ];

  readonly subtotal: number;
  readonly discount: number;
  readonly shippingFee: number;
  readonly totalPaid: number;
  readonly paymentMethod: string;
  readonly shippingMethod: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly shippingAddress: string;
  readonly orderedItems: OrderedItem[];

  constructor(private readonly router: Router) {
    const state = (this.router.getCurrentNavigation()?.extras?.state || history.state || {}) as any;

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
