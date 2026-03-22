import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionsApiService } from '../../services/promotions-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Promotion, PromotionStatus, PromotionType } from '../../models/promotion.model';

@Component({
  selector: 'app-promotion-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './promotion-list-page.component.html',
  styleUrl: './promotion-list-page.component.css'
})
export class PromotionListPageComponent implements OnInit {
  private readonly api = inject(PromotionsApiService);
  private readonly toast = inject(ToastService);

  promotions = signal<Promotion[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  statusFilter = signal<PromotionStatus | 'all'>('all');
  typeFilter = signal<PromotionType | 'all'>('all');

  filteredPromotions = computed(() => {
    let list = this.promotions();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    const s = this.statusFilter();
    if (s !== 'all') list = list.filter(p => p.status === s);
    const t = this.typeFilter();
    if (t !== 'all') list = list.filter(p => p.type === t);
    return list;
  });

  hasActiveFilters = computed(() =>
    this.searchQuery() !== '' || this.statusFilter() !== 'all' || this.typeFilter() !== 'all'
  );

  ngOnInit(): void {
    this.api.getAll().subscribe({
      next: (data) => {
        this.promotions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Could not load promotions');
      },
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.typeFilter.set('all');
  }

  toggleStatus(e: Event, promo: Promotion): void {
    e.stopPropagation();
    e.preventDefault();
    this.api.toggleStatus(promo.id).subscribe({
      next: (updated) => {
        this.promotions.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        const msg =
          updated.promotionStatus === 'active'
            ? 'Promotion activated'
            : 'Promotion deactivated';
        this.toast.success(msg);
      },
      error: () => this.toast.error('Could not update promotion status'),
    });
  }

  duplicatePromotion(e: Event, promo: Promotion): void {
    e.stopPropagation();
    e.preventDefault();
    this.api.duplicate(promo.id).subscribe({
      next: (copy) => {
        this.promotions.update((list) => [copy, ...list]);
        this.toast.success(`"${copy.name}" created`);
      },
      error: () => this.toast.error('Could not duplicate promotion'),
    });
  }

  formatDiscount(p: Promotion): string {
    const t = p.discountType ?? p.type;
    if (t === 'percentage') return `${p.discountValue}%`;
    if (t === 'fixed') return `${p.discountValue.toLocaleString('vi-VN')}₫`;
    return 'Free shipping';
  }

  getTypeLabel(p: Promotion): string {
    const t = p.discountType ?? p.type;
    const labels: Record<PromotionType, string> = {
      percentage: 'Percentage',
      fixed: 'Fixed',
      free_shipping: 'Free Shipping',
    };
    return labels[t] ?? '—';
  }

  getStatusBadgeClass(status: PromotionStatus): string {
    const map: Record<PromotionStatus, string> = {
      draft: 'badge-muted',
      active: 'badge-success',
      inactive: 'badge-muted',
      scheduled: 'badge-info',
      expired: 'badge-warning',
    };
    return map[status];
  }
}
