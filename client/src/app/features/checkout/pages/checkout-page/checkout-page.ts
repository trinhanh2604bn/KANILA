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
import { AccountHubService, CustomerAddressRecord, ProfileHubView } from '../../../../core/services/account-hub.service';

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
  email = '';
  phone = '';
  addressLine = '';
  note = '';
  city = 'TP. Ho Chi Minh';
  district = 'Quận 1';

  profileHub: ProfileHubView | null = null;
  savedAddresses: CustomerAddressRecord[] = [];
  selectedSavedAddressId: string | null = null;
  showAddressEditor = false;
  showRecipientEditor = false;
  showPaymentPicker = false;
  customerContextLoaded = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cartService: CartService,
    private readonly checkoutService: CheckoutService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly accountHub: AccountHubService
  ) {}

  get isCustomerCheckout(): boolean {
    return this.authService.isAuthenticated() && this.authService.isCustomerAccountFromToken();
  }

  get selectedPaymentDisplay(): PaymentMethodOption | undefined {
    return this.paymentMethods.find((m) => m.id === this.selectedPaymentId);
  }

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('sessionId');
    forkJoin({
      shipping: this.checkoutService.getShippingMethods().pipe(catchError(() => of<ShippingMethodApiOption[]>([]))),
      payment: this.checkoutService.getPaymentMethods().pipe(catchError(() => of<PaymentMethodApiOption[]>([]))),
    }).subscribe(({ shipping, payment }) => {
      this.applyMethodLists(shipping, payment);
      this.preferCodIfPossible();

      if (this.isCustomerCheckout && !sessionId) {
        forkJoin({
          hub: this.accountHub.getProfileHub().pipe(catchError(() => of(null))),
          addresses: this.accountHub.getAddresses().pipe(catchError(() => of([] as CustomerAddressRecord[]))),
        })
          .pipe(take(1))
          .subscribe(({ hub, addresses }) => {
            this.profileHub = hub;
            this.savedAddresses = addresses;
            this.customerContextLoaded = true;
            this.prefillCustomerFromProfile();
            this.bootstrapCheckoutSession();
          });
        return;
      }
      this.bootstrapCheckoutSession();
    });
  }

  get selectedShipping(): ShippingMethodOption {
    return (
      this.shippingMethods.find((m) => m.id === this.selectedShippingId) ?? {
        id: '',
        label: '',
        eta: '',
        fee: 0,
      }
    );
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

  get invalidEmail(): boolean {
    const email = this.email.trim().toLowerCase();
    if (this.isCustomerCheckout) {
      if (!email) return false;
      return this.formSubmitted && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    }
    return this.formSubmitted && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email));
  }

  get invalidAddress(): boolean {
    return this.formSubmitted && this.addressLine.trim().length < 8;
  }

  applySavedAddress(addr: CustomerAddressRecord): void {
    this.selectedSavedAddressId = addr._id;
    this.contactName = String(addr.recipient_name || this.contactName || '');
    this.phone = String(addr.phone || this.phone || '').replace(/[^\d]/g, '').slice(0, 11);
    this.addressLine = String(addr.address_line_1 || '');
    this.district = String(addr.district || this.district);
    this.city = String(addr.city || this.city);
    this.showAddressEditor = false;
    this.syncCheckoutSession();
  }

  toggleAddressEditor(): void {
    this.showAddressEditor = !this.showAddressEditor;
  }

  toggleRecipientEditor(): void {
    this.showRecipientEditor = !this.showRecipientEditor;
  }

  togglePaymentPicker(): void {
    this.showPaymentPicker = !this.showPaymentPicker;
  }

  onSavedAddressSelect(): void {
    const sel = this.savedAddresses.find((a) => a._id === this.selectedSavedAddressId);
    if (sel) this.applySavedAddress(sel);
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
    if (this.invalidName || this.invalidPhone || this.invalidEmail || this.invalidAddress || !this.cartItems.length) return;
    if (!this.checkoutSessionId) {
      this.toast.error('Không thể tạo phiên thanh toán. Vui lòng thử lại.');
      return;
    }
    this.placingOrder = true;
    const checkoutAsGuest = !this.isCustomerCheckout;
    this.checkoutService
      .placeOrder(this.checkoutSessionId, this.note || '')
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.cartService.getCurrentCart().pipe(take(1)).subscribe();
          this.placingOrder = false;
          this.router.navigate(['/orders', 'success'], {
            queryParams: { id: result.orderId },
            state: {
              orderId: result.orderId,
              orderNumber: result.orderNumber,
              checkoutAsGuest,
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

  private applyMethodLists(shipping: ShippingMethodApiOption[], payment: PaymentMethodApiOption[]): void {
    if (shipping.length) {
      this.shippingMethods = shipping.map((m) => this.toUiShippingMethod(m));
      this.selectedShippingId = this.shippingMethods[0].id;
    }
    if (payment.length) {
      this.paymentMethods = payment.map((m) => this.toUiPaymentMethod(m));
      this.selectedPaymentId = this.paymentMethods[0].id;
    }
  }

  private preferCodIfPossible(): void {
    const cod = this.paymentMethods.find((m) => /cod|tiền mặt|cash/i.test(m.label + m.subtitle));
    if (cod) this.selectedPaymentId = cod.id;
  }

  private prefillCustomerFromProfile(): void {
    const hub = this.profileHub;
    if (!hub?.profile) return;
    this.contactName = hub.profile.fullName || this.contactName;
    this.email = hub.profile.email || this.email;
    this.phone = String(hub.profile.phone || this.phone || '')
      .replace(/[^\d]/g, '')
      .slice(0, 11);
    const def = this.savedAddresses.find((a) => a.is_default_shipping) || this.savedAddresses[0];
    if (def) {
      this.selectedSavedAddressId = def._id;
      this.contactName = String(def.recipient_name || this.contactName);
      this.phone = String(def.phone || this.phone || '')
        .replace(/[^\d]/g, '')
        .slice(0, 11);
      this.addressLine = String(def.address_line_1 || this.addressLine);
      this.district = String(def.district || this.district);
      this.city = String(def.city || this.city);
    } else if (hub.defaultAddress) {
      this.contactName = hub.defaultAddress.recipientName || this.contactName;
      this.phone = String(hub.defaultAddress.phone || this.phone || '')
        .replace(/[^\d]/g, '')
        .slice(0, 11);
    }
  }

  private bootstrapCheckoutSession(): void {
    const requestedSessionId = this.route.snapshot.queryParamMap.get('sessionId');
    if (requestedSessionId) {
      this.isSyncingSession = true;
      this.checkoutService
        .getMyCheckoutSessionById(requestedSessionId)
        .pipe(take(1))
        .subscribe({
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

    this.checkoutService
      .prepareCheckout()
      .pipe(take(1))
      .subscribe((ready) => {
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

  syncCheckoutSession(overrides: {
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
      email: this.email || null,
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
    if (session.guestEmail) this.email = session.guestEmail;
    if (session.guestPhone) this.phone = String(session.guestPhone).replace(/[^\d]/g, '').slice(0, 11);
    if (session.guestFullName) this.contactName = session.guestFullName;
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
    const icon =
      type.includes('bank') || type.includes('transfer')
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
