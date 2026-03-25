import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { catchError, of, take } from 'rxjs';
import { CheckoutService } from '../../../checkout/services/checkout.service';
import { PaymentMethodOption } from '../../../checkout/models/checkout.model';

@Component({
  selector: 'app-payment-methods-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-methods-page.html',
  styleUrls: ['./payment-methods-page.css'],
})
export class PaymentMethodsPageComponent implements OnInit {
  isLoading = true;
  error = '';
  methods: PaymentMethodOption[] = [];

  // Keep this lightweight — selection happens during checkout.
  noteText = 'Bạn có thể chọn phương thức thanh toán khi thanh toán đơn hàng.';

  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  private loadPaymentMethods(): void {
    this.isLoading = true;
    this.error = '';
    this.checkoutService
      .getPaymentMethods()
      .pipe(
        take(1),
        catchError((err) => {
          this.error = err?.error?.message || 'Không thể tải phương thức thanh toán. Vui lòng thử lại.';
          return of([] as PaymentMethodOption[]);
        })
      )
      .subscribe((rows) => {
        this.methods = rows;
        this.isLoading = false;
      });
  }

  trackById(_: number, item: PaymentMethodOption): string {
    return String(item._id);
  }

  getMethodIcon(method: PaymentMethodOption): string {
    const t = String(method.method_type || '').toLowerCase();
    if (t.includes('cod')) return 'bi-cash-stack';
    if (t.includes('bank') || t.includes('transfer')) return 'bi-bank';
    if (t.includes('card') || t.includes('wallet') || t.includes('e-wallet')) return 'bi-credit-card';
    return 'bi-receipt';
  }

  getMethodPrimaryLabel(method: PaymentMethodOption): string {
    const t = String(method.method_type || '').toLowerCase();
    if (t.includes('cod')) return 'Thanh toán khi nhận hàng (COD)';
    if (t.includes('bank') || t.includes('transfer')) return 'Chuyển khoản ngân hàng';
    if (t.includes('card')) return 'Thanh toán thẻ';
    if (t.includes('wallet') || t.includes('e-wallet')) return 'Ví điện tử';
    return method.payment_method_name || method.payment_method_code || 'Phương thức thanh toán';
  }

  goToCheckout(): void {
    // Let checkout handle the real selection; just guide users.
    this.router.navigate(['/checkout']);
  }
}

