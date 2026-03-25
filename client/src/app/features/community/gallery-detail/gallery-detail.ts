import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  TRENDING_GALLERY_ARTICLES,
  TrendingGalleryArticle,
  getTrendingArticleById
} from '../trending-gallery.data';

interface GalleryDetailComment {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
}

@Component({
  selector: 'app-gallery-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gallery-detail.html',
  styleUrl: './gallery-detail.css'
})
export class GalleryDetailPage implements OnInit, OnDestroy {
  private readonly commentsKey = 'kanila_gallery_comments_v1';
  private routeSub?: Subscription;

  article: TrendingGalleryArticle | null = null;
  otherArticles: TrendingGalleryArticle[] = [];
  comments: GalleryDetailComment[] = [];
  newComment = '';
  currentUserName = 'Ngọc Anh';
  showAllComments = false;
  readonly previewCommentCount = 4;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';
      const found = getTrendingArticleById(id);
      if (!found) {
        this.router.navigate(['/community/gallery']);
        return;
      }
      this.article = found;
      this.otherArticles = TRENDING_GALLERY_ARTICLES.filter((a) => a.id !== id).slice(0, 3);
      this.comments = this.loadComments(id);
      this.showAllComments = false;
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  get displayedComments(): GalleryDetailComment[] {
    if (this.showAllComments || this.comments.length <= this.previewCommentCount) {
      return this.comments;
    }
    return this.comments.slice(0, this.previewCommentCount);
  }

  toggleShowMoreComments(): void {
    this.showAllComments = !this.showAllComments;
  }

  postComment(): void {
    if (!this.article || !this.newComment.trim()) return;
    const c: GalleryDetailComment = {
      id: `gc-${Date.now()}`,
      user: this.currentUserName,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
      content: this.newComment.trim(),
      timestamp: 'Vừa xong'
    };
    this.comments = [...this.comments, c];
    this.saveComments(this.article.id, this.comments);
    this.newComment = '';
  }

  goBack(): void {
    this.router.navigate(['/community/gallery']);
  }

  private loadComments(articleId: string): GalleryDetailComment[] {
    try {
      const raw = localStorage.getItem(this.commentsKey);
      if (!raw) return this.defaultComments();
      const map = JSON.parse(raw) as Record<string, GalleryDetailComment[]>;
      if (map && Array.isArray(map[articleId])) return map[articleId];
      return this.defaultComments();
    } catch {
      return this.defaultComments();
    }
  }

  private saveComments(articleId: string, list: GalleryDetailComment[]): void {
    try {
      const raw = localStorage.getItem(this.commentsKey);
      const map = raw ? (JSON.parse(raw) as Record<string, GalleryDetailComment[]>) : {};
      map[articleId] = list;
      localStorage.setItem(this.commentsKey, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }

  private defaultComments(): GalleryDetailComment[] {
    return [
      {
        id: 'd1',
        user: 'Ngân',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80',
        content: 'Bài viết rất hay! Cho mình xin thêm tips chọn tông son với da ngăm được không ạ?',
        timestamp: '1 phút trước'
      },
      {
        id: 'd2',
        user: 'Minh Anh',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80',
        content: 'Layout sạch và dễ đọc quá ❤️ KANILA community đỉnh!',
        timestamp: '12 phút trước'
      }
    ];
  }
}
