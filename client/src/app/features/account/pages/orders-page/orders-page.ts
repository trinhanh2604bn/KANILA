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
    { key: 'delivered', label: 'Đã giao' },
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
    return ['pending', 'confirmed', 'processing'].includes(s);
  }

  canReturn(order: MyOrderItemView): boolean {
    const orderStatus = (order.order_status || '').toLowerCase();
    const ff = (order.fulfillment_status || '').toLowerCase();
    return orderStatus === 'completed' || ff === 'fulfilled';
  }

  statusLabel(order: MyOrderItemView): string {
    if ((order.fulfillment_status || '').toLowerCase() === 'returned') return 'Trả hàng';
    const status = (order.order_status || '').toLowerCase();
    if (['pending', 'confirmed', 'processing'].includes(status)) return 'Đang xử lý';
    if (status === 'cancelled') return 'Đã hủy';
    if (status === 'completed') return 'Đã giao';
    if ((order.shipment_status || '').toLowerCase().includes('ship')) return 'Đang giao';
    return status || 'Đơn hàng';
  }

  statusClass(order: MyOrderItemView): string {
    const lbl = this.statusLabel(order);
    if (lbl === 'Đã giao') return 'done';
    if (lbl === 'Đang giao') return 'shipping';
    if (lbl === 'Đã hủy') return 'cancelled';
    if (lbl === 'Trả hàng') return 'returned';
    return 'processing';
  }

  private matchesTab(order: MyOrderItemView): boolean {
    if (this.activeTab === 'all') return true;
    const status = this.statusLabel(order);
    return (
      (this.activeTab === 'processing' && status === 'Đang xử lý') ||
      (this.activeTab === 'shipping' && status === 'Đang giao') ||
      (this.activeTab === 'delivered' && status === 'Đã giao') ||
      (this.activeTab === 'cancelled' && status === 'Đã hủy') ||
      (this.activeTab === 'returned' && status === 'Trả hàng')
    );
  }
}
