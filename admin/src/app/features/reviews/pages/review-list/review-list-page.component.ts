import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReviewsApiService } from '../../services/reviews-api.service';
import { Review } from '../../models/review.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../core/config/environment';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-list-page.component.html',
  styleUrl: './review-list-page.component.css',
})
export class ReviewListPageComponent implements OnInit {
  private readonly api = inject(ReviewsApiService);
  private readonly toast = inject(ToastService);
  private readonly apiOrigin = environment.apiUrl.replace(/\/api\/?$/, '');

  reviews = signal<Review[]>([]);
  loading = signal(true);
  searchQuery = signal('');

  // Moderation state
  processingActionOnId = signal<string | null>(null);

  // Undo state
  lastAction = signal<{ id: string; previousStatus: string; newStatus: string } | null>(null);
  showUndoToast = signal(false);
  undoTimer: ReturnType<typeof setTimeout> | undefined;

  // Media Preview Modal state (full-screen image)
  previewImage = signal<string | null>(null);

  /** Full review detail panel */
  detailOpen = signal(false);
  detailLoading = signal(false);
  detailReview = signal<Review | null>(null);

  ngOnInit() {
    this.api.getReviews().subscribe({
      next: (data) => {
        this.reviews.set(data.filter((r) => r.status === 'pending'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get filteredReviews() {
    let list = this.reviews();
    const q = this.searchQuery().toLowerCase().trim();

    if (q) {
      list = list.filter(
        (r) =>
          r.productName.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          (r.title?.toLowerCase().includes(q) ?? false) ||
          r.customerName.toLowerCase().includes(q)
      );
    }
    return list;
  }

  /** Truncated text for the table (not the detail modal). */
  contentPreview(rev: Review, max = 140): string {
    const text = (rev.content || '').trim();
    if (!text) return 'No review text';
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + '…';
  }

  openDetail(rev: Review): void {
    if (this.processingActionOnId() === rev.id) return;
    if (!rev.id) return;

    this.detailOpen.set(true);
    this.detailLoading.set(true);
    this.detailReview.set(rev);

    forkJoin({
      review: this.api.getReviewById(rev.id),
      media: this.api.getMediaForReview(rev.id).pipe(catchError(() => of([] as string[]))),
    }).subscribe({
      next: ({ review, media }) => {
        const images = media.length ? media : review.images ?? [];
        this.detailReview.set({ ...review, images });
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailReview.set({ ...rev });
        this.detailLoading.set(false);
      },
    });
  }

  closeDetail(): void {
    this.detailOpen.set(false);
    this.detailReview.set(null);
    this.detailLoading.set(false);
  }

  mediaUrl(url: string): string {
    const u = (url || '').trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/')) return `${this.apiOrigin}${u}`;
    return u;
  }

  formatDateTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  moderateReview(review: Review, newStatus: 'approved' | 'rejected') {
    if (!review.id) {
      this.toast.error('Invalid review id');
      return;
    }
    this.processingActionOnId.set(review.id);

    const action$ = newStatus === 'approved'
      ? this.api.approveReview(review.id)
      : this.api.rejectReview(review.id);

    action$.subscribe({
      next: () => {
        this.lastAction.set({
          id: review.id,
          previousStatus: review.status,
          newStatus: newStatus,
        });

        this.reviews.update((list) => list.filter((r) => r.id !== review.id));
        this.processingActionOnId.set(null);

        if (this.detailReview()?.id === review.id) {
          this.closeDetail();
        }

        this.showUndoToast.set(true);
        if (this.undoTimer) clearTimeout(this.undoTimer);
        this.undoTimer = setTimeout(() => {
          this.showUndoToast.set(false);
        }, 5000);
      },
      error: () => {
        this.processingActionOnId.set(null);
      },
    });
  }

  undoLastAction() {
    const action = this.lastAction();
    if (!action) return;

    this.showUndoToast.set(false);
    if (this.undoTimer) clearTimeout(this.undoTimer);

    // Undo by re-fetching the review and adding back to list
    this.api.getReviewById(action.id).subscribe({
      next: (restoredData) => {
        this.reviews.update((list) => [restoredData, ...list]);
        this.lastAction.set(null);
        this.toast.success('Change reverted');
      },
      error: () => {
        /* error interceptor already toasts */
      },
    });
  }

  openPreview(imgUrl: string) {
    this.previewImage.set(this.mediaUrl(imgUrl));
  }

  closePreview() {
    this.previewImage.set(null);
  }

  getStarsArray(rating: number): number[] {
    return Array(Math.min(5, Math.max(0, rating))).fill(0);
  }

  getEmptyStarsArray(rating: number): number[] {
    return Array(Math.max(0, 5 - rating)).fill(0);
  }
}
