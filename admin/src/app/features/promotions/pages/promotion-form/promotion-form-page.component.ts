import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionsApiService } from '../../services/promotions-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Promotion, PromotionType, ApplicableScope, CreatePromotionPayload } from '../../models/promotion.model';

@Component({
  selector: 'app-promotion-form-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './promotion-form-page.component.html',
  styleUrl: './promotion-form-page.component.css'
})
export class PromotionFormPageComponent implements OnInit {
  private readonly api = inject(PromotionsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  isEditMode = signal(false);
  loading = signal(false);
  saving = signal(false);
  promotionId = signal('');

  // Form fields
  name = signal('');
  description = signal('');
  type = signal<PromotionType>('percentage');
  discountValue = signal<number>(10);
  applicableScope = signal<ApplicableScope>('all');
  minOrderValue = signal<number>(0);
  usageLimit = signal<number>(0);
  perCustomerLimit = signal<number>(0);
  startDate = signal('');
  endDate = signal('');

  // Dynamic discount preview
  previewOriginal = 500000;

  previewDiscount = computed(() => {
    const t = this.type();
    const v = this.discountValue();
    if (t === 'percentage') return Math.round(this.previewOriginal * v / 100);
    if (t === 'fixed') return Math.min(v, this.previewOriginal);
    return 0; // free_shipping — no product discount
  });

  previewFinal = computed(() => this.previewOriginal - this.previewDiscount());

  previewLabel = computed(() => {
    const t = this.type();
    if (t === 'percentage') return `${this.discountValue()}% off`;
    if (t === 'fixed') return `${this.discountValue().toLocaleString('vi-VN')}₫ off`;
    return 'Free shipping applied';
  });

  showDiscountInput = computed(() => this.type() !== 'free_shipping');

  get pageTitle(): string {
    return this.isEditMode() ? 'Edit Promotion' : 'Create Promotion';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.promotionId.set(id);
      this.loading.set(true);
      this.api.getById(id).subscribe({
        next: (p) => {
          this.name.set(p.name);
          this.description.set(p.description);
          this.type.set(p.type);
          this.discountValue.set(p.discountValue);
          this.applicableScope.set(p.applicableScope);
          this.minOrderValue.set(p.minOrderValue);
          this.usageLimit.set(p.usageLimit);
          this.perCustomerLimit.set(p.perCustomerLimit);
          this.startDate.set(p.startDate?.slice(0, 10) || '');
          this.endDate.set(p.endDate?.slice(0, 10) || '');
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Promotion not found');
          this.loading.set(false);
        }
      });
    }
  }

  isValid(): boolean {
    return this.name().trim().length > 0
      && this.startDate() !== ''
      && this.endDate() !== '';
  }

  save(): void {
    if (!this.isValid() || this.saving()) return;
    this.saving.set(true);

    const payload: CreatePromotionPayload = {
      promotionName: this.name(),
      description: this.description(),
      discountType: this.type(),
      discountValue: this.type() === 'free_shipping' ? 0 : this.discountValue(),
      usageLimitTotal: this.usageLimit(),
      usageLimitPerCustomer: this.perCustomerLimit(),
      startAt: new Date(this.startDate()).toISOString(),
      endAt: this.endDate() ? new Date(this.endDate()).toISOString() : undefined,
    };

    const obs = this.isEditMode()
      ? this.api.update(this.promotionId(), payload)
      : this.api.create(payload);

    obs.subscribe({
      next: (promo) => {
        this.saving.set(false);
        this.toast.success(this.isEditMode() ? 'Promotion updated' : 'Promotion created');
        this.router.navigate(['/promotions', promo.id]);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save promotion');
      }
    });
  }

  formatPrice(val: number): string {
    return val.toLocaleString('vi-VN') + '₫';
  }
}
