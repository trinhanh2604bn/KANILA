import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { CartService } from '../../../cart/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  BuyNowCheckoutContext,
  CheckoutSessionView,
  PaymentMethodOption as PaymentMethodApiOption,
  ShippingMethodOption as ShippingMethodApiOption,
} from '../../models/checkout.model';
import { CheckoutService } from '../../services/checkout.service';

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
  shippingMethods: ShippingMethodOption[] = [
    { id: '', label: 'Giao tiêu chuẩn', eta: '2-3 ngày làm việc', fee: 30000 },
  ];
  paymentMethods: PaymentMethodOption[] = [
    { id: '', label: 'Thanh toán khi nhận hàng', subtitle: 'COD an toàn và tiện lợi', icon: 'bi-cash-coin' },
  ];

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
  checkoutMode: 'cart' | 'buy_now' = 'cart';
  buyNowContext: BuyNowCheckoutContext | null = null;

  contactName = '';
  phone = '';
  addressLine = '';
  note = '';
  city = 'TP. Ho Chi Minh';
  district = 'Quận 1';

  constructor(
    private readonly cartService: CartService,
    private readonly checkoutService: CheckoutService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
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
      this.initializeCheckoutMode();
    });
  }

  get selectedShipping(): ShippingMethodOption {
    return this.shippingMethods.find((m) => m.id === this.selectedShippingId) ?? this.shippingMethods[0];
  }

  get shippingFee(): number {
    if (this.checkoutMode === 'buy_now') {
      if (!this.subtotal) return 0;
      const selectedFee = this.selectedShipping?.fee ?? 30000;
      return this.subtotal >= this.freeShippingThreshold ? 0 : selectedFee;
    }
    return this.shippingFeeFromSession;
  }

  get totalDiscount(): number {
    return this.baseDiscount + this.voucherDiscount;
  }

  get amountToFreeShipping(): number {
    return Math.max(0, this.freeShippingThreshold - this.subtotal);
  }

  get grandTotal(): number {
    if (this.checkoutMode === 'buy_now') {
      return Math.max(0, this.subtotal - this.totalDiscount + this.shippingFee);
    }
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
    if (this.checkoutMode === 'buy_now') {
      this.appliedVoucher = code;
      this.voucherDiscount = Math.round(this.subtotal * 0.1);
      this.uiHint = 'Đã áp dụng mã ưu đãi cho Mua ngay.';
      return;
    }
    this.uiHint = 'Đang kiểm tra mã ưu đãi...';
    this.syncCheckoutSession({ couponCode: code });
  }

  clearVoucher(): void {
    if (this.checkoutMode === 'buy_now') {
      this.uiHint = '';
      return;
    }
    this.appliedVoucher = '';
    this.voucherInput = '';
    this.voucherDiscount = 0;
    this.syncCheckoutSession({ couponCode: null });
  }

  placeOrder(): void {
    if (this.checkoutMode === 'buy_now') {
      this.toast.warning('Đơn Mua ngay đang ở chế độ xem trước thanh toán. Vui lòng thêm vào giỏ để đặt đơn lúc này.');
      return;
    }
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
    if (this.checkoutMode === 'buy_now') return;
    this.syncCheckoutSession({ shippingMethodId: this.selectedShippingId });
  }

  onPaymentMethodChange(): void {
    if (this.checkoutMode === 'buy_now') return;
    this.syncCheckoutSession({ paymentMethodId: this.selectedPaymentId });
  }
  private initializeCheckoutMode(): void {
    const requestedMode = String(this.route.snapshot.queryParamMap.get('mode') || '').toLowerCase();
    const context = this.checkoutService.getBuyNowContext();
    if (requestedMode === 'buy_now' && context?.items?.length) {
      this.checkoutMode = 'buy_now';
      this.buyNowContext = context;
      this.applyBuyNowContext(context);
      return;
    }
    this.checkoutMode = 'cart';
    this.buyNowContext = null;
    this.bootstrapCheckoutSession();
  }

  private applyBuyNowContext(context: BuyNowCheckoutContext): void {
    const item = context.items[0];
    this.checkoutSessionId = null;
    this.appliedVoucher = '';
    this.voucherInput = '';
    this.voucherDiscount = 0;
    this.baseDiscount = 0;
    this.shippingFeeFromSession = 0;
    this.sessionGrandTotal = 0;
    this.checkoutIssues = [];
    this.isSyncingSession = false;
    this.cartItems = [{
      id: `${item.productId}-${item.variantId || 'default'}`,
      name: item.productName,
      variant: item.variantName || 'Default',
      image: item.imageUrl || 'assets/images/banner/nen.png',
      quantity: Number(item.quantity || 1),
      price: Number(item.unitPrice || 0),
    }];
    this.subtotal = this.cartItems.reduce((sum, x) => sum + x.quantity * x.price, 0);
    this.uiHint = 'Bạn đang thanh toán nhanh với 1 sản phẩm đã chọn từ trang sản phẩm.';
  }


  onPhoneInput(): void {
    this.phone = this.phone.replace(/[^\d]/g, '').slice(0, 11);
  }

  private bootstrapCheckoutSession(): void {
    this.checkoutService.prepareCheckout().pipe(take(1)).subscribe((ready) => {
      if (!ready.success) {
        this.checkoutIssues = ready.issues.map((x) => x.message);
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
        this.checkoutIssues = issues.map((x) => x.message);
        this.uiHint = '';
      },
    });
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
    this.voucherDiscount = 0;
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
