import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReturnsApiService } from '../../services/returns-api.service';
import { ReturnRequest, ReturnStatus } from '../../models/return.model';

@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './return-list-page.component.html',
  styleUrl: './return-list-page.component.css',
})
export class ReturnListPageComponent implements OnInit {
  private api = inject(ReturnsApiService);

  returns = signal<ReturnRequest[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  statusFilter = signal('all');

  ngOnInit() {
    this.api.getReturns().subscribe({
      next: (data) => {
        this.returns.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get filteredReturns(): ReturnRequest[] {
    let list = this.returns();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    if (status !== 'all') {
      list = list.filter((r) => r.status === status);
    }

    if (q) {
      list = list.filter((r) => {
        const id = (r.id ?? '').toLowerCase();
        const retNum = (r.returnNumber ?? '').toLowerCase();
        const ord = (r.orderId ?? '').toLowerCase();
        const ordNum = (r.orderNumber ?? '').toLowerCase();
        const cust = (r.customerName ?? '').toLowerCase();
        return (
          id.includes(q) ||
          retNum.includes(q) ||
          ord.includes(q) ||
          ordNum.includes(q) ||
          cust.includes(q)
        );
      });
    }
    return list;
  }

  /** Shown in Return ID column: RMA / return number, or shortened id fallback */
  displayReturnRef(ret: ReturnRequest): string {
    if (ret.returnNumber?.trim()) return ret.returnNumber;
    const id = ret.id;
    if (id && id.length > 10) return `#${id.slice(-8).toUpperCase()}`;
    return id || '—';
  }

  formatReasonDisplay(reason: string): string {
    if (reason == null || reason === '' || reason === '—') return '—';
    return reason.replace(/_/g, ' ').trim();
  }

  statusLabel(status: ReturnStatus): string {
    const map: Record<ReturnStatus, string> = {
      requested: 'Pending Action',
      approved: 'Approved',
      received: 'Processing',
      completed: 'Completed',
      rejected: 'Rejected',
    };
    return map[status] ?? status;
  }
}
