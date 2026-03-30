import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  type CommunityPostItem,
  type CommunityAuthor,
  COMMUNITY_CURRENT_USER_ID,
  type PostType
} from './community-post.model';

const STORAGE_KEY = 'kanila_community_posts_v1';

@Injectable({ providedIn: 'root' })
export class CommunityPostsService {
  private readonly posts$ = new BehaviorSubject<CommunityPostItem[]>([]);

  /** Đồng bộ realtime giữa communityhome / profile */
  readonly postsObservable = this.posts$.asObservable();

  constructor() {
    this.posts$.next(this.loadInitial());
  }

  getSnapshot(): CommunityPostItem[] {
    return this.posts$.value;
  }

  /** Bài do user hiện tại tạo (Tạo bài viết) */
  getMyPosts(): CommunityPostItem[] {
    return this.getSnapshot().filter((p) => p.author.id === COMMUNITY_CURRENT_USER_ID);
  }

  getSavedPosts(): CommunityPostItem[] {
    return this.getSnapshot().filter((p) => p.saved);
  }

  getLikedPosts(): CommunityPostItem[] {
    return this.getSnapshot().filter((p) => p.liked);
  }

  addPost(post: CommunityPostItem): void {
    const next = [post, ...this.getSnapshot()];
    this.persist(next);
  }

  deletePost(id: string): boolean {
    const cur = this.getSnapshot();
    const post = cur.find((p) => p.id === id);
    if (!post || post.author.id !== COMMUNITY_CURRENT_USER_ID) return false;
    this.persist(cur.filter((p) => p.id !== id));
    return true;
  }

  toggleLike(id: string): void {
    const next = this.getSnapshot().map((p) => {
      if (p.id !== id) return p;
      const nextLiked = !p.liked;
      return {
        ...p,
        liked: nextLiked,
        likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
      };
    });
    this.persist(next);
  }

  toggleSave(id: string): void {
    const next = this.getSnapshot().map((p) => (p.id === id ? { ...p, saved: !p.saved } : p));
    this.persist(next);
  }

  toggleFollow(authorId: string): void {
    const next = this.getSnapshot().map((p) =>
      p.author.id === authorId ? { ...p, author: { ...p.author, following: !p.author.following } } : p
    );
    this.persist(next);
  }

  incrementComments(id: string): void {
    const next = this.getSnapshot().map((p) => (p.id === id ? { ...p, comments: p.comments + 1 } : p));
    this.persist(next);
  }

  getPostById(id: string): CommunityPostItem | undefined {
    return this.getSnapshot().find((p) => p.id === id);
  }

  private persist(posts: CommunityPostItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch {
      /* ignore quota */
    }
    this.posts$.next(posts);
  }

  private loadInitial(): CommunityPostItem[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as CommunityPostItem[];
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    const generated = this.buildDefaultPosts();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(generated));
    } catch {
      /* ignore */
    }
    return generated;
  }

  private formatTimeAgo(dateMs: number): string {
    const diffHours = Math.max(1, Math.floor((Date.now() - dateMs) / (1000 * 60 * 60)));
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const days = Math.floor(diffHours / 24);
    return `${days} ngày trước`;
  }

  private buildDefaultPosts(): CommunityPostItem[] {
    const users: CommunityAuthor[] = [
      { id: 'u1', name: 'Ngọc Trâm', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', following: false },
      { id: 'u2', name: 'Bảo Nghi', avatar: 'https://images.unsplash.com/photo-1601412436009-d964bd02edbc?auto=format&fit=crop&w=200&q=80', following: false },
      { id: 'u3', name: 'Mai Anh', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80', following: false },
      { id: 'u4', name: 'Khánh Linh', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', following: false },
      { id: 'u5', name: 'Thảo Vy', avatar: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=200&q=80', following: false },
      { id: 'u6', name: 'Hà My', avatar: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=200&q=80', following: false }
    ];
    const imagePool = [
      'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1598528738936-c50861cc75a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1608979048467-6194dabc6a3d?auto=format&fit=crop&w=1200&q=80',
      'https://plus.unsplash.com/premium_photo-1683120953880-fc8b6213b627?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80'
    ];
    const captions = [
      'Layout nhẹ nhàng đi làm, nền mỏng và má hồng peach.',
      'Routine skincare sáng giúp da căng bóng trước makeup.',
      'Swatch son mới với ánh bóng trong trẻo dễ dùng hằng ngày.',
      'Tips giữ nền không mốc khi ngồi điều hòa nhiều giờ.',
      'Look đi tiệc tông hồng nâu với eyeliner mềm.',
      'Review kem chống nắng nâng tông cho da dầu.',
      'Bảng màu mắt dễ tán cho người mới bắt đầu.',
      'Combo cushion và che khuyết điểm cho da hỗn hợp.',
      'Gợi ý son MLBB hợp tông da trung bình.',
      'Thử nghiệm dưỡng ẩm 7 ngày và kết quả trên da.'
    ];
    const types: PostType[] = ['look', 'review', 'swatch', 'tip', 'question', 'poll'];
    const posts: CommunityPostItem[] = [];

    for (let i = 0; i < 30; i += 1) {
      const author = users[i % users.length];
      const createdAt = Date.now() - i * 1000 * 60 * 90;
      const imageA = imagePool[i % imagePool.length];
      const imageB = imagePool[(i + 1) % imagePool.length];
      const imageC = imagePool[(i + 2) % imagePool.length];
      const imageD = imagePool[(i + 3) % imagePool.length];
      posts.push({
        id: `p-${i + 1}`,
        type: types[i % types.length],
        title: `Bài chia sẻ làm đẹp #${i + 1}`,
        caption: `${captions[i % captions.length]} (Post ${i + 1})`,
        image: imageA,
        images: [imageA, imageB, imageC, imageD],
        likes: 120 + i * 11,
        comments: 18 + (i % 12) * 4,
        liked: false,
        saved: i % 4 === 0,
        author: { ...author, following: i % 5 === 0 },
        chips: ['KANILA', 'Beauty'],
        tags: [{ name: 'Best Pick', brand: 'KANILA', price: `${399 + i * 7}.000 đ` }],
        timestamp: this.formatTimeAgo(createdAt),
        createdAt
      });
    }
    return posts;
  }
}
