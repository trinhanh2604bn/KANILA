import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommunityPostsService } from '../community-posts.service';
import type { CommunityPostItem } from '../community-post.model';

interface DetailAuthor {
  name: string;
  avatar: string;
  badge: string;
}

interface DetailComment {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
}

interface PostCommentsEntry {
  postId: string;
  comments: DetailComment[];
}

interface DetailPost {
  id: string;
  title: string;
  caption: string;
  timestamp: string;
  author: DetailAuthor;
  images: string[];
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
}

@Component({
  selector: 'app-community-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css'
})
export class PostDetailPage implements OnInit, OnDestroy {
  private readonly commentsStorageKey = 'kanila_post_comments_v1';
  private postsSub?: Subscription;

  post: DetailPost | null = null;
  currentImageIndex = 0;
  newComment = '';
  postId = '';
  comments: DetailComment[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private communityPosts: CommunityPostsService
  ) {}

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id') ?? '';
    this.reloadPost();
    this.comments = this.loadComments(this.postId);
    this.postsSub = this.communityPosts.postsObservable.subscribe(() => {
      this.reloadPost();
    });
  }

  ngOnDestroy(): void {
    this.postsSub?.unsubscribe();
  }

  get mainImage(): string {
    if (!this.post) return '';
    return this.post.images[this.currentImageIndex] ?? this.post.images[0];
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  toggleLike(): void {
    if (!this.post) return;
    this.communityPosts.toggleLike(this.post.id);
  }

  toggleSave(): void {
    if (!this.post) return;
    this.communityPosts.toggleSave(this.post.id);
  }

  addComment(): void {
    if (!this.newComment.trim() || !this.post) return;
    this.comments = [
      ...this.comments,
      {
        id: `c-${Date.now()}`,
        user: 'Bạn',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80',
        content: this.newComment.trim(),
        timestamp: 'Vừa xong'
      }
    ];
    this.communityPosts.incrementComments(this.post.id);
    this.saveComments(this.post.id, this.comments);
    this.newComment = '';
  }

  goBack(): void {
    void this.router.navigate(['/community/communityhome']);
  }

  private reloadPost(): void {
    const found = this.communityPosts.getPostById(this.postId);
    this.post = found ? this.mapToDetail(found) : this.getFallbackPost(this.postId);
    this.currentImageIndex = 0;
  }

  private mapToDetail(p: CommunityPostItem): DetailPost {
    const images = p.images?.length ? p.images : [p.image];
    return {
      id: p.id,
      title: p.title,
      caption: p.caption,
      timestamp: p.timestamp,
      author: { name: p.author.name, avatar: p.author.avatar, badge: 'Beauty Creator' },
      images,
      likes: p.likes,
      comments: p.comments,
      liked: p.liked,
      saved: p.saved
    };
  }

  private loadComments(postId: string): DetailComment[] {
    const raw = localStorage.getItem(this.commentsStorageKey);
    if (!raw) return this.getDefaultComments();
    try {
      const entries = JSON.parse(raw) as PostCommentsEntry[];
      const found = entries.find((entry) => entry.postId === postId);
      return found?.comments?.length ? found.comments : this.getDefaultComments();
    } catch {
      return this.getDefaultComments();
    }
  }

  private saveComments(postId: string, comments: DetailComment[]): void {
    const raw = localStorage.getItem(this.commentsStorageKey);
    let entries: PostCommentsEntry[] = [];
    if (raw) {
      try {
        entries = JSON.parse(raw) as PostCommentsEntry[];
      } catch {
        entries = [];
      }
    }
    const existingIndex = entries.findIndex((entry) => entry.postId === postId);
    if (existingIndex >= 0) {
      entries[existingIndex] = { postId, comments };
    } else {
      entries.push({ postId, comments });
    }
    localStorage.setItem(this.commentsStorageKey, JSON.stringify(entries));
  }

  private getDefaultComments(): DetailComment[] {
    return [
      {
        id: 'c1',
        user: 'Linh An',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        content: 'Layout này xinh quá, mình sẽ thử ngay cuối tuần.',
        timestamp: '1 giờ trước'
      },
      {
        id: 'c2',
        user: 'Mai Trâm',
        avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=120&q=80',
        content: 'Màu son hợp da sáng và da trung bình luôn.',
        timestamp: '30 phút trước'
      }
    ];
  }

  private getFallbackPost(id: string): DetailPost {
    return {
      id,
      title: `Bài chia sẻ làm đẹp ${id ? '#' + id.split('-').pop() : ''}`.trim(),
      caption: 'Bài viết này hiện chưa có dữ liệu đầy đủ. Vui lòng quay lại trang Community để tải dữ liệu mới.',
      timestamp: 'Vừa xong',
      author: {
        name: 'KANILA User',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
        badge: 'Beauty Creator'
      },
      images: ['https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=1400&q=80'],
      likes: 0,
      comments: 0,
      liked: false,
      saved: false
    };
  }
}
