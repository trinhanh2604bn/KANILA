import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { CartNormalized } from '../../models/cart.model';
import { CartService } from '../../services/cart.service';

interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  brand: string;
  name: string;
  variant: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  image: string;
  selected: boolean;
  inWishlist: boolean;
  stockStatus: string;
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
  isLoading = true;
  isPromoApplying = false;
  isCheckoutNavigating = false;
  busyItemId: string | null = null;
  confirmModalOpen = false;
  confirmMode: 'single' | 'selected' = 'single';
  confirmItemId: string | null = null;
  undoSnackOpen = false;
  private undoTimer: ReturnType<typeof setTimeout> | null = null;
  private lastRemovedItems: CartItem[] = [];
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
    this.busyItemId = itemId;
    this.cartService.updateCartItemQuantity(itemId, nextQty).pipe(take(1)).subscribe(() => {
      this.showToast('Đã cập nhật số lượng');
      this.busyItemId = null;
    });
    this.qtyPulseItemId = itemId;
    setTimeout(() => {
      if (this.qtyPulseItemId === itemId) this.qtyPulseItemId = null;
    }, 220);
  }

  requestRemoveItem(itemId: string): void {
    this.confirmMode = 'single';
    this.confirmItemId = itemId;
    this.confirmModalOpen = true;
  }

  requestRemoveSelected(): void {
    if (!this.selectedItems.length) return;
    this.confirmMode = 'selected';
    this.confirmItemId = null;
    this.confirmModalOpen = true;
  }

  cancelRemove(): void {
    this.confirmModalOpen = false;
    this.confirmItemId = null;
  }

  confirmRemove(): void {
    if (this.confirmMode === 'single' && this.confirmItemId) {
      this.removeSingle(this.confirmItemId);
    } else {
      this.removeSelectedConfirmed();
    }
    this.confirmModalOpen = false;
    this.confirmItemId = null;
  }

  private removeSingle(itemId: string): void {
    const target = this.cartItems.find((x) => x.id === itemId);
    if (!target) return;
    this.busyItemId = itemId;
    this.lastRemovedItems = [{ ...target }];
    this.cartService.removeCartItem(itemId).pipe(take(1)).subscribe(() => {
      this.showToast('Đã xóa sản phẩm khỏi giỏ hàng');
      this.busyItemId = null;
      this.openUndoSnack();
    });
  }

  private removeSelectedConfirmed(): void {
    if (!this.selectedItems.length) return;
    this.lastRemovedItems = this.selectedItems.map((x) => ({ ...x }));
    this.cartService.removeSelectedItems().pipe(take(1)).subscribe(() => {
      this.showToast('Đã xóa các sản phẩm đã chọn');
      this.openUndoSnack();
    });
  }

  undoRemove(): void {
    if (!this.lastRemovedItems.length) return;
    const queue = [...this.lastRemovedItems];
    this.undoSnackOpen = false;
    if (this.undoTimer) clearTimeout(this.undoTimer);

    const replay = (idx: number): void => {
      if (idx >= queue.length) {
        this.showToast('Đã khôi phục sản phẩm');
        this.lastRemovedItems = [];
        return;
      }
      const item = queue[idx];
      this.cartService.addToCart({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        productName: item.name,
        brandName: item.brand,
        variantLabel: item.variant,
        imageUrl: item.image,
        unitPrice: item.price,
        compareAtPrice: item.oldPrice ?? null,
        stockStatus: item.stockStatus || 'in_stock',
      }).pipe(take(1)).subscribe({
        next: () => replay(idx + 1),
        error: () => replay(idx + 1),
      });
    };
    replay(0);
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
    this.isPromoApplying = true;
    setTimeout(() => {
      this.appliedPromoCode = code;
      this.discount = Math.round(this.subtotal * 0.1);
      this.isPromoApplying = false;
      this.showToast(`Áp dụng mã ${code} thành công`);
    }, 220);
  }

  goCheckout(): void {
    if (!this.selectedItems.length) return;
    this.isCheckoutNavigating = true;
    setTimeout(() => {
      this.router.navigate(['/checkout']);
      this.isCheckoutNavigating = false;
    }, 120);
  }

  private showToast(message: string): void {
    this.uiToast = message;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.uiToast = '';
    }, 1600);
  }

  private openUndoSnack(): void {
    if (!this.lastRemovedItems.length) return;
    this.undoSnackOpen = true;
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(() => {
      this.undoSnackOpen = false;
      this.lastRemovedItems = [];
    }, 4500);
  }

  private applyCart(cart: CartNormalized): void {
    this.cartItems = cart.items.map((item) => ({
      id: item.cartItemId,
      productId: item.productId,
      variantId: item.variantId,
      brand: item.brandName,
      name: item.productName,
      variant: item.variantLabel,
      price: item.unitPrice,
      oldPrice: item.compareAtPrice ?? undefined,
      quantity: item.quantity,
      image: item.imageUrl || 'assets/images/banner/nen.png',
      selected: item.selected,
      inWishlist: false,
      stockStatus: item.stockStatus,
    }));
    this.shippingFee = cart.summary.shippingFee;
    this.discount = cart.summary.discountTotal;
    this.isLoading = false;
  }
}
