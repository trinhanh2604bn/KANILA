import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaymentsApiService } from '../../services/payments-api.service';
import { Payment } from '../../models/payment.model';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payment-list-page.component.html',
  styleUrl: './payment-list-page.component.css'
})
export class PaymentListPageComponent implements OnInit {
  private api = inject(PaymentsApiService);

  payments = signal<Payment[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  statusFilter = signal('all');

  ngOnInit() {
    this.api.getPayments().subscribe({
      next: (data) => {
        this.payments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  filteredPayments = computed(() => {
    let list = this.payments();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    if (status !== 'all') {
      list = list.filter(p => p.status === status);
    }
    if (q) {
      list = list.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.orderNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q)
      );
    }
    return list;
  });

  hasActiveFilters = computed(() => {
    return this.statusFilter() !== 'all' || this.searchQuery().trim() !== '';
  });

  clearFilters(): void {
    this.statusFilter.set('all');
    this.searchQuery.set('');
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      success: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger',
    };
    return map[status] || 'badge-secondary';
  }
}
