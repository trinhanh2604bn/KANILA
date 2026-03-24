import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { CartNormalized } from '../../models/cart.model';
import { CartService } from '../../services/cart.service';

interface CartItem {
  id: string;
  brand: string;
  name: string;
  variant: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  image: string;
  selected: boolean;
  inWishlist: boolean;
}

interface CartRecoItem {
  slug: string;
  brand: string;
  name: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
})
export class CartPageComponent {
  readonly freeShippingThreshold = 499000;
  shippingFee = 30000;
  deliveryLocation = 'TP. Ho Chi Minh';
  etaText = 'Nhận hàng dự kiến trong 1-2 ngày';
  promoInput = '';
  appliedPromoCode = '';
  discount = 0;
  uiToast = '';
  qtyPulseItemId: string | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  cartItems: CartItem[] = [];

  readonly recommendedProducts: CartRecoItem[] = [
    {
      slug: 'hydrating-grip-primer',
      brand: 'KLAIRS',
      name: 'Hydrating Grip Primer',
      price: 320000,
      image: 'https://images.unsplash.com/photo-1629198673071-7de5c9f951f4?auto=format&fit=crop&w=700&q=80',
    },
    {
      slug: 'cloud-soft-setting-powder',
      brand: 'COCOON VIETNAM',
      name: 'Cloud Soft Setting Powder',
      price: 280000,
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80',
    },
    {
      slug: 'glass-lip-oil',
      brand: '3CE',
      name: 'Glass Lip Oil',
      price: 290000,
      image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=700&q=80',
    },
  ];

  constructor(
    private readonly router: Router,
    public readonly cartService: CartService
  ) {
    this.cartService.cartState$.subscribe((cart) => this.applyCart(cart));
    this.cartService.cartError$.subscribe((err) => {
      if (!err) return;
      this.showToast(err.message);
    });
    this.cartService.getCurrentCart().pipe(take(1)).subscribe();
  }

  get hasItems(): boolean {
    return this.cartItems.length > 0;
  }

  get selectedCount(): number {
    return this.cartItems.filter((item) => item.selected).length;
  }

  get allSelected(): boolean {
    return this.hasItems && this.selectedCount === this.cartItems.length;
  }

  get selectedItems(): CartItem[] {
    return this.cartItems.filter((item) => item.selected);
  }

  get subtotal(): number {
    return this.selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get total(): number {
    if (!this.selectedItems.length) return 0;
    return Math.max(0, this.subtotal - this.discount + this.shippingFee);
  }

  get amountToFreeShip(): number {
    return Math.max(0, this.freeShippingThreshold - this.subtotal);
  }

  get savingsAmount(): number {
    return this.discount;
  }

  toggleSelectAll(checked: boolean): void {
    this.cartService.toggleSelectAll(checked).pipe(take(1)).subscribe();
  }

  toggleItemSelected(itemId: string, selected: boolean): void {
    this.cartService.toggleCartItemSelection(itemId, selected).pipe(take(1)).subscribe();
  }

  updateQty(itemId: string, delta: number): void {
    const item = this.cartItems.find((x) => x.id === itemId);
    if (!item) return;
    const nextQty = Math.max(1, item.quantity + delta);
    this.cartService.updateCartItemQuantity(itemId, nextQty).pipe(take(1)).subscribe(() => {
      this.showToast('Đã cập nhật số lượng');
    });
    this.qtyPulseItemId = itemId;
    setTimeout(() => {
      if (this.qtyPulseItemId === itemId) this.qtyPulseItemId = null;
    }, 220);
  }

  removeItem(itemId: string): void {
    const ok = window.confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?');
    if (!ok) return;
    this.cartService.removeCartItem(itemId).pipe(take(1)).subscribe(() => {
      this.showToast('Đã xóa sản phẩm khỏi giỏ hàng');
    });
  }

  removeSelected(): void {
    if (!this.selectedItems.length) return;
    const ok = window.confirm('Xóa tất cả sản phẩm đã chọn?');
    if (!ok) return;
    this.cartService.removeSelectedItems().pipe(take(1)).subscribe(() => {
      this.showToast('Đã xóa các sản phẩm đã chọn');
    });
  }

  toggleWishlist(itemId: string): void {
    let nowSaved = false;
    this.cartItems = this.cartItems.map((item) => {
      if (item.id !== itemId) return item;
      nowSaved = !item.inWishlist;
      return { ...item, inWishlist: nowSaved };
    });
    this.showToast(nowSaved ? 'Đã lưu vào wishlist' : 'Đã bỏ khỏi wishlist');
  }

  applyPromo(): void {
    const code = this.promoInput.trim().toUpperCase();
    if (!code) return;
    this.appliedPromoCode = code;
    this.discount = Math.round(this.subtotal * 0.1);
    this.showToast(`Áp dụng mã ${code} thành công`);
  }

  goCheckout(): void {
    if (!this.selectedItems.length) return;
    this.router.navigate(['/checkout']);
  }

  private showToast(message: string): void {
    this.uiToast = message;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.uiToast = '';
    }, 1600);
  }

  private applyCart(cart: CartNormalized): void {
    this.cartItems = cart.items.map((item) => ({
      id: item.cartItemId,
      brand: item.brandName,
      name: item.productName,
      variant: item.variantLabel,
      price: item.unitPrice,
      oldPrice: item.compareAtPrice ?? undefined,
      quantity: item.quantity,
      image: item.imageUrl || 'assets/images/banner/nen.png',
      selected: item.selected,
      inWishlist: false,
    }));
    this.shippingFee = cart.summary.shippingFee;
    this.discount = cart.summary.discountTotal;
  }
}
