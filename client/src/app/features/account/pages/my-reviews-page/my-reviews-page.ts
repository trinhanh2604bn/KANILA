import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

interface MyReviewView {
  _id: string;
  orderItemId: string | null;
  productId?: { productName?: string; imageUrl?: string; slug?: string } | any;
  variantId?: { variantName?: string; sku?: string } | any;
  rating: number;
  reviewTitle?: string;
  reviewContent?: string;
  reviewStatus: ReviewStatus;
  verifiedPurchaseFlag?: boolean;
  helpfulCount?: number;
  createdAt?: string;
}

@Component({
  selector: 'app-my-reviews-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-reviews-page.html',
  styleUrls: ['./my-reviews-page.css'],
})
export class MyReviewsPageComponent implements OnInit {
  private readonly api = 'http://localhost:5000/api';

  loading = false;
  error = '';
  reviews: MyReviewView[] = [];
  busyReviewId = '';

  // reviewId -> mediaUrls
  mediaByReviewId: Record<string, string[]> = {};

  constructor(
    private readonly http: HttpClient,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyReviews();
  }

  loadMyReviews(): void {
    this.loading = true;
    this.error = '';
    this.http
      .get<any>(`${this.api}/account/reviews`)
      .pipe(
        take(1),
        catchError((err) => {
          this.loading = false;
          return of({ success: false, message: err?.message });
        })
      )
      .subscribe((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        this.reviews = list;
        this.loading = false;

        // Load media thumbnails (best-effort).
        const ids = this.reviews.slice(0, 12).map((r) => r._id).filter(Boolean);
        if (!ids.length) return;

        const reqs = ids.map((id) => this.http.get<any>(`${this.api}/review-media/review/${id}`).pipe(catchError(() => of({ data: [] }))));
        forkJoin(reqs)
          .pipe(take(1))
          .subscribe((all) => {
            this.mediaByReviewId = {};
            all.forEach((payload: any, idx: number) => {
              const reviewId = ids[idx];
              const urls = Array.isArray(payload?.data) ? payload.data.map((m: any) => m.mediaUrl).filter(Boolean) : [];
              this.mediaByReviewId[reviewId] = urls;
            });
          });
      });
  }

  statusLabel(status: ReviewStatus): string {
    if (status === 'approved') return 'Đã duyệt';
    if (status === 'rejected') return 'Bị từ chối';
    return 'Chờ duyệt';
  }

  statusClass(status: ReviewStatus): string {
    if (status === 'approved') return 'done';
    if (status === 'rejected') return 'rejected';
    return 'pending';
  }

  clampedRating(rating: number): number {
    return Math.max(0, Math.min(5, Math.floor(rating)));
  }

  canEdit(review: MyReviewView): boolean {
    return review.reviewStatus === 'pending' || review.reviewStatus === 'rejected';
  }

  editReview(review: MyReviewView): void {
    if (!review.orderItemId) {
      this.toast.error('Không tìm thấy order item để chỉnh sửa.');
      return;
    }
    this.router.navigate([`/account/reviews/write/${review.orderItemId}`]);
  }

  deleteReview(review: MyReviewView): void {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này không?')) return;
    if (!review._id) return;

    this.busyReviewId = review._id;
    this.http
      .delete<any>(`${this.api}/account/reviews/${review._id}`)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          const ok = !!res?.success || res?.message;
          if (ok) this.reviews = this.reviews.filter((r) => r._id !== review._id);
          else this.toast.error('Không thể xóa đánh giá.');
          this.busyReviewId = '';
        },
        error: () => {
          this.busyReviewId = '';
          this.toast.error('Không thể xóa đánh giá. Vui lòng thử lại.');
        },
      });
  }
}

