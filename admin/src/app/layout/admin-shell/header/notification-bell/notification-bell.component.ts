import { Component, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsApiService } from '../../../../features/notifications/services/notifications-api.service';
import { AppNotification } from '../../../../features/notifications/models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class NotificationBellComponent implements OnInit {
  api = inject(NotificationsApiService);
  private router = inject(Router);
  private elRef = inject(ElementRef);

  notifications = signal<AppNotification[]>([]);
  isOpen = signal(false);
  loading = signal(true);

  ngOnInit() {
    this.api.getAll().subscribe({
      next: (data) => { this.notifications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  toggle() {
    this.isOpen.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.isOpen.set(false); }

  markAsRead(n: AppNotification) {
    if (!n.read) {
      this.api.markAsRead(n.id).subscribe();
      n.read = true;
    }
    if (n.route) {
      this.router.navigate(n.route);
      this.isOpen.set(false);
    }
  }

  markAllRead() {
    this.api.markAllAsRead().subscribe();
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      order: '#3b82f6', payment: '#8b5cf6', stock: '#f59e0b', system: '#6b7280'
    };
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
}
