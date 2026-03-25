import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CHALLENGES, formatChallengeDeadlineVi } from '../challenges/challenges.data';
import { TRENDING_GALLERY_ARTICLES } from '../shared/trending-gallery.data';
import { COMMUNITY_CURRENT_USER_ID, type CommunityPostItem } from '../shared/community-post.model';
import { CommunityPostsService } from '../shared/community-posts.service';

type FeedTab = 'forYou' | 'trending' | 'looks' | 'reviews' | 'swatches' | 'questions' | 'following' | 'saved';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './community.html',
  styleUrl: './community.css'
})
export class CommunityComponent implements OnInit, OnDestroy {
  private allShuffleOrder: string[] = [];
  private postsSub?: Subscription;

  activeTab: FeedTab = 'forYou';
  searchKeyword = '';
  sortBy: 'all' | 'newest' | 'popular' | 'bookmarked' = 'all';
  currentPage = 1;
  readonly pageSize = 10;
  isCreatePostOpen = false;
  isPostDetailOpen = false;
  selectedPost: CommunityPostItem | null = null;
  newComment = '';
  createPostTitle = '';
  createPostText = '';
  uploadedImages: string[] = [];
  isDragOverUpload = false;
  readonly currentUser = {
    id: COMMUNITY_CURRENT_USER_ID,
    name: 'Bạn',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80'
  };

  quickStats = {
    postCount: 12890,
    memberCount: 50245,
    activeChallenges: CHALLENGES.length,
    trendingLooks: 384
  };

  trendingTopics = ['#GlassSkin', '#SonBong', '#NoMakeupLook', '#SwatchMauMoi'];
  readonly trendingGalleryItems = TRENDING_GALLERY_ARTICLES.filter((a) =>
    ['tg-1', 'tg-2', 'tg-3', 'tg-4', 'tg-5'].includes(a.id)
  );
  readonly challengesHome = CHALLENGES.filter((c) => ['c1', 'c2', 'c3', 'c4'].includes(c.id));

  selectedFilters = {
    contentType: 'all',
    skinType: 'all'
  };

  posts: CommunityPostItem[] = [];

  constructor(
    private router: Router,
    private communityPosts: CommunityPostsService
  ) {}

  ngOnInit(): void {
    this.postsSub = this.communityPosts.postsObservable.subscribe((p) => {
      this.posts = p;
    });
    this.refreshAllShuffleOrder(this.communityPosts.getSnapshot());
  }

  ngOnDestroy(): void {
    this.postsSub?.unsubscribe();
  }

  goCommunityHome(): void {
    void this.router.navigate(['/community/communityhome']);
  }
  goGalleryPage(): void {
    void this.router.navigate(['/community/gallery']);
  }
  goChallengesPage(): void {
    void this.router.navigate(['/community/challenges']);
  }
  goProfilePage(): void {
    void this.router.navigate(['/community/profile']);
  }
  goTrendingGalleryDetail(id: string): void {
    void this.router.navigate(['/community/gallery', id]);
  }

  formatChallengeDeadline(iso: string): string {
    return formatChallengeDeadlineVi(iso);
  }

  goChallengeDetail(id: string): void {
    void this.router.navigate(['/community/challenges', id]);
  }

  goChallengeJoin(id: string): void {
    void this.router.navigate(['/community/challenges', id, 'join']);
  }

  get filteredPosts(): CommunityPostItem[] {
    const keyword = this.searchKeyword.trim().toLowerCase();
    const filtered = this.posts
      .filter((post) => {
        if (this.activeTab === 'forYou') return true;
        if (this.activeTab === 'trending') return post.likes > 300;
        if (this.activeTab === 'following') return post.author.following;
        if (this.activeTab === 'saved') return post.saved;
        return post.type === this.activeTab.slice(0, -1);
      })
      .filter((post) => `${post.title} ${post.caption} ${post.author.name}`.toLowerCase().includes(keyword))
      .filter((post) => (this.sortBy === 'bookmarked' ? post.saved : true));

    if (this.sortBy === 'all' && this.activeTab === 'forYou') {
      const orderIndex = new Map(this.allShuffleOrder.map((id, idx) => [id, idx]));
      const fallbackStart = this.allShuffleOrder.length;
      return [...filtered].sort((a, b) => {
        const aIdx = orderIndex.get(a.id) ?? (fallbackStart + this.posts.findIndex((p) => p.id === a.id));
        const bIdx = orderIndex.get(b.id) ?? (fallbackStart + this.posts.findIndex((p) => p.id === b.id));
        return aIdx - bIdx;
      });
    }

    if (this.sortBy === 'popular') {
      return [...filtered].sort((a, b) => b.likes + b.comments - (a.likes + a.comments));
    }
    if (this.sortBy === 'newest') {
      return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    }
    return filtered;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredPosts.length / this.pageSize));
  }

  get currentPageSafe(): number {
    return Math.min(Math.max(1, this.currentPage), this.totalPages);
  }

  get pagedPosts(): CommunityPostItem[] {
    const start = (this.currentPageSafe - 1) * this.pageSize;
    return this.filteredPosts.slice(start, start + this.pageSize);
  }

  get visiblePageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  setTab(tab: FeedTab): void {
    this.activeTab = tab;
    this.sortBy = 'all';
    this.currentPage = 1;
  }

  selectAll(): void {
    this.activeTab = 'forYou';
    this.sortBy = 'all';
    this.currentPage = 1;
    this.refreshAllShuffleOrder(this.posts);
  }

  setSort(sort: 'all' | 'newest' | 'popular' | 'bookmarked'): void {
    this.sortBy = sort;
    this.activeTab = 'forYou';
    this.currentPage = 1;
    if (sort === 'all') {
      this.refreshAllShuffleOrder(this.posts);
    }
  }

  clearFilters(): void {
    this.selectedFilters = { contentType: 'all', skinType: 'all' };
    this.searchKeyword = '';
    this.sortBy = 'all';
    this.currentPage = 1;
  }

  get canCreatePost(): boolean {
    return !!this.createPostTitle.trim() || !!this.createPostText.trim() || this.uploadedImages.length > 0;
  }

  openCreatePost(): void {
    this.isCreatePostOpen = true;
  }
  closeCreatePost(): void {
    this.isCreatePostOpen = false;
    this.resetCreatePostForm();
  }
  openPostDetail(post: CommunityPostItem): void {
    this.selectedPost = post;
    void this.router.navigate(['/community/post', post.id]);
  }
  closePostDetail(): void {
    this.selectedPost = null;
    this.isPostDetailOpen = false;
    this.newComment = '';
  }

  onUploadImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    this.processImageFiles(Array.from(files));

    input.value = '';
  }

  onUploadDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOverUpload = true;
  }

  onUploadDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOverUpload = false;
  }

  onUploadDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOverUpload = false;
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    this.processImageFiles(Array.from(files));
  }

  removeUploadedImage(index: number): void {
    this.uploadedImages = this.uploadedImages.filter((_, idx) => idx !== index);
  }

  createPost(): void {
    if (!this.canCreatePost) return;
    const createdAt = Date.now();
    const images = this.uploadedImages.length
      ? [...this.uploadedImages]
      : ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'];
    const titleInput = this.createPostTitle.trim();
    const content = this.createPostText.trim();

    const newPost: CommunityPostItem = {
      id: `p-${createdAt}`,
      type: 'look',
      title: titleInput || (content ? content.slice(0, 58) : 'Bài viết mới'),
      caption: content || 'Chia sẻ mới từ cộng đồng KANILA.',
      image: images[0],
      images,
      likes: 0,
      comments: 0,
      liked: false,
      saved: false,
      author: {
        id: this.currentUser.id,
        name: this.currentUser.name,
        avatar: this.currentUser.avatar,
        following: false
      },
      chips: ['Mới', 'KANILA'],
      tags: [{ name: 'Community Post', brand: 'KANILA', price: '0 đ' }],
      timestamp: 'Vừa xong',
      createdAt
    };

    this.communityPosts.addPost(newPost);
    this.sortBy = 'newest';
    this.activeTab = 'forYou';
    this.currentPage = 1;
    this.isCreatePostOpen = false;
    this.resetCreatePostForm();
  }

  toggleLike(id: string): void {
    this.communityPosts.toggleLike(id);
  }

  toggleSave(id: string): void {
    this.communityPosts.toggleSave(id);
  }

  toggleFollow(authorId: string): void {
    this.communityPosts.toggleFollow(authorId);
  }

  nextPage(): void {
    this.currentPage = this.currentPageSafe;
    if (this.currentPage < this.totalPages) this.currentPage += 1;
  }

  previousPage(): void {
    this.currentPage = this.currentPageSafe;
    if (this.currentPage > 1) this.currentPage -= 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  private refreshAllShuffleOrder(sourcePosts: CommunityPostItem[]): void {
    const ids = sourcePosts.map((post) => post.id);
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    this.allShuffleOrder = shuffled;
  }

  private resetCreatePostForm(): void {
    this.createPostTitle = '';
    this.createPostText = '';
    this.uploadedImages = [];
    this.isDragOverUpload = false;
  }

  private processImageFiles(files: File[]): void {
    const allowed = files.filter((file) => file.type.startsWith('image/'));
    allowed.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          this.uploadedImages = [...this.uploadedImages, result];
        }
      };
      reader.readAsDataURL(file);
    });
  }
}
