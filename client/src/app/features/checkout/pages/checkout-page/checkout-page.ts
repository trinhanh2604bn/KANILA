import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { CartService } from '../../../cart/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  CheckoutSessionView,
  PaymentMethodOption as PaymentMethodApiOption,
  ShippingMethodOption as ShippingMethodApiOption,
} from '../../models/checkout.model';
import { CheckoutService } from '../../services/checkout.service';
import { AuthService } from '../../../../core/services/auth.service';

interface CheckoutLineItem {
  id: string;
  name: string;
  variant: string;
  image: string;
  quantity: number;
  price: number;
}

interface ShippingMethodOption {
  id: string;
  label: string;
  eta: string;
  fee: number;
}

interface PaymentMethodOption {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout-page.html',
  styleUrls: ['./checkout-page.css'],
})
export class CheckoutPageComponent implements OnInit {
  readonly freeShippingThreshold = 499000;
  shippingMethods: ShippingMethodOption[] = [];
  paymentMethods: PaymentMethodOption[] = [];

  cartItems: CheckoutLineItem[] = [];
  subtotal = 0;
  baseDiscount = 0;
  shippingFeeFromSession = 0;
  sessionGrandTotal = 0;
  selectedShippingId = '';
  selectedPaymentId = '';
  voucherInput = '';
  appliedVoucher = '';
  voucherDiscount = 0;
  checkoutSessionId: string | null = null;
  placingOrder = false;
  isSyncingSession = false;
  formSubmitted = false;
  checkoutIssues: string[] = [];
  uiHint = '';

  contactName = '';
  phone = '';
  addressLine = '';
  note = '';
  city = 'TP. Ho Chi Minh';
  district = 'Quận 1';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cartService: CartService,
    private readonly checkoutService: CheckoutService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.isAuthenticated()) {
      this.checkoutIssues = ['Vui lòng đăng nhập để tiếp tục thanh toán.'];
      this.toast.warning(this.checkoutIssues[0]);
      this.router.navigate(['/auth/login']);
      return;
    }

    forkJoin({
      shipping: this.checkoutService.getShippingMethods().pipe(catchError(() => of<ShippingMethodApiOption[]>([]))),
      payment: this.checkoutService.getPaymentMethods().pipe(catchError(() => of<PaymentMethodApiOption[]>([]))),
    }).subscribe(({ shipping, payment }) => {
      if (shipping.length) {
        this.shippingMethods = shipping.map((m) => this.toUiShippingMethod(m));
        this.selectedShippingId = this.shippingMethods[0].id;
      }
      if (payment.length) {
        this.paymentMethods = payment.map((m) => this.toUiPaymentMethod(m));
        this.selectedPaymentId = this.paymentMethods[0].id;
      }
      this.bootstrapCheckoutSession();
    });
  }

  get selectedShipping(): ShippingMethodOption {
    return this.shippingMethods.find((m) => m.id === this.selectedShippingId) ?? {
      id: '',
      label: '',
      eta: '',
      fee: 0,
    };
  }

  get shippingFee(): number {
    return this.shippingFeeFromSession;
  }

  get totalDiscount(): number {
    return this.baseDiscount + this.voucherDiscount;
  }

  get amountToFreeShipping(): number {
    return Math.max(0, this.freeShippingThreshold - this.subtotal);
  }

  get grandTotal(): number {
    return this.sessionGrandTotal || Math.max(0, this.subtotal - this.totalDiscount + this.shippingFee);
  }

  get savingsTotal(): number {
    return this.totalDiscount;
  }

  get showShimmerSkeleton(): boolean {
    return this.isSyncingSession && !this.checkoutSessionId;
  }

  get invalidName(): boolean {
    return this.formSubmitted && this.contactName.trim().length < 2;
  }

  get invalidPhone(): boolean {
    const phone = this.phone.trim();
    return this.formSubmitted && !/^[0-9]{9,11}$/.test(phone);
  }

  get invalidAddress(): boolean {
    return this.formSubmitted && this.addressLine.trim().length < 8;
  }

  applyVoucher(): void {
    const code = this.voucherInput.trim().toUpperCase();
    if (!code) return;
    this.uiHint = 'Đang kiểm tra mã ưu đãi...';
    this.syncCheckoutSession({ couponCode: code });
  }

  clearVoucher(): void {
    this.appliedVoucher = '';
    this.voucherInput = '';
    this.voucherDiscount = 0;
    this.syncCheckoutSession({ couponCode: null });
  }

  placeOrder(): void {
    this.formSubmitted = true;
    if (this.invalidName || this.invalidPhone || this.invalidAddress || !this.cartItems.length) return;
    if (!this.checkoutSessionId) {
      this.toast.error('Không thể tạo phiên thanh toán. Vui lòng thử lại.');
      return;
    }
    this.placingOrder = true;
    this.checkoutService.placeOrder(this.checkoutSessionId, this.note || '').pipe(take(1)).subscribe({
      next: (result) => {
        this.cartService.getCurrentCart().pipe(take(1)).subscribe();
        this.placingOrder = false;
        this.router.navigate(['/orders', 'success'], {
          queryParams: { id: result.orderId },
          state: {
            orderId: result.orderId,
            orderNumber: result.orderNumber,
          },
        });
      },
      error: (err) => {
        this.placingOrder = false;
        const issues = this.checkoutService.mapIssues(err);
        this.checkoutIssues = issues.map((x) => x.message);
        this.toast.error(this.checkoutIssues[0] || 'Đặt hàng thất bại. Vui lòng thử lại.');
      },
    });
  }

  onShippingMethodChange(): void {
    this.syncCheckoutSession({ shippingMethodId: this.selectedShippingId });
  }

  onPaymentMethodChange(): void {
    this.syncCheckoutSession({ paymentMethodId: this.selectedPaymentId });
  }

  onPhoneInput(): void {
    this.phone = this.phone.replace(/[^\d]/g, '').slice(0, 11);
  }

  private bootstrapCheckoutSession(): void {
    const requestedSessionId = this.route.snapshot.queryParamMap.get('sessionId');
    if (requestedSessionId) {
      this.isSyncingSession = true;
      this.checkoutService.getMyCheckoutSessionById(requestedSessionId).pipe(take(1)).subscribe({
        next: (session) => {
          this.isSyncingSession = false;
          this.applySession(session);
        },
        error: (err) => {
          this.isSyncingSession = false;
          const issues = this.checkoutService.mapIssues(err);
          this.checkoutIssues = issues.map((x) => x.message);
        },
      });
      return;
    }

    this.checkoutService.prepareCheckout().pipe(take(1)).subscribe((ready) => {
      if (!ready.success) {
        this.checkoutIssues = ready.issues.map((x) => x.message);
        if (!this.checkoutIssues.length) {
          this.checkoutIssues = ['Không thể chuẩn bị thanh toán. Vui lòng kiểm tra lại giỏ hàng.'];
        }
        return;
      }
      this.syncCheckoutSession();
    });
  }

  private syncCheckoutSession(overrides: {
    shippingMethodId?: string | null;
    paymentMethodId?: string | null;
    couponCode?: string | null;
  } = {}): void {
    this.isSyncingSession = true;
    this.checkoutIssues = [];
    const payload = {
      shippingMethodId: overrides.shippingMethodId !== undefined ? overrides.shippingMethodId : this.selectedShippingId || null,
      paymentMethodId: overrides.paymentMethodId !== undefined ? overrides.paymentMethodId : this.selectedPaymentId || null,
      couponCode: overrides.couponCode !== undefined ? overrides.couponCode : this.appliedVoucher || null,
      shippingAddress:
        this.contactName && this.phone && this.addressLine && this.city
          ? {
              recipientName: this.contactName,
              phone: this.phone,
              addressLine1: this.addressLine,
              district: this.district,
              city: this.city,
              countryCode: 'VN',
            }
          : undefined,
    };

    const req$ = this.checkoutSessionId
      ? this.checkoutService.updateCheckoutSession(this.checkoutSessionId, payload)
      : this.checkoutService.createCheckoutSession(payload);

    req$.pipe(take(1)).subscribe({
      next: (session) => {
        this.isSyncingSession = false;
        this.applySession(session);
        this.uiHint = 'Thông tin thanh toán đã được cập nhật.';
      },
      error: (err) => {
        this.isSyncingSession = false;
        const issues = this.checkoutService.mapIssues(err);
        this.checkoutIssues = issues.map((x) => x.message).filter((x) => !!x);
        if (!this.checkoutIssues.length && Number(err?.status) === 409) {
          this.checkoutIssues = ['Giỏ hàng có sản phẩm không hợp lệ hoặc đã thay đổi. Vui lòng kiểm tra lại.'];
        }
        this.uiHint = '';
      },
    });
  }

  private isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  private applySession(session: CheckoutSessionView): void {
    this.checkoutSessionId = session.sessionId;
    this.appliedVoucher = session.appliedCouponCode || '';
    this.voucherInput = session.appliedCouponCode || this.voucherInput;
    this.cartItems = session.selectedItems.map((item) => ({
      id: item.cartItemId,
      name: item.productName,
      variant: item.variantName,
      image: item.imageUrl || 'assets/images/banner/nen.png',
      quantity: item.quantity,
      price: item.unitPrice,
    }));
    this.subtotal = session.subtotal;
    this.shippingFeeFromSession = session.shippingFee;
    this.baseDiscount = session.discount;
    this.voucherDiscount = 0; // backend exposes total discount only; keep voucher line informational
    this.sessionGrandTotal = session.total;

    if (session.selectedShippingMethodId) this.selectedShippingId = session.selectedShippingMethodId;
    if (session.selectedPaymentMethodId) this.selectedPaymentId = session.selectedPaymentMethodId;
    if (session.shippingAddress) {
      this.contactName = session.shippingAddress.recipient_name || this.contactName;
      this.phone = session.shippingAddress.phone || this.phone;
      this.addressLine = session.shippingAddress.address_line_1 || this.addressLine;
      this.district = session.shippingAddress.district || this.district;
      this.city = session.shippingAddress.city || this.city;
    }
  }

  private toUiShippingMethod(method: ShippingMethodApiOption): ShippingMethodOption {
    const level = String(method.service_level || '').toLowerCase();
    const fee = level.includes('express') ? 45000 : 30000;
    const eta = level.includes('express') ? '1 ngày làm việc' : '2-3 ngày làm việc';
    return {
      id: method._id,
      label: method.shipping_method_name,
      eta,
      fee,
    };
  }

  private toUiPaymentMethod(method: PaymentMethodApiOption): PaymentMethodOption {
    const type = String(method.method_type || '').toLowerCase();
    const icon = type.includes('bank') || type.includes('transfer')
      ? 'bi-bank2'
      : type.includes('wallet')
        ? 'bi-wallet2'
        : 'bi-cash-coin';
    return {
      id: method._id,
      label: method.payment_method_name,
      subtitle: type.includes('cod') ? 'Thanh toán khi nhận hàng' : 'Thanh toán online',
      icon,
    };
  }
}
