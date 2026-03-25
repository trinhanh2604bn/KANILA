import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ChallengeUserStateService } from './challenge-user-state.service';
import { CHALLENGES, type ChallengeDefinition } from './challenges.data';

type ChallengeFilter = 'all' | 'ending' | 'popular' | 'rewards' | 'joined';
type ChallengeSort = 'newest' | 'popular' | 'ending';

@Component({
  selector: 'app-community-challenges',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './challenges.html',
  styleUrl: './challenges.css'
})
export class ChallengesPage {
  activeFilter: ChallengeFilter = 'all';
  sortBy: ChallengeSort = 'newest';

  /** Dữ liệu dùng chung với community home */
  readonly cards: readonly ChallengeDefinition[] = CHALLENGES;

  constructor(
    private router: Router,
    private userState: ChallengeUserStateService
  ) {}

  goCommunityHome(): void {
    void this.router.navigate(['/community/communityhome']);
  }

  goDetail(id: string, event?: Event): void {
    event?.stopPropagation();
    void this.router.navigate(['/community/challenges', id]);
  }

  goJoin(id: string, event?: Event): void {
    event?.stopPropagation();
    void this.router.navigate(['/community/challenges', id, 'join']);
  }

  onPrimaryCta(c: ChallengeDefinition, event: Event): void {
    event.stopPropagation();
    if (this.userState.isJoined(c.id)) return;
    this.goJoin(c.id);
  }

  isJoined(id: string): boolean {
    return this.userState.isJoined(id);
  }

  setFilter(f: ChallengeFilter): void {
    this.activeFilter = f;
  }

  onSortChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value as ChallengeSort;
    if (v === 'newest' || v === 'popular' || v === 'ending') this.sortBy = v;
  }

  get filteredCards(): ChallengeDefinition[] {
    let list = [...this.cards];
    const endingSoonDays = 14;
    const bigRewardMin = 500_000;
    const popularMin = 320;

    switch (this.activeFilter) {
      case 'ending':
        list = list.filter((c) => {
          const d = this.daysLeft(c.endDateIso);
          return d > 0 && d <= endingSoonDays;
        });
        break;
      case 'popular':
        list = list.filter((c) => c.participants >= popularMin || !!c.popularBadge);
        break;
      case 'rewards':
        list = list.filter((c) => c.rewardValueVnd >= bigRewardMin);
        break;
      case 'joined':
        list = list.filter((c) => this.userState.isJoined(c.id));
        break;
      default:
        break;
    }

    const endMs = (iso: string) => this.parseEndDate(iso).getTime();

    switch (this.sortBy) {
      case 'newest':
        list.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'popular':
        list.sort((a, b) => b.participants - a.participants);
        break;
      case 'ending':
        list.sort((a, b) => endMs(a.endDateIso) - endMs(b.endDateIso));
        break;
    }

    return list;
  }

  daysLeft(endDateIso: string): number {
    const end = this.parseEndDate(endDateIso);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - start.getTime()) / 86400000);
  }

  deadlineLabel(endDateIso: string): string {
    const d = this.daysLeft(endDateIso);
    if (d < 0) return '⏳ Đã kết thúc';
    if (d === 0) return '⏳ Hôm nay là hạn chót';
    return `⏳ Còn ${d} ngày`;
  }

  showEndingSoonBadge(c: ChallengeDefinition): boolean {
    const d = this.daysLeft(c.endDateIso);
    return d > 0 && d <= 7;
  }

  showPopularBadge(c: ChallengeDefinition): boolean {
    return !!c.popularBadge || c.participants >= 400;
  }

  showHotBadge(c: ChallengeDefinition): boolean {
    return !!c.hot || c.badge === 'Hot';
  }

  private parseEndDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
}
