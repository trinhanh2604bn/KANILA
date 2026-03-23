import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PromotionsApiService } from '../../services/promotions-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Promotion, PromotionStatus, PromotionType } from '../../models/promotion.model';

@Component({
  selector: 'app-promotion-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './promotion-detail-page.component.html',
  styleUrl: './promotion-detail-page.component.css'
})
export class PromotionDetailPageComponent implements OnInit {
  private readonly api = inject(PromotionsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  promotion = signal<Promotion | null>(null);
  loading = signal(true);

  previewOriginal = 500000;

  previewDiscount = computed(() => {
    const p = this.promotion();
    if (!p) return 0;
    if (p.type === 'percentage') return Math.round(this.previewOriginal * p.discountValue / 100);
    if (p.type === 'fixed') return Math.min(p.discountValue, this.previewOriginal);
    return 0;
  });

  previewFinal = computed(() => this.previewOriginal - this.previewDiscount());

  usagePercentage = computed(() => {
    const p = this.promotion();
    if (!p || p.usageLimit === 0) return 0;
    return Math.min(100, Math.round((p.usageCount / p.usageLimit) * 100));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.api.getById(id).subscribe({
      next: (data) => {
        this.promotion.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Promotion not found');
        this.loading.set(false);
      }
    });
  }

  toggleStatus(): void {
    const p = this.promotion();
    if (!p) return;
    this.api.toggleStatus(p.id).subscribe(updated => {
      this.promotion.set(updated);
      this.toast.success(`Promotion ${updated.status === 'active' ? 'activated' : 'deactivated'}`);
    });
  }

  formatDiscount(p: Promotion): string {
    if (p.type === 'percentage') return `${p.discountValue}%`;
    if (p.type === 'fixed') return `${p.discountValue.toLocaleString('vi-VN')}₫`;
    return 'Free shipping';
  }

  getTypeLabel(type: PromotionType): string {
    const labels: Record<PromotionType, string> = { percentage: 'Percentage', fixed: 'Fixed Amount', free_shipping: 'Free Shipping' };
    return labels[type];
  }

  getScopeLabel(scope: string): string {
    const labels: Record<string, string> = { all: 'All products', categories: 'Selected categories', products: 'Selected products' };
    return labels[scope] || scope;
  }

  getStatusBadgeClass(status: PromotionStatus): string {
    const map: Record<PromotionStatus, string> = { draft: 'badge-muted', active: 'badge-success', inactive: 'badge-muted', scheduled: 'badge-info', expired: 'badge-warning' };
    return map[status];
  }

  formatPrice(val: number): string {
    return val.toLocaleString('vi-VN') + '₫';
  }
}
