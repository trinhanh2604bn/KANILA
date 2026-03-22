import { Component, inject, input, output } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { AuthService } from '../../../core/services/auth.service';
import { MENU_CONFIG } from '../../../core/config/menu.config';
import { GlobalSearchComponent } from './global-search/global-search.component';
import { NotificationBellComponent } from './notification-bell/notification-bell.component';
import { PresenceAvatarsComponent } from '../../../shared/components/presence-avatars/presence-avatars.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [GlobalSearchComponent, NotificationBellComponent, PresenceAvatarsComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  collapsed = input(false);
  toggleCollapse = output<void>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly currentUser = inject(CurrentUserService);

  pageTitle = 'Dashboard';
  breadcrumbs: string[] = [];

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateBreadcrumb((event as NavigationEnd).urlAfterRedirects);
      });
  }

  private updateBreadcrumb(url: string): void {
    const path = url.split('?')[0].replace(/^\//, '');
    const segments = path.split('/').filter(Boolean);

    // Find menu item label for this route
    for (const group of MENU_CONFIG) {
      for (const item of group.items) {
        const itemPath = item.route.replace(/^\//, '');
        if (itemPath === segments[0]) {
          this.pageTitle = item.label;
          this.breadcrumbs = group.group ? [group.group, item.label] : [item.label];
          return;
        }
      }
    }

    this.pageTitle = segments[0]
      ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
      : 'Dashboard';
    this.breadcrumbs = [this.pageTitle];
  }

  logout(): void {
    this.auth.logout();
  }
}
