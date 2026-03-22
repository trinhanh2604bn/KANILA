import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponsApiService } from '../../services/coupons-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CreateCouponPayload } from '../../models/coupon.model';

@Component({
  selector: 'app-coupon-form-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './coupon-form-page.component.html',
  styleUrl: './coupon-form-page.component.css'
})
export class CouponFormPageComponent implements OnInit {
  private readonly api = inject(CouponsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  isEditMode = signal(false);
  loading = signal(false);
  saving = signal(false);
  couponId = signal('');

  // Form fields
  couponCode = signal('');
  promotionId = signal('');
  isActive = signal(true);
  discountType = signal<'percentage' | 'fixed'>('percentage');
  discountValue = signal(10);
  minOrderAmount = signal(0);
  usageLimitTotal = signal(0);
  usageLimitPerCustomer = signal(0);
  validFrom = signal('');
  validTo = signal('');

  // Dynamic discount preview
  previewOriginal = 500000;

  previewDiscount = computed(() => {
    const t = this.discountType();
    const v = this.discountValue();
    if (t === 'percentage') return Math.round(this.previewOriginal * v / 100);
    if (t === 'fixed') return Math.min(v, this.previewOriginal);
    return 0;
  });

  previewFinal = computed(() => this.previewOriginal - this.previewDiscount());

  previewLabel = computed(() => {
    const t = this.discountType();
    if (t === 'percentage') return `${this.discountValue()}% off`;
    return `${this.discountValue().toLocaleString('vi-VN')}₫ off`;
  });

  previewMeetsMinimum = computed(() => {
    const min = this.minOrderAmount();
    return min === 0 || this.previewOriginal >= min;
  });

  validityHint = computed(() => {
    const from = this.validFrom();
    const to = this.validTo();
    if (!from && !to) return '';
    const now = new Date();
    if (from && new Date(from) > now) return '⏳ Scheduled';
    if (to && new Date(to) < now) return '⚠️ Expired';
    return '✅ Active';
  });

  get pageTitle(): string {
    return this.isEditMode() ? 'Edit Coupon' : 'Create Coupon';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.couponId.set(id);
      this.loading.set(true);
      this.api.getById(id).subscribe({
        next: (c) => {
          this.couponCode.set(c.couponCode);
          this.promotionId.set(c.promotionId);
          this.isActive.set(c.couponStatus === 'active');
          this.discountType.set(c.discountType === 'free_shipping' ? 'percentage' : c.discountType);
          this.discountValue.set(c.discountValue);
          this.minOrderAmount.set(c.minOrderAmount);
          this.usageLimitTotal.set(c.usageLimitTotal);
          this.usageLimitPerCustomer.set(c.usageLimitPerCustomer);
          this.validFrom.set(c.validFrom?.slice(0, 10) || '');
          this.validTo.set(c.validTo?.slice(0, 10) || '');
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Coupon not found');
          this.loading.set(false);
        }
      });
    }
  }

  onCodeInput(): void {
    this.couponCode.update(v => v.toUpperCase().trim());
  }

  isValid(): boolean {
    return this.couponCode().trim().length > 0 && this.promotionId().trim().length > 0;
  }

  save(): void {
    if (!this.isValid() || this.saving()) return;
    this.saving.set(true);

    const payload: CreateCouponPayload = {
      promotionId: this.promotionId(),
      couponCode: this.couponCode().toUpperCase().trim(),
      validFrom: this.validFrom() ? new Date(this.validFrom()).toISOString() : undefined,
      validTo: this.validTo() ? new Date(this.validTo()).toISOString() : undefined,
      usageLimitTotal: this.usageLimitTotal(),
      usageLimitPerCustomer: this.usageLimitPerCustomer(),
      minOrderAmount: this.minOrderAmount(),
      couponStatus: this.isActive() ? 'active' : 'inactive',
    };

    const obs = this.isEditMode()
      ? this.api.update(this.couponId(), payload)
      : this.api.create(payload);

    obs.subscribe({
      next: (coupon) => {
        this.saving.set(false);
        this.toast.success(this.isEditMode() ? 'Coupon updated' : 'Coupon created');
        this.router.navigate(['/coupons', coupon.id]);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save coupon');
      }
    });
  }

  formatPrice(val: number): string {
    return val.toLocaleString('vi-VN') + '₫';
  }
}
