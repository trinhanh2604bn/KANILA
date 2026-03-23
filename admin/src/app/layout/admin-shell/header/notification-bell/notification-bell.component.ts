import { Component, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { NotificationsApiService } from '../../../../features/notifications/services/notifications-api.service';
import { AppNotification } from '../../../../features/notifications/models/notification.model';
import { filter } from 'rxjs';

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
  disablePanelClicks = signal(false);

  private isProductFormRoute(url: string): boolean {
    const path = (url || '').split('?')[0];
    // Be tolerant to base paths (e.g. '/admin/products/create')
    return (
      path.endsWith('/products/create') ||
      /^.*\/products\/[^\/]+\/edit$/.test(path)
    );
  }

  ngOnInit() {
    this.api.getAll().subscribe({
      next: (data) => { this.notifications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });

    // On product create/edit screens, avoid the dropdown intercepting the "Save Product" click.
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      const url = e.urlAfterRedirects ?? e.url;
      const isForm = this.isProductFormRoute(url);
      this.disablePanelClicks.set(isForm);
      if (isForm) this.isOpen.set(false); // visually remove the overlay
    });

    // Also set initial state for the current page.
    const initialUrl = this.router.url ?? '';
    const isForm = this.isProductFormRoute(initialUrl);
    this.disablePanelClicks.set(isForm);
    if (isForm) this.isOpen.set(false);
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
