import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponsApiService } from '../../services/coupons-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Coupon, CouponStatus } from '../../models/coupon.model';

@Component({
  selector: 'app-coupon-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './coupon-list-page.component.html',
  styleUrl: './coupon-list-page.component.css'
})
export class CouponListPageComponent implements OnInit {
  private readonly api = inject(CouponsApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  coupons = signal<Coupon[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  statusFilter = signal<CouponStatus | 'all'>('all');

  filteredCoupons = computed(() => {
    let list = this.coupons();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(c =>
        c.couponCode.toLowerCase().includes(q) ||
        c.promotionName.toLowerCase().includes(q)
      );
    }
    const s = this.statusFilter();
    if (s !== 'all') list = list.filter(c => c.status === s);
    return list;
  });

  hasActiveFilters = computed(() =>
    this.searchQuery() !== '' || this.statusFilter() !== 'all'
  );

  ngOnInit(): void {
    this.api.getAll().subscribe({
      next: data => {
        this.coupons.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load coupons');
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
  }

  toggleStatus(e: Event, coupon: Coupon): void {
    e.stopPropagation();
    e.preventDefault();
    this.api.toggleStatus(coupon.id).subscribe({
      next: updated => {
        this.coupons.update(list =>
          list.map(c => c.id === updated.id ? updated : c)
        );
        this.toast.success(`Coupon ${updated.couponStatus === 'active' ? 'activated' : 'deactivated'}`);
      },
      error: () => this.toast.error('Failed to update coupon status')
    });
  }

  async deleteCoupon(e: Event, coupon: Coupon): Promise<void> {
    e.stopPropagation();
    e.preventDefault();
    const confirmed = await this.dialog.confirm({
      title: 'Delete Coupon',
      message: `Delete coupon "${coupon.couponCode}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
    });
    if (!confirmed) return;

    this.api.delete(coupon.id).subscribe({
      next: () => {
        this.coupons.update(list => list.filter(c => c.id !== coupon.id));
        this.toast.success('Coupon deleted');
      },
      error: () => this.toast.error('Failed to delete coupon')
    });
  }

  copyCode(e: Event, code: string): void {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(code).then(() => {
      this.toast.info('Coupon code copied!');
    });
  }

  formatDiscount(c: Coupon): string {
    if (c.discountType === 'percentage') return `${c.discountValue}%`;
    if (c.discountType === 'fixed') return `${c.discountValue.toLocaleString('vi-VN')}₫`;
    return 'Free shipping';
  }

  formatUsage(c: Coupon): string {
    if (c.usageLimitTotal === 0) return 'Unlimited';
    return `${c.usedCount} / ${c.usageLimitTotal}`;
  }

  getStatusBadgeClass(status: CouponStatus): string {
    const map: Record<CouponStatus, string> = {
      active: 'badge-success',
      inactive: 'badge-muted',
      scheduled: 'badge-info',
      expired: 'badge-warning',
    };
    return map[status];
  }

  getStatusLabel(status: CouponStatus): string {
    const map: Record<CouponStatus, string> = {
      active: 'Active',
      inactive: 'Inactive',
      scheduled: 'Scheduled',
      expired: 'Expired',
    };
    return map[status];
  }
}
