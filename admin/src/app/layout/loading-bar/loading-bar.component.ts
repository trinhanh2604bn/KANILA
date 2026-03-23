import { Component, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  template: `
    @if (loading.isLoading()) {
      <div class="loading-bar">
        <div class="loading-bar-track"></div>
      </div>
    }
  `,
  styles: `
    .loading-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 9999;
      overflow: hidden;
      background: var(--primary-light);
    }
    .loading-bar-track {
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, var(--primary), var(--primary-hover));
      border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
      animation: loading-slide 1.2s ease-in-out infinite;
    }
    @keyframes loading-slide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }
  `,
})
export class LoadingBarComponent {
  readonly loading = inject(LoadingService);
}
