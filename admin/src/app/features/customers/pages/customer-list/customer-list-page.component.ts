import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersApiService } from '../../services/customers-api.service';
import { Customer, CustomerSegment } from '../../models/customer.model';

@Component({
  selector: 'app-customer-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './customer-list-page.component.html',
  styleUrl: './customer-list-page.component.css'
})
export class CustomerListPageComponent implements OnInit {
  private readonly api = inject(CustomersApiService);

  customers = signal<Customer[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  segmentFilter = signal<CustomerSegment | 'all'>('all');
  sortBy = signal<'totalSpent' | 'name'>('totalSpent');
  sortDir = signal<'asc' | 'desc'>('desc');

  filteredCustomers = computed(() => {
    let list = this.customers();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    const seg = this.segmentFilter();
    if (seg !== 'all') list = list.filter(c => c.segment === seg);

    const sort = this.sortBy();
    const dir = this.sortDir();
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sort === 'totalSpent') cmp = a.totalSpent - b.totalSpent;
      else cmp = a.name.localeCompare(b.name);
      return dir === 'desc' ? -cmp : cmp;
    });
    return list;
  });

  hasActiveFilters = computed(() =>
    this.searchQuery() !== '' || this.segmentFilter() !== 'all'
  );

  ngOnInit(): void {
    this.api.getAll().subscribe(data => {
      this.customers.set(data);
      this.loading.set(false);
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.segmentFilter.set('all');
  }

  toggleSort(field: 'totalSpent' | 'name'): void {
    if (this.sortBy() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('desc');
    }
  }

  getSegmentBadgeClass(segment: CustomerSegment): string {
    const map: Record<CustomerSegment, string> = {
      new: 'badge-info',
      active: 'badge-success',
      vip: 'badge-primary',
      at_risk: 'badge-warning',
    };
    return map[segment];
  }

  getSegmentLabel(segment: CustomerSegment): string {
    const map: Record<CustomerSegment, string> = {
      new: 'New',
      active: 'Active',
      vip: 'VIP',
      at_risk: 'At Risk',
    };
    return map[segment];
  }

  getStatusDotClass(status: string): string {
    return status === 'active' ? 'dot-success' : 'dot-muted';
  }

  formatPrice(val: number): string {
    return val.toLocaleString('vi-VN') + '₫';
  }
}
