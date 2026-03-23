import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PaymentsApiService } from '../../services/payments-api.service';
import { Payment } from '../../models/payment.model';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payment-detail-page.component.html',
  styleUrl: './payment-detail-page.component.css'
})
export class PaymentDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(PaymentsApiService);
  
  payment = signal<Payment | null>(null);
  loading = signal(true);
  
  // Refund State
  refundAmountInput = signal<number>(0);
  isConfirmingRefund = signal(false);
  isProcessingRefund = signal(false);
  refundError = signal('');
  refundSuccess = signal(false);

  remainingAmount = computed(() => {
    const p = this.payment();
    if (!p) return 0;
    return p.amount - p.refundedAmount;
  });

  isFullRefund = computed(() => {
    return this.refundAmountInput() === this.remainingAmount();
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getPayment(id).subscribe({
        next: (data) => {
          this.payment.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  }

  initiateRefund() {
    this.refundError.set('');
    const amount = Number(this.refundAmountInput());
    if (!amount || amount <= 0) {
      this.refundError.set('Please enter a valid refund amount.');
      return;
    }
    if (amount > this.remainingAmount()) {
      this.refundError.set('Refund amount cannot exceed remaining balance.');
      return;
    }
    this.isConfirmingRefund.set(true);
  }

  cancelRefund() {
    this.isConfirmingRefund.set(false);
    this.refundAmountInput.set(0);
    this.refundError.set('');
  }

  confirmRefund() {
    const p = this.payment();
    if (!p) return;
    
    this.isProcessingRefund.set(true);
    this.isConfirmingRefund.set(false);

    this.api.processRefund({ paymentId: p.id, amount: this.refundAmountInput() }).subscribe({
      next: (updatedPayment) => {
        this.payment.set(updatedPayment);
        this.isProcessingRefund.set(false);
        this.refundSuccess.set(true);
        const amountRef = this.refundAmountInput();
        this.refundAmountInput.set(0);
        setTimeout(() => this.refundSuccess.set(false), 5000); 
      },
      error: (err) => {
        this.isProcessingRefund.set(false);
        this.refundError.set('Something went wrong. Please try again.');
      }
    });
  }
}
