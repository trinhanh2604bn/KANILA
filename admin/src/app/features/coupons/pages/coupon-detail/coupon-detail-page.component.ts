import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponsApiService } from '../../services/coupons-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Router } from '@angular/router';
import { Coupon, CouponStatus } from '../../models/coupon.model';

@Component({
  selector: 'app-coupon-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './coupon-detail-page.component.html',
  styleUrl: './coupon-detail-page.component.css'
})
export class CouponDetailPageComponent implements OnInit {
  private readonly api = inject(CouponsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  coupon = signal<Coupon | null>(null);
  loading = signal(true);
  copied = signal(false);
  usageRows = signal<any[]>([]);
  assignInput = signal('');

  previewOriginal = 500000;

  previewDiscount = computed(() => {
    const c = this.coupon();
    if (!c) return 0;
    if (c.discountType === 'percentage') return Math.round(this.previewOriginal * c.discountValue / 100);
    if (c.discountType === 'fixed') return Math.min(c.discountValue, this.previewOriginal);
    return 0;
  });

  previewFinal = computed(() => this.previewOriginal - this.previewDiscount());

  usagePercentage = computed(() => {
    const c = this.coupon();
    if (!c || c.usageLimitTotal === 0) return 0;
    return Math.min(100, Math.round((c.usedCount / c.usageLimitTotal) * 100));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.api.getById(id).subscribe({
      next: (data) => {
        this.coupon.set(data);
        this.loadUsage(data.id);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Coupon not found');
        this.loading.set(false);
      }
    });
  }

  assignCoupon(): void {
    const c = this.coupon();
    const raw = this.assignInput().trim();
    if (!c || !raw) return;
    const customerIds = raw.split(/[,\s]+/).map((x) => x.trim()).filter((x) => !!x);
    if (!customerIds.length) return;
    this.api.assignToUsers(c.id, customerIds).subscribe({
      next: (res) => {
        this.toast.success(`Assigned coupon: +${res.upserted}, existing ${res.matched}`);
        this.assignInput.set('');
      },
      error: () => this.toast.error('Failed to assign coupon')
    });
  }

  copyCode(): void {
    const c = this.coupon();
    if (!c) return;
    navigator.clipboard.writeText(c.couponCode).then(() => {
      this.copied.set(true);
      this.toast.info('Coupon code copied!');
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  toggleStatus(): void {
    const c = this.coupon();
    if (!c) return;
    this.api.toggleStatus(c.id).subscribe({
      next: updated => {
        this.coupon.set(updated);
        this.toast.success(`Coupon ${updated.couponStatus === 'active' ? 'activated' : 'deactivated'}`);
      },
      error: () => this.toast.error('Failed to update status')
    });
  }

  async deleteCoupon(): Promise<void> {
    const c = this.coupon();
    if (!c) return;
    const confirmed = await this.dialog.confirm({
      title: 'Delete Coupon',
      message: `Delete coupon "${c.couponCode}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
    });
    if (!confirmed) return;

    this.api.delete(c.id).subscribe({
      next: () => {
        this.toast.success('Coupon deleted');
        this.router.navigate(['/coupons']);
      },
      error: () => this.toast.error('Failed to delete coupon')
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
      active: 'badge-success', inactive: 'badge-muted',
      scheduled: 'badge-info', expired: 'badge-warning',
    };
    return map[status];
  }

  getStatusLabel(status: CouponStatus): string {
    const map: Record<CouponStatus, string> = {
      active: 'Active', inactive: 'Inactive',
      scheduled: 'Scheduled', expired: 'Expired',
    };
    return map[status];
  }

  formatPrice(val: number): string {
    return val.toLocaleString('vi-VN') + '₫';
  }

  private loadUsage(id: string): void {
    this.api.getUsage(id).subscribe({
      next: (rows) => this.usageRows.set(rows),
      error: () => this.usageRows.set([]),
    });
  }
}
