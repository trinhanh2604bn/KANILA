import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: AccountOrderService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const id = String(this.route.snapshot.paramMap.get('id') || '');
    if (!id) {
      this.error = 'Không tìm thấy mã đơn hàng.';
      return;
    }
    this.loadData(id);
  }

  get timeline(): Array<{ key: string; label: string; done: boolean; active: boolean }> {
    const s = String(this.detail?.order_status || '').toLowerCase();
    const steps = [
      { key: 'pending', label: 'Đặt hàng' },
      { key: 'confirmed', label: 'Xác nhận' },
      { key: 'shipped', label: 'Đang giao' },
      { key: 'delivered', label: 'Đã giao' },
    ];

    let currentIndex = 0;
    if (['delivered', 'completed', 'returned', 'refunded', 'return_requested', 'return_approved'].includes(s)) currentIndex = 3;
    else if (['shipped', 'in_transit'].includes(s)) currentIndex = 2;
    else if (['confirmed', 'processing', 'ready_to_ship'].includes(s)) currentIndex = 1;
    else currentIndex = 0;

    return steps.map((step, idx) => ({
      ...step,
      done: idx <= currentIndex,
      active: idx === currentIndex,
    }));
  }

  statusLabel(status: string, ff?: string): string {
    return this.orderService.getStatusLabel(status, ff);
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

  goWriteReview(orderItemId: string): void {
    this.router.navigate(['/account/reviews/write', orderItemId]);
  }
}
