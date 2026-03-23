import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomersApiService } from '../../services/customers-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Customer, CustomerSegment } from '../../models/customer.model';

@Component({
  selector: 'app-customer-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-detail-page.component.html',
  styleUrl: './customer-detail-page.component.css'
})
export class CustomerDetailPageComponent implements OnInit {
  private readonly api = inject(CustomersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  customer = signal<Customer | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.api.getById(id).subscribe({
      next: (data) => {
        this.customer.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Customer not found');
        this.loading.set(false);
      }
    });
  }

  getSegmentBadgeClass(segment: CustomerSegment): string {
    const map: Record<CustomerSegment, string> = { new: 'badge-info', active: 'badge-success', vip: 'badge-primary', at_risk: 'badge-warning' };
    return map[segment];
  }

  getSegmentLabel(segment: CustomerSegment): string {
    const map: Record<CustomerSegment, string> = { new: 'New', active: 'Active', vip: 'VIP', at_risk: 'At Risk' };
    return map[segment];
  }

  formatPrice(val: number): string {
    return val.toLocaleString('vi-VN') + '₫';
  }
}
