import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChallengeUserStateService } from '../../../services/challenge-user-state.service';
import {
  CHALLENGE_SUBMIT_SUCCESS_MESSAGE,
  ChallengeDefinition,
  ChallengeParticipantPost,
  formatChallengeDeadlineVi,
  getChallengeById,
  getPostDisplayMedia,
  isVideoMediaUrl
} from '../challenges.data';

@Component({
  selector: 'app-challenge-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-detail.html',
  styleUrl: './challenge-detail.css'
})
export class ChallengeDetailPage implements OnInit, OnDestroy {
  private routeSub?: Subscription;
  private revSub?: Subscription;
  private toastClearId?: number;
  challenge: ChallengeDefinition | null = null;
  mergedPosts: ChallengeParticipantPost[] = [];
  readonly formatDeadline = formatChallengeDeadlineVi;

  toastVisible = false;
  toastMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userState: ChallengeUserStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.revSub = this.userState.postsRevision$.subscribe(() => {
      if (this.challenge) {
        this.refreshPosts();
        this.cdr.detectChanges();
      }
    });

    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';
      const found = getChallengeById(id);
      if (!found) {
        void this.router.navigate(['/community/challenges']);
        return;
      }
      this.challenge = found;
      this.refreshPosts();
      this.cdr.detectChanges();
      this.showSubmitSuccessToast();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.revSub?.unsubscribe();
    if (this.toastClearId) window.clearTimeout(this.toastClearId);
  }

  postMedia(post: ChallengeParticipantPost): string[] {
    return getPostDisplayMedia(post);
  }

  /** data:video + blob kèm `mediaVideoFlags` (join không dùng base64). */
  isVideoUrl(url: string, post: ChallengeParticipantPost): boolean {
    if (isVideoMediaUrl(url)) return true;
    const flags = post.mediaVideoFlags;
    const media = post.media;
    if (flags?.length && media?.length) {
      const idx = media.indexOf(url);
      if (idx >= 0) return !!flags[idx];
    }
    return false;
  }

  refreshPosts(): void {
    if (!this.challenge) return;
    this.mergedPosts = [
      ...this.userState.getMergedPosts(this.challenge.id, this.challenge.posts)
    ];
  }

  /**
   * Tin nhắn từ service (trước navigate) hoặc `history.state` (Router.navigate state)
   * để luôn hiển thị sau khi bấm Đăng trên trang join.
   */
  private showSubmitSuccessToast(): void {
    if (this.shouldSkipDetailSuccessToast()) return;
    const fromService = this.userState.consumePendingToast();
    const fromHistory = this.readSubmitToastFromHistory();
    if (!fromService && !fromHistory) return;
    this.toastMessage = CHALLENGE_SUBMIT_SUCCESS_MESSAGE;
    this.toastVisible = true;
    this.cdr.detectChanges();
    if (this.toastClearId) window.clearTimeout(this.toastClearId);
    this.toastClearId = window.setTimeout(() => {
      this.toastVisible = false;
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  private readSubmitToastFromHistory(): string | null {
    if (typeof history === 'undefined' || history.state == null) return null;
    const s = history.state as Record<string, unknown>;
    const raw = s['submitToast'];
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  }

  /** Đã hiện toast trên trang join trước khi chuyển sang detail — tránh trùng thông báo. */
  private shouldSkipDetailSuccessToast(): boolean {
    if (typeof history === 'undefined' || history.state == null) return false;
    const s = history.state as Record<string, unknown>;
    return s['skipDetailSuccessToast'] === true;
  }

  daysLeft(iso: string): number {
    const end = this.parseLocal(iso);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - start.getTime()) / 86400000);
  }

  deadlineCountdown(iso: string): string {
    const d = this.daysLeft(iso);
    if (d < 0) return 'Đã kết thúc';
    if (d === 0) return 'Hôm nay là ngày cuối';
    return `Còn ${d} ngày`;
  }

  goJoin(): void {
    if (!this.challenge) return;
    void this.router.navigate(['/community/challenges', this.challenge.id, 'join']);
  }

  goBack(): void {
    void this.router.navigate(['/community/challenges']);
  }

  private parseLocal(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
}
