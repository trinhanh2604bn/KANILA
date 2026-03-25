import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';
import { AccountOrderService, MyOrderDetailView, MyOrderTrackingView } from '../../services/order.service';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail-page.html',
  styleUrls: ['./order-detail-page.css'],
})
export class OrderDetailPageComponent implements OnInit {
  loading = false;
  error = '';
  detail: MyOrderDetailView | null = null;
  tracking: MyOrderTrackingView | null = null;

  constructor(private readonly route: ActivatedRoute, private readonly orderService: AccountOrderService) {}

  ngOnInit(): void {
    const id = String(this.route.snapshot.paramMap.get('id') || '');
    if (!id) {
      this.error = 'Không tìm thấy mã đơn hàng.';
      return;
    }
    this.loadData(id);
  }

  get timeline(): Array<{ key: string; label: string; done: boolean; active: boolean }> {
    const status = String(this.detail?.order_status || '').toLowerCase();
    const ff = String(this.detail?.fulfillment_status || '').toLowerCase();
    const steps = [
      { key: 'placed', label: 'Đặt hàng' },
      { key: 'confirmed', label: 'Xác nhận' },
      { key: 'shipping', label: 'Đang giao' },
      { key: 'delivered', label: 'Đã giao' },
    ];
    const currentIndex =
      status === 'completed' || ff === 'fulfilled'
        ? 3
        : ff === 'partially_fulfilled'
          ? 2
          : ['processing', 'confirmed'].includes(status)
            ? 1
            : 0;
    return steps.map((s, idx) => ({ ...s, done: idx <= currentIndex, active: idx === currentIndex }));
  }

  formatAddress(): string {
    const a = this.detail?.order_addresses?.[0];
    if (!a) return '';
    return [a.address_line_1, a.address_line_2, a.ward, a.district, a.city, a.country_code]
      .filter((x) => !!x)
      .join(', ');
  }

  private loadData(id: string): void {
    this.loading = true;
    this.error = '';
    this.orderService.getMyOrderDetail(id).pipe(take(1)).subscribe((detail) => {
      if (!detail) {
        this.loading = false;
        this.error = 'Không thể tải chi tiết đơn hàng.';
        return;
      }
      this.detail = detail;
      this.orderService.getMyOrderTracking(id).pipe(take(1)).subscribe((tracking) => {
        this.tracking = tracking;
        this.loading = false;
      });
    });
  }
}
