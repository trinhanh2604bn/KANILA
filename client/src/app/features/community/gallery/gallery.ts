import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TRENDING_GALLERY_ARTICLES } from '../trending-gallery.data';

type GalleryFilter = 'trending' | 'newest' | 'loved';

interface GalleryItem {
  id: string;
  image: string;
  caption: string;
  excerpt: string;
  date: string;
  user: string;
  avatar: string;
  likes: number;
  views: number;
  comments: number;
  createdAt: number;
  size: 'large' | 'small';
  layout: 'media-left' | 'media-right';
  products: string[];
}

@Component({
  selector: 'app-community-gallery',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css'
})
export class GalleryPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('galleryCard') galleryCards!: QueryList<ElementRef<HTMLElement>>;
  isLoading = true;
  activeFilter: GalleryFilter = 'trending';
  revealedIds = new Set<string>();
  likedIds = new Set<string>();
  savedIds = new Set<string>();
  heartPulseIds = new Set<string>();
  private revealObserver: IntersectionObserver | null = null;

  readonly items: GalleryItem[] = TRENDING_GALLERY_ARTICLES.map((a) => ({
    id: a.id,
    image: a.image,
    caption: a.title,
    excerpt: a.excerpt,
    date: a.date,
    user: a.authorName,
    avatar: a.authorAvatar,
    likes: a.likes,
    views: a.views,
    comments: a.commentsCount,
    createdAt: a.createdAt,
    size: a.size,
    layout: a.layout,
    products: a.tags
  }));

  constructor(private router: Router) {}

  ngOnInit(): void {
    window.setTimeout(() => {
      this.isLoading = false;
      this.observeCards();
    }, 650);
  }
  ngAfterViewInit(): void {
    this.galleryCards.changes.subscribe(() => this.observeCards());
  }
  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
  }

  get filteredItems(): GalleryItem[] {
    const cloned = [...this.items];
    if (this.activeFilter === 'newest') return cloned.sort((a, b) => b.createdAt - a.createdAt);
    if (this.activeFilter === 'loved') return cloned.sort((a, b) => b.likes - a.likes);
    return cloned.sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
  }

  get masonryItems(): GalleryItem[] {
    return this.filteredItems;
  }

  setFilter(filter: GalleryFilter): void {
    this.activeFilter = filter;
    window.setTimeout(() => this.observeCards(), 0);
  }

  toggleLike(item: GalleryItem): void {
    if (this.likedIds.has(item.id)) {
      this.likedIds.delete(item.id);
      return;
    }
    this.likedIds.add(item.id);
    this.heartPulseIds.add(item.id);
    window.setTimeout(() => this.heartPulseIds.delete(item.id), 300);
  }

  toggleSave(item: GalleryItem): void {
    if (this.savedIds.has(item.id)) {
      this.savedIds.delete(item.id);
      return;
    }
    this.savedIds.add(item.id);
  }

  getLikeCount(item: GalleryItem): number {
    return item.likes + (this.likedIds.has(item.id) ? 1 : 0);
  }

  /** Truncates long excerpts and appends ....., full text available via title on the element. */
  formatGalleryExcerpt(text: string | undefined, maxChars = 188): string {
    const t = (text ?? '').trim().replace(/\s+/g, ' ');
    if (t.length <= maxChars) return t;
    let cut = t.slice(0, maxChars);
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > Math.floor(maxChars * 0.55)) cut = cut.slice(0, lastSpace);
    return `${cut}.....`;
  }

  goToDetail(id: string): void {
    void this.router.navigate(['/community/gallery', id]);
  }

  goCommunityHome(): void {
    void this.router.navigate(['/community/communityhome']);
  }

  private observeCards(): void {
    if (this.isLoading || !this.galleryCards?.length) return;
    this.revealObserver?.disconnect();
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset['id'];
            if (id) this.revealedIds.add(id);
            this.revealObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    this.galleryCards.forEach((card) => this.revealObserver?.observe(card.nativeElement));
  }
}
