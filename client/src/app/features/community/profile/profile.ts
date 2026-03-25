import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import type { CommunityPostItem } from '../community-post.model';
import { CommunityPostsService } from '../community-posts.service';
import {
  ChallengeUserStateService,
  type UserChallengeSubmissionView
} from '../challenges/challenge-user-state.service';
import {
  getPostDisplayMedia,
  isVideoMediaUrl,
  type ChallengeParticipantPost
} from '../challenges/challenges.data';

export type ProfileTab = 'posts' | 'saved' | 'liked' | 'challenges';

@Component({
  selector: 'app-community-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfilePage implements OnInit, OnDestroy {
  private communitySub?: Subscription;
  private challengeSub?: Subscription;
  private toastTimer?: number;

  readonly tabs: { id: ProfileTab; label: string }[] = [
    { id: 'posts', label: 'Bài viết' },
    { id: 'saved', label: 'Đã lưu' },
    { id: 'liked', label: 'Đã thích' },
    { id: 'challenges', label: 'Challenges' }
  ];

  activeTab: ProfileTab = 'posts';
  isLoading = true;
  readonly skeletonSlots = [0, 1, 2, 3, 4, 5];

  readonly user = {
    name: 'Bạn',
    handle: '@kanila_beauty',
    bio: 'Beauty lover ',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80'
  };

  followers = 1890;
  following = 356;

  myPosts: CommunityPostItem[] = [];
  savedPosts: CommunityPostItem[] = [];
  likedPosts: CommunityPostItem[] = [];
  challengeSubmissions: UserChallengeSubmissionView[] = [];

  modalPost: CommunityPostItem | null = null;
  modalChallenge: UserChallengeSubmissionView | null = null;

  toastMessage = '';
  toastVisible = false;

  /** Bình luận mock trong overlay */
  readonly mockThread = [
    { user: 'Linh An', text: 'Bài này rất hữu ích, cảm ơn bạn đã chia sẻ!' },
    { user: 'Mai Trâm', text: 'Layout xinh quá, mình bookmark lại rồi nhé.' }
  ];

  constructor(
    private router: Router,
    private communityPosts: CommunityPostsService,
    private challengeState: ChallengeUserStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshLists();
    this.communitySub = this.communityPosts.postsObservable.subscribe(() => {
      this.refreshLists();
      this.cdr.markForCheck();
    });
    this.challengeSub = this.challengeState.postsRevision$.subscribe(() => {
      this.refreshChallengeList();
      this.cdr.markForCheck();
    });
    window.setTimeout(() => {
      this.isLoading = false;
      this.cdr.markForCheck();
    }, 500);
  }

  ngOnDestroy(): void {
    this.communitySub?.unsubscribe();
    this.challengeSub?.unsubscribe();
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
  }

  get statsPosts(): number {
    return this.myPosts.length;
  }

  goCommunityHome(): void {
    void this.router.navigate(['/community/communityhome']);
  }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
    this.closeModals();
  }

  refreshLists(): void {
    this.myPosts = this.communityPosts.getMyPosts().sort((a, b) => b.createdAt - a.createdAt);
    this.savedPosts = this.communityPosts.getSavedPosts().sort((a, b) => b.createdAt - a.createdAt);
    this.likedPosts = this.communityPosts.getLikedPosts().sort((a, b) => b.createdAt - a.createdAt);
    this.refreshChallengeList();
  }

  refreshChallengeList(): void {
    this.challengeSubmissions = this.challengeState.getAllUserSubmissions();
  }

  get emptyMessage(): string {
    switch (this.activeTab) {
      case 'saved':
        return 'Bạn chưa lưu bài viết nào';
      case 'liked':
        return 'Không có dữ liệu — bạn chưa thích bài nào';
      case 'challenges':
        return 'Bạn chưa gửi bài challenge nào';
      case 'posts':
        return 'Bạn chưa đăng bài nào — hãy tạo bài từ Community';
      default:
        return 'Không có dữ liệu';
    }
  }

  hasList(): boolean {
    switch (this.activeTab) {
      case 'posts':
        return this.myPosts.length > 0;
      case 'saved':
        return this.savedPosts.length > 0;
      case 'liked':
        return this.likedPosts.length > 0;
      case 'challenges':
        return this.challengeSubmissions.length > 0;
      default:
        return false;
    }
  }

  openPostModal(post: CommunityPostItem): void {
    this.modalChallenge = null;
    this.modalPost = post;
  }

  openChallengeModal(row: UserChallengeSubmissionView): void {
    this.modalPost = null;
    this.modalChallenge = row;
  }

  closeModals(): void {
    this.modalPost = null;
    this.modalChallenge = null;
  }

  deleteMyPost(id: string, event: Event): void {
    event.stopPropagation();
    if (!this.communityPosts.deletePost(id)) return;
    this.showToast('Xóa bài viết thành công');
    if (this.modalPost?.id === id) this.modalPost = null;
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastVisible = false;
      this.toastMessage = '';
      this.cdr.markForCheck();
    }, 3200);
  }

  formatDate(ms: number): string {
    const d = new Date(ms);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  safeCreatedAt(post: ChallengeParticipantPost): number {
    return post.createdAt ?? Date.now();
  }

  challengeMedia(post: ChallengeParticipantPost): string[] {
    return getPostDisplayMedia(post);
  }

  isChallengeVideo(url: string, post: ChallengeParticipantPost): boolean {
    if (isVideoMediaUrl(url)) return true;
    const flags = post.mediaVideoFlags;
    const media = post.media;
    if (flags?.length && media?.length) {
      const idx = media.indexOf(url);
      if (idx >= 0) return !!flags[idx];
    }
    return false;
  }

  trackPost(_: number, p: CommunityPostItem): string {
    return p.id;
  }

  trackChallenge(_: number, row: UserChallengeSubmissionView): string {
    return row.post.id + row.challengeId;
  }
}
