import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';
import { ToastService } from '../../../../core/services/toast.service';
import { WishlistItemView, WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist-page.html',
  styleUrls: ['./wishlist-page.css'],
})
export class WishlistPageComponent implements OnInit {
  items: WishlistItemView[] = [];
  loading = false;
  error = '';
  busyId = '';
  constructor(
    private readonly wishlistService: WishlistService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.wishlistService.syncWishlistState().pipe(take(1)).subscribe();
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.error = '';
    this.wishlistService.getMyItems().pipe(take(1)).subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
        this.wishlistService.syncWishlistState().pipe(take(1)).subscribe();
      },
      error: () => {
        this.error = 'Không thể tải danh mục yêu thích.';
        this.loading = false;
      }
    });
  }

  remove(item: WishlistItemView): void {
    this.busyId = item._id;
    this.wishlistService.removeProductByProductId(item.productId?._id || '').pipe(take(1)).subscribe({
      next: (ok) => {
        if (ok) {
        this.items = this.items.filter((x) => x._id !== item._id);
          this.toast.success('Đã xóa khỏi danh mục yêu thích.');
        } else {
          this.error = 'Không thể xóa sản phẩm khỏi danh mục yêu thích.';
        }
        this.busyId = '';
      },
    });
  }

  addToCart(item: WishlistItemView): void {
    const productId = item.productId?._id;
    if (!productId) return;
    this.busyId = item._id;
    this.wishlistService.addToCart(productId, item.variantId?._id || null, 1).pipe(take(1)).subscribe({
      next: () => {
        this.toast.success('Đã thêm sản phẩm vào giỏ hàng.');
        this.busyId = '';
      },
      error: () => {
        this.error = 'Không thể thêm sản phẩm vào giỏ hàng.';
        this.toast.error(this.error);
        this.busyId = '';
      }
    });
  }
}
