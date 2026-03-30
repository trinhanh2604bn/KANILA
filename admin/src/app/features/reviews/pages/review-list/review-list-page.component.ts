import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
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
  imports: [CommonModule, FormsModule, TitleCasePipe],
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
  statusFilter = signal<'all' | 'visible' | 'hidden'>('all');
  processingId = signal<string | null>(null);

  // Media Preview
  previewImage = signal<string | null>(null);

  // Detail panel
  detailOpen = signal(false);
  detailLoading = signal(false);
  detailReview = signal<Review | null>(null);

  filteredReviews = computed(() => {
    let list = this.reviews();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    if (status !== 'all') {
      list = list.filter(r => r.status === status);
    }
    if (q) {
      list = list.filter(r =>
        r.productName.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        (r.title?.toLowerCase().includes(q) ?? false) ||
        r.customerName.toLowerCase().includes(q)
      );
    }
    return list;
  });

  visibleCount = computed(() => this.reviews().filter(r => r.status === 'visible').length);
  hiddenCount = computed(() => this.reviews().filter(r => r.status === 'hidden').length);

  ngOnInit() {
    this.api.getReviews().subscribe({
      next: (data) => { this.reviews.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  contentPreview(rev: Review, max = 140): string {
    const text = (rev.content || '').trim();
    if (!text) return 'No review text';
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + '…';
  }

  toggleVisibility(rev: Review): void {
    if (!rev.id || this.processingId()) return;
    this.processingId.set(rev.id);

    const action$ = rev.status === 'visible'
      ? this.api.hideReview(rev.id)
      : this.api.unhideReview(rev.id);

    action$.subscribe({
      next: (updated) => {
        this.reviews.update(list => list.map(r => r.id === rev.id ? updated : r));
        this.processingId.set(null);
        if (this.detailReview()?.id === rev.id) {
          this.detailReview.set(updated);
        }
        this.toast.success(updated.status === 'visible' ? 'Review is now visible' : 'Review has been hidden');
      },
      error: (e: any) => {
        this.processingId.set(null);
        this.toast.error(e?.error?.message || 'Failed to update review');
      },
    });
  }

  openDetail(rev: Review): void {
    if (this.processingId() === rev.id) return;
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
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  openPreview(imgUrl: string) { this.previewImage.set(this.mediaUrl(imgUrl)); }
  closePreview() { this.previewImage.set(null); }

  getStarsArray(rating: number): number[] { return Array(Math.min(5, Math.max(0, rating))).fill(0); }
  getEmptyStarsArray(rating: number): number[] { return Array(Math.max(0, 5 - rating)).fill(0); }

  getStatusBadgeClass(status: string): string {
    return status === 'visible' ? 'badge-success' : 'badge-muted';
  }
}
