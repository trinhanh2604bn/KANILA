import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { getChallengeById, type ChallengeParticipantPost } from '../challenges.data';

export interface UserChallengeSubmissionView {
  challengeId: string;
  challengeName: string;
  post: ChallengeParticipantPost;
}

/**
 * Bài user: metadata trong localStorage (`kanila_challenges_user_posts_v2`),
 * ảnh/video giữ blob URL trong bộ nhớ session (không base64 → tránh vượt quota).
 */
@Injectable({ providedIn: 'root' })
export class ChallengeUserStateService {
  private readonly joinedKey = 'kanila_challenges_joined_v1';
  private readonly userPostsKey = 'kanila_challenges_user_posts_v2';

  /** Blob/object URLs theo postId — chỉ sống trong phiên trình duyệt */
  private readonly memoryMedia = new Map<string, { urls: string[]; videoFlags: boolean[] }>();

  /** Phát sự kiện khi bài user thay đổi */
  private readonly revision$ = new Subject<void>();
  readonly postsRevision$ = this.revision$.asObservable();

  private pendingToast: string | null = null;

  setPendingToast(message: string): void {
    this.pendingToast = message;
  }

  consumePendingToast(): string | null {
    const t = this.pendingToast;
    this.pendingToast = null;
    return t;
  }

  isJoined(challengeId: string): boolean {
    return this.readJoined().has(challengeId);
  }

  setJoined(challengeId: string): void {
    const s = this.readJoined();
    s.add(challengeId);
    localStorage.setItem(this.joinedKey, JSON.stringify([...s]));
  }

  getUserPosts(challengeId: string): ChallengeParticipantPost[] {
    const map = this.readUserPostsMap();
    return (map[challengeId] ?? []).map((p) => this.hydratePost(p));
  }

  /** Tất cả bài user gửi (id `u-`) trên mọi challenge, mới nhất trước */
  getAllUserSubmissions(): UserChallengeSubmissionView[] {
    const map = this.readUserPostsMap();
    const out: UserChallengeSubmissionView[] = [];
    for (const challengeId of Object.keys(map)) {
      const list = map[challengeId] ?? [];
      const ch = getChallengeById(challengeId);
      for (const raw of list) {
        if (!raw.id?.startsWith('u-')) continue;
        const withId: ChallengeParticipantPost = {
          ...raw,
          challengeId: raw.challengeId ?? challengeId
        };
        const post = this.hydratePost(withId);
        out.push({
          challengeId,
          challengeName: post.challengeName ?? ch?.title ?? challengeId,
          post
        });
      }
    }
    return out.sort((a, b) => (b.post.createdAt ?? 0) - (a.post.createdAt ?? 0));
  }

  /** Bài người dùng đăng lên trước, sau đó bài mẫu (trùng id bỏ qua). */
  getMergedPosts(challengeId: string, seed: ChallengeParticipantPost[]): ChallengeParticipantPost[] {
    const extra = this.getUserPosts(challengeId);
    const seen = new Set<string>();
    const out: ChallengeParticipantPost[] = [];
    for (const p of extra) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    for (const p of seed) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(this.normalizeSeedPost(p));
      }
    }
    return out;
  }

  addUserPost(challengeId: string, post: ChallengeParticipantPost): boolean {
    const urls = post.media?.filter(Boolean) ?? [];
    const videoFlags =
      post.mediaVideoFlags && post.mediaVideoFlags.length === urls.length
        ? post.mediaVideoFlags
        : urls.map(() => false);

    if (urls.length) {
      this.memoryMedia.set(post.id, { urls, videoFlags });
    }

    const normalized = this.stripForStorage({
      ...post,
      challengeId,
      challengeName: post.challengeName
    });

    if (!this.postBelongsToChallenge(normalized, challengeId)) {
      return false;
    }

    const map = this.readUserPostsMap();
    const list = (map[challengeId] ?? []).filter((p) => this.postBelongsToChallenge(p, challengeId));
    map[challengeId] = [normalized, ...list];
    const payload = JSON.stringify(map);

    try {
      if (typeof localStorage === 'undefined') {
        throw Object.assign(new Error('localStorage không khả dụng'), { code: 'NO_STORAGE' });
      }
      localStorage.setItem(this.userPostsKey, payload);
    } catch (e: unknown) {
      this.memoryMedia.delete(post.id);
      const err = e as { name?: string; code?: number | string; message?: string };
      const quota =
        err?.name === 'QuotaExceededError' || err?.code === 22 || String(err?.code) === '22';
      if (quota) {
        throw Object.assign(new Error('Bộ nhớ trình duyệt đầy — thử ảnh nhỏ hơn hoặc ít file hơn.'), {
          code: 'QUOTA_EXCEEDED'
        });
      }
      throw Object.assign(new Error(err?.message || 'Không lưu được bài đăng.'), { code: 'STORAGE_ERROR' });
    }

    this.setJoined(challengeId);
    this.revision$.next();
    return true;
  }

  private postBelongsToChallenge(p: ChallengeParticipantPost, challengeId: string): boolean {
    if (p.challengeId != null && p.challengeId !== challengeId) return false;
    return true;
  }

  /** Chỉ metadata — không media/base64 (tránh quota). */
  private stripForStorage(p: ChallengeParticipantPost): ChallengeParticipantPost {
    return {
      id: p.id,
      challengeId: p.challengeId,
      challengeName: p.challengeName,
      userName: p.userName,
      avatar: p.avatar,
      caption: p.caption,
      likes: p.likes,
      createdAt: p.createdAt ?? Date.now(),
      image: '',
      media: undefined,
      mediaVideoFlags: undefined
    };
  }

  /** Gắn lại blob URL từ memory; sau F5 chỉ còn metadata + ảnh mẫu challenge. */
  private hydratePost(p: ChallengeParticipantPost): ChallengeParticipantPost {
    const mem = this.memoryMedia.get(p.id);
    if (mem?.urls?.length) {
      const firstNonVideo = mem.videoFlags.findIndex((v) => !v);
      const thumb = firstNonVideo >= 0 ? mem.urls[firstNonVideo] : mem.urls[0];
      return {
        ...p,
        image: thumb,
        media: mem.urls,
        mediaVideoFlags: mem.videoFlags,
        createdAt: p.createdAt ?? Date.now(),
        challengeId: p.challengeId,
        challengeName: p.challengeName
      };
    }

    const media = p.media?.filter(Boolean) ?? [];
    const image = p.image || media[0] || '';

    if (p.id.startsWith('u-') && !image) {
      const ch = getChallengeById(p.challengeId ?? '');
      return {
        ...p,
        image: ch?.thumbnail ?? '',
        media: undefined,
        mediaVideoFlags: undefined,
        createdAt: p.createdAt ?? Date.now()
      };
    }

    return {
      ...p,
      image,
      media: media.length > 0 ? media : undefined,
      createdAt: p.createdAt ?? Date.now(),
      challengeId: p.challengeId,
      challengeName: p.challengeName
    };
  }

  private normalizeSeedPost(p: ChallengeParticipantPost): ChallengeParticipantPost {
    const media = p.media?.filter(Boolean) ?? [];
    const image = p.image || media[0] || '';
    return {
      ...p,
      image,
      media: media.length > 0 ? media : undefined,
      createdAt: p.createdAt ?? Date.now(),
      challengeId: p.challengeId,
      challengeName: p.challengeName
    };
  }

  private readJoined(): Set<string> {
    try {
      const raw = localStorage.getItem(this.joinedKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw) as string[];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  private readUserPostsMap(): Record<string, ChallengeParticipantPost[]> {
    try {
      const raw = localStorage.getItem(this.userPostsKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, ChallengeParticipantPost[]>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
}
