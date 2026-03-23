import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityFeedApiService } from '../../services/activity-feed-api.service';
import { ActivityItem } from '../../models/activity.model';

@Component({
  selector: 'app-activity-feed-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-feed-page.component.html',
  styleUrl: './activity-feed-page.component.css'
})
export class ActivityFeedPageComponent implements OnInit {
  private api = inject(ActivityFeedApiService);

  items = signal<ActivityItem[]>([]);
  loading = signal(true);
  filterUser = signal('');
  filterAction = signal('');

  ngOnInit() {
    this.api.getAll().subscribe({
      next: d => { this.items.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  get filteredItems() {
    let list = this.items();
    const u = this.filterUser().toLowerCase();
    const a = this.filterAction();
    if (u) list = list.filter(i => i.user.toLowerCase().includes(u));
    if (a) list = list.filter(i => i.actionType === a);
    return list;
  }

  getDateGroup(ts: string): string {
    const d = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    if (d >= today) return 'Today';
    if (d >= yesterday) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isNewGroup(index: number): boolean {
    if (index === 0) return true;
    const list = this.filteredItems;
    return this.getDateGroup(list[index].timestamp) !== this.getDateGroup(list[index - 1].timestamp);
  }

  getActionIcon(type: string): string {
    const map: Record<string, string> = { create: 'add_circle', update: 'edit', delete: 'delete', comment: 'chat_bubble', system: 'settings' };
    return map[type] || 'info';
  }

  getActionColor(type: string): string {
    const map: Record<string, string> = { create: '#22c55e', update: '#3b82f6', delete: '#ef4444', comment: '#8b5cf6', system: '#6b7280' };
    return map[type] || '#6b7280';
  }

  timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}
