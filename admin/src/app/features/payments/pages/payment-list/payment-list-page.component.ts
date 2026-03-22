import { Component, inject, OnInit, signal } from '@angular/core';
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

  ngOnInit() {
    this.api.getPayments().subscribe({
      next: (data) => {
        this.payments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // Error handling covered by Interceptor/Toast in real app
      }
    });
  }

  get filteredPayments() {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.payments();
    return this.payments().filter(p => 
      p.id.toLowerCase().includes(q) || 
      p.orderId.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q)
    );
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  }
}
