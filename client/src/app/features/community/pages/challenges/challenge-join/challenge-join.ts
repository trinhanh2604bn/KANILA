import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChallengeUserStateService } from '../../../services/challenge-user-state.service';
import {
  CHALLENGE_SUBMIT_SUCCESS_MESSAGE,
  ChallengeDefinition,
  ChallengeParticipantPost,
  getChallengeById
} from '../challenges.data';

const MAX_FILES = 5;
const MAX_WARN = 'Chỉ được tải lên tối đa 5 ảnh hoặc video';

interface PendingMedia {
  id: string;
  url: string;
  file: File;
}

@Component({
  selector: 'app-challenge-join',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './challenge-join.html',
  styleUrl: './challenge-join.css'
})
export class ChallengeJoinPage implements OnInit, OnDestroy {
  private routeSub?: Subscription;
  challenge: ChallengeDefinition | null = null;
  caption = '';
  isDragOver = false;
  readonly maxFiles = MAX_FILES;

  pendingMedia: PendingMedia[] = [];
  fileLimitWarning = '';
  submitSuccessVisible = false;
  submitting = false;
  /** Hiển thị khi bấm Đăng mà chưa đủ ảnh/video hoặc caption */
  validationMessage = '';
  /** Lỗi đọc file / lưu localStorage */
  submitError = '';

  readonly submitSuccessMessage = CHALLENGE_SUBMIT_SUCCESS_MESSAGE;

  readonly currentUser = {
    name: 'Bạn',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userState: ChallengeUserStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';
      const found = getChallengeById(id);
      if (!found) {
        void this.router.navigate(['/community/challenges']);
        return;
      }
      this.challenge = found;
      this.resetForm();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.revokeAllObjectUrls();
  }

  get challengeTitle(): string {
    return this.challenge?.title ?? '';
  }

  onCaptionChange(): void {
    this.validationMessage = '';
    this.submitError = '';
  }

  get canSubmit(): boolean {
    return this.pendingMedia.length > 0 || !!this.caption.trim();
  }

  get slotsLeft(): number {
    return Math.max(0, MAX_FILES - this.pendingMedia.length);
  }

  openFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  onDropZoneClick(input: HTMLInputElement): void {
    this.clearWarning();
    this.openFilePicker(input);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files?.length) this.addFiles(files);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files?.length) this.addFiles(files);
  }

  addFiles(fileList: FileList | File[]): void {
    this.clearWarning();
    const arr = Array.from(fileList as FileList);
    const valid = arr.filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    const room = MAX_FILES - this.pendingMedia.length;
    if (room <= 0) {
      this.fileLimitWarning = MAX_WARN;
      return;
    }
    if (valid.length > room) {
      this.fileLimitWarning = MAX_WARN;
      valid.splice(0, room).forEach((f) => this.pushPending(f));
      return;
    }
    valid.forEach((f) => this.pushPending(f));
  }

  removePending(id: string): void {
    const idx = this.pendingMedia.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const [removed] = this.pendingMedia.splice(idx, 1);
    URL.revokeObjectURL(removed.url);
  }

  isVideoFile(f: File): boolean {
    return f.type.startsWith('video/');
  }

  /** Luôn gọi từ template — báo rõ nếu chưa đủ điều kiện (nút không còn bị disabled im lặng). */
  onSubmitClick(): void {
    if (this.submitting) return;
    this.submitError = '';
    if (!this.challenge) {
      this.validationMessage = 'Không tìm thấy challenge. Quay lại danh sách Challenges.';
      this.cdr.detectChanges();
      return;
    }
    if (!this.canSubmit) {
      this.validationMessage =
        'Cần ít nhất một ảnh/video hoặc một caption có nội dung (không chỉ khoảng trắng). Hãy thêm rồi bấm Đăng lại.';
      this.cdr.detectChanges();
      return;
    }
    this.validationMessage = '';
    void this.submit();
  }

  async submit(): Promise<void> {
    if (!this.challenge || !this.canSubmit || this.submitting) return;
    this.submitting = true;
    this.submitError = '';
    const caption = this.caption.trim();
    try {
      const ch = this.challenge;
      const mediaUrls = this.pendingMedia.map((p) => p.url);
      const videoFlags = this.pendingMedia.map((p) => p.file.type.startsWith('video/'));
      const thumb =
        mediaUrls.find((_, i) => !videoFlags[i]) ?? mediaUrls[0] ?? ch.thumbnail;

      const post: ChallengeParticipantPost = {
        id: `u-${Date.now()}`,
        challengeId: ch.id,
        challengeName: ch.title,
        userName: this.currentUser.name,
        avatar: this.currentUser.avatar,
        caption,
        image: thumb,
        media: mediaUrls.length > 0 ? mediaUrls : undefined,
        mediaVideoFlags: mediaUrls.length > 0 ? videoFlags : undefined,
        likes: 0,
        createdAt: Date.now()
      };

      this.userState.addUserPost(ch.id, post);
      /** Blob URL đã chuyển sang service — không revoke trong join */
      this.pendingMedia = [];

      this.submitSuccessVisible = true;
      this.cdr.detectChanges();
      await this.delay(900);
      this.submitSuccessVisible = false;
      this.cdr.detectChanges();

      await this.router.navigate(['/community/challenges', ch.id], {
        state: { skipDetailSuccessToast: true }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng bài thất bại. Mở Console (F12) để xem chi tiết.';
      this.submitError = msg;
      console.error('[challenge-join] submit failed', err);
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  cancel(): void {
    if (!this.challenge) {
      void this.router.navigate(['/community/challenges']);
      return;
    }
    void this.router.navigate(['/community/challenges', this.challenge.id]);
  }

  private clearWarning(): void {
    this.fileLimitWarning = '';
  }

  private pushPending(file: File): void {
    if (this.pendingMedia.length >= MAX_FILES) {
      this.fileLimitWarning = MAX_WARN;
      return;
    }
    const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const url = URL.createObjectURL(file);
    this.pendingMedia = [...this.pendingMedia, { id, url, file }];
  }

  private revokeAllObjectUrls(): void {
    this.pendingMedia.forEach((p) => URL.revokeObjectURL(p.url));
    this.pendingMedia = [];
  }

  private resetForm(): void {
    this.revokeAllObjectUrls();
    this.caption = '';
    this.fileLimitWarning = '';
    this.isDragOver = false;
    this.validationMessage = '';
    this.submitError = '';
  }
}
