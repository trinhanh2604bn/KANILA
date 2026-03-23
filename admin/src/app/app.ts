import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { LoadingService } from './core/services/loading.service';
import { LoadingBarComponent } from './layout/loading-bar/loading-bar.component';

import { ToastComponent } from './core/components/toast/toast.component';
import { ConfirmDialogComponent } from './core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingBarComponent, ToastComponent, ConfirmDialogComponent],
  template: `
    <app-loading-bar />
    <router-outlet />
    <app-toast />
    <app-confirm-dialog />
  `,
  styles: ':host { display: block; min-height: 100vh; }',
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly loading = inject(LoadingService);

  ngOnInit(): void {
    this.auth.restoreSession();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loading.show();
      }
      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.loading.hide();
      }
    });
  }
}
