import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of, take } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

type EligibilityResponse = {
  eligible: boolean;
  verifiedPurchaseFlag: boolean;
  existingReview: null | { id: string; reviewStatus: string; rating: number };
  preview: {
    orderItemId: string;
    productId: string;
    productName: string;
    productImageUrl: string;
    variantId: string;
    variantLabel: string;
    sku: string;
    orderNumber: string;
    orderPlacedAt: string | Date;
  };
};

@Component({
  selector: 'app-write-review-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'write-review-page.html',
  styleUrls: ['write-review-page.css'],
})
export class WriteReviewPageComponent {
  private readonly api = 'http://localhost:5000/api';

  orderItemId = '';
  loading = false;
  error = '';

  eligible = false;
  verifiedPurchaseFlag = false;
  existingReviewId: string | null = null;

  preview: EligibilityResponse['preview'] | null = null;

  // Form
  rating = 5;
  reviewTitle = '';
  reviewContent = '';
  quickTags: string[] = [];
  mediaBase64: string[] = [];
  mediaBusy = false;

  // UI states
  submitting = false;
  success = false;
  formError = '';

  ratingStars = [1, 2, 3, 4, 5];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(take(1)).subscribe((params) => {
      this.orderItemId = String(params.get('orderItemId') || '').trim();
      if (!this.orderItemId) {
        this.error = 'Thiếu orderItemId.';
        return;
      }
      this.loadEligibility();
    });
  }

  private loadEligibility(): void {
    this.loading = true;
    this.error = '';

    this.http
      .get<any>(`${this.api}/reviews/write-eligibility/${this.orderItemId}`)
      .pipe(
        take(1),
        catchError((err) => {
          this.loading = false;
          return of({ success: false, message: err?.message, data: null });
        })
      )
      .subscribe((res) => {
        this.loading = false;
        if (!res?.data) {
          this.error = 'Không thể tải dữ liệu viết đánh giá.';
          return;
        }

        const data = res.data as EligibilityResponse;
        this.eligible = !!data.eligible;
        this.verifiedPurchaseFlag = !!data.verifiedPurchaseFlag;
        this.preview = data.preview;

        this.existingReviewId = data.existingReview?.id ?? null;

        // If editing existing review, load its current content.
        if (this.existingReviewId) {
          this.loadExistingReview(this.existingReviewId);
        }
      });
  }

  private loadExistingReview(reviewId: string): void {
    this.http
      .get<any>(`${this.api}/reviews/${reviewId}`)
      .pipe(
        take(1),
        catchError(() => of(null))
      )
      .subscribe((res) => {
        const r = res?.data;
        if (!r) return;
        this.rating = Number(r.rating ?? this.rating);
        this.reviewTitle = String(r.reviewTitle ?? '');
        this.reviewContent = String(r.reviewContent ?? '');
      });
  }

  setRating(v: number): void {
    this.rating = Math.max(1, Math.min(5, v));
  }

  async onFilesSelected(files: FileList | null): Promise<void> {
    if (!files || !files.length) return;
    if (this.existingReviewId) {
      this.toast.warning('Khi chỉnh sửa, hình ảnh sẽ không được cập nhật.');
    }

    const list = Array.from(files).slice(0, 6);
    const MAX_MB = 2;

    this.formError = '';
    this.mediaBusy = true;
    try {
      const readOne = (file: File) =>
        new Promise<string>((resolve, reject) => {
          if (!file.type.startsWith('image/')) return reject(new Error('Chỉ nhận ảnh.'));
          if (file.size > MAX_MB * 1024 * 1024) return reject(new Error('Mỗi ảnh tối đa 2MB.'));
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Không thể đọc tệp.')); 
          reader.readAsDataURL(file);
        });

      const base64 = await Promise.all(list.map((f) => readOne(f)));
      this.mediaBase64 = base64.filter(Boolean);
    } catch (e: any) {
      this.formError = e?.message || 'Không thể tải ảnh.';
    } finally {
      this.mediaBusy = false;
    }
  }

  removeMediaAt(i: number): void {
    this.mediaBase64 = this.mediaBase64.filter((_, idx) => idx !== i);
  }

  submit(): void {
    if (this.submitting) return;

    this.success = false;
    this.formError = '';

    if (!this.orderItemId) {
      this.formError = 'Thiếu thông tin đơn hàng.';
      return;
    }
    if (!this.eligible) {
      this.formError = 'Bạn không đủ điều kiện để viết đánh giá cho đơn này.';
      return;
    }
    if (!this.rating || this.rating < 1 || this.rating > 5) {
      this.formError = 'Vui lòng chọn số sao.';
      return;
    }
    if (!this.reviewTitle.trim()) {
      this.formError = 'Vui lòng nhập tiêu đề đánh giá.';
      return;
    }
    if (!this.reviewContent.trim() || this.reviewContent.trim().length < 20) {
      this.formError = 'Vui lòng viết nội dung chi tiết (tối thiểu 20 ký tự).';
      return;
    }

    this.submitting = true;

    const finish = () => {
      this.submitting = false;
    };

    if (this.existingReviewId) {
      // Edit: backend currently updates text/rating only.
      this.http
        .patch<any>(`${this.api}/account/reviews/${this.existingReviewId}`, {
          rating: this.rating,
          reviewTitle: this.reviewTitle.trim(),
          reviewContent: this.reviewContent.trim(),
        })
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.toast.success('Đã cập nhật đánh giá.');
            finish();
            this.router.navigate(['/account/reviews']);
          },
          error: (err) => {
            finish();
            this.formError = err?.error?.message || 'Không thể cập nhật đánh giá.';
          },
        });
      return;
    }

    this.http
      .post<any>(`${this.api}/reviews/submit`, {
        orderItemId: this.orderItemId,
        rating: this.rating,
        reviewTitle: this.reviewTitle.trim(),
        reviewContent: this.reviewContent.trim(),
        mediaUrls: this.mediaBase64,
      })
      .pipe(take(1))
      .subscribe({
        next: () => {
          finish();
          this.success = true;
          this.toast.success('Đã gửi đánh giá! Chúng mình sẽ duyệt sớm nhất có thể.');
          setTimeout(() => this.router.navigate(['/account/reviews']), 900);
        },
        error: (err) => {
          finish();
          this.formError = err?.error?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';
        },
      });
  }
}

