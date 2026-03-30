import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';
import { AccountOrderService, MyOrderItemView, MyOrderTrackingView } from '../../services/order.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders-page.html',
  styleUrls: ['./orders-page.css'],
})
export class OrdersPageComponent implements OnInit {
  readonly tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'processing', label: 'Đang xử lý' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'delivered', label: 'Hoàn tất' },
    { key: 'cancelled', label: 'Đã hủy' },
    { key: 'returned', label: 'Trả hàng' },
  ] as const;
  activeTab: (typeof this.tabs)[number]['key'] = 'all';
  orders: MyOrderItemView[] = [];
  loading = false;
  error = '';
  busyOrderId = '';
  expandedOrderId = '';
  loadingTrackingId = '';
  trackingByOrderId: Record<string, MyOrderTrackingView | null> = {};

  constructor(private readonly orderService: AccountOrderService, private readonly router: Router) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = '';
    this.orderService.listMyOrders(1, 20).pipe(take(1)).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Không thể tải danh sách đơn hàng.';
      }
    });
  }

  toggleTracking(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? '' : orderId;
    if (!this.expandedOrderId || this.trackingByOrderId[orderId] !== undefined) return;
    this.loadingTrackingId = orderId;
    this.orderService.getMyOrderTracking(orderId).pipe(take(1)).subscribe({
      next: (tracking) => {
        this.trackingByOrderId[orderId] = tracking;
        this.loadingTrackingId = '';
      },
      error: () => {
        this.trackingByOrderId[orderId] = null;
        this.loadingTrackingId = '';
      },
    });
  }

  get filteredOrders(): MyOrderItemView[] {
    return this.orders.filter((o) => this.matchesTab(o));
  }

  selectTab(tab: (typeof this.tabs)[number]['key']): void {
    this.activeTab = tab;
  }

  requestCancel(order: MyOrderItemView): void {
    this.busyOrderId = order._id;
    this.orderService.cancelOrder(order._id).pipe(take(1)).subscribe((ok) => {
      if (ok) {
        this.orders = this.orders.map((x) => (x._id === order._id ? { ...x, order_status: 'cancelled' } : x));
      } else {
        this.error = 'Không thể hủy đơn hàng.';
      }
      this.busyOrderId = '';
    });
  }

  requestReturn(order: MyOrderItemView): void {
    this.busyOrderId = order._id;
    this.orderService.requestReturn(order._id).pipe(take(1)).subscribe((ok) => {
      if (ok) {
        this.orders = this.orders.map((x) =>
          x._id === order._id ? { ...x, fulfillment_status: 'returned' } : x
        );
      } else {
        this.error = 'Không thể tạo yêu cầu trả hàng.';
      }
      this.busyOrderId = '';
    });
  }

  reorder(order: MyOrderItemView): void {
    this.busyOrderId = order._id;
    this.orderService.reorder(order._id).pipe(take(1)).subscribe((ok) => {
      this.busyOrderId = '';
      if (ok) {
        this.router.navigateByUrl('/cart');
      } else {
        this.error = 'Không thể mua lại từ đơn hàng này.';
      }
    });
  }

  canCancel(order: MyOrderItemView): boolean {
    const s = (order.order_status || '').toLowerCase();
    return s === 'pending';
  }

  canReturn(order: MyOrderItemView): boolean {
    const s = (order.order_status || '').toLowerCase();
    return ['delivered', 'completed'].includes(s);
  }

  statusLabel(order: MyOrderItemView): string {
    return this.orderService.getStatusLabel(order.order_status, order.fulfillment_status);
  }

  statusLabelByString(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  statusClass(order: MyOrderItemView): string {
    return this.orderService.getStatusClass(order.order_status, order.fulfillment_status);
  }

  private matchesTab(order: MyOrderItemView): boolean {
    if (this.activeTab === 'all') return true;
    const status = this.statusLabel(order);
    return (
      (this.activeTab === 'processing' && ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị hàng'].includes(status)) ||
      (this.activeTab === 'shipping' && status === 'Đang giao hàng') ||
      (this.activeTab === 'delivered' && ['Đã giao hàng', 'Hoàn tất'].includes(status)) ||
      (this.activeTab === 'cancelled' && status === 'Đã hủy') ||
      (this.activeTab === 'returned' && ['Yêu cầu trả hàng', 'Đã trả hàng'].includes(status))
    );
  }
}
