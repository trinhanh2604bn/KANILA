import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { CartNormalized } from '../../../cart/models/cart.model';
import { CartService } from '../../../cart/services/cart.service';

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
  styleUrl: './checkout-page.css',
})
export class CheckoutPageComponent {
  readonly freeShippingThreshold = 499000;
  readonly shippingMethods: ShippingMethodOption[] = [
    { id: 'standard', label: 'Giao tiêu chuẩn', eta: '2-3 ngày làm việc', fee: 30000 },
    { id: 'fast', label: 'Giao nhanh', eta: '1-2 ngày làm việc', fee: 45000 },
    { id: 'express', label: 'Giao hỏa tốc nội thành', eta: 'Trong ngày', fee: 70000 },
  ];
  readonly paymentMethods: PaymentMethodOption[] = [
    { id: 'cod', label: 'Thanh toán khi nhận hàng', subtitle: 'COD an toàn và tiện lợi', icon: 'bi-cash-coin' },
    { id: 'bank', label: 'Chuyển khoản ngân hàng', subtitle: 'Xác nhận nhanh qua hệ thống', icon: 'bi-bank2' },
    { id: 'ewallet', label: 'Ví điện tử', subtitle: 'MoMo, ZaloPay, VNPay', icon: 'bi-wallet2' },
  ];

  cartItems: CheckoutLineItem[] = [];
  subtotal = 0;
  baseDiscount = 0;
  selectedShippingId = 'standard';
  selectedPaymentId = 'cod';
  voucherInput = '';
  appliedVoucher = '';
  voucherDiscount = 0;
  placingOrder = false;
  formSubmitted = false;

  contactName = '';
  phone = '';
  addressLine = '';
  note = '';
  city = 'TP. Ho Chi Minh';
  district = 'Quận 1';

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router
  ) {
    this.cartService.cartState$.subscribe((cart) => this.applyCart(cart));
    this.cartService.getCurrentCart().pipe(take(1)).subscribe();
  }

  get selectedShipping(): ShippingMethodOption {
    return this.shippingMethods.find((m) => m.id === this.selectedShippingId) ?? this.shippingMethods[0];
  }

  get shippingFee(): number {
    if (!this.cartItems.length) return 0;
    if (this.subtotal >= this.freeShippingThreshold) return 0;
    return this.selectedShipping.fee;
  }

  get totalDiscount(): number {
    return this.baseDiscount + this.voucherDiscount;
  }

  get amountToFreeShipping(): number {
    return Math.max(0, this.freeShippingThreshold - this.subtotal);
  }

  get grandTotal(): number {
    return Math.max(0, this.subtotal - this.totalDiscount + this.shippingFee);
  }

  get savingsTotal(): number {
    return this.totalDiscount;
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
    this.appliedVoucher = code;
    this.voucherDiscount = Math.round(this.subtotal * 0.08);
  }

  clearVoucher(): void {
    this.appliedVoucher = '';
    this.voucherInput = '';
    this.voucherDiscount = 0;
  }

  placeOrder(): void {
    this.formSubmitted = true;
    if (this.invalidName || this.invalidPhone || this.invalidAddress || !this.cartItems.length) return;
    this.placingOrder = true;
    setTimeout(() => {
      this.placingOrder = false;
      this.router.navigate(['/orders', 'success'], {
        state: {
          subtotal: this.subtotal,
          discount: this.totalDiscount,
          shippingFee: this.shippingFee,
          grandTotal: this.grandTotal,
          paymentMethod: this.paymentMethods.find((m) => m.id === this.selectedPaymentId)?.label || 'COD',
          shippingMethod: this.selectedShipping.label,
          contactName: this.contactName,
          phone: this.phone,
          address: `${this.addressLine}, ${this.district}, ${this.city}`,
          items: this.cartItems,
        },
      });
    }, 450);
  }

  private applyCart(cart: CartNormalized): void {
    const selectedItems = cart.items.filter((item) => item.selected);
    this.cartItems = selectedItems.map((item) => ({
      id: item.cartItemId,
      name: item.productName,
      variant: item.variantLabel,
      image: item.imageUrl || 'assets/images/banner/nen.png',
      quantity: item.quantity,
      price: item.unitPrice,
    }));
    this.subtotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    this.baseDiscount = cart.summary.discountTotal;
  }
}
