import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly loadingSignal = signal(false);

  readonly isLoading = this.loadingSignal.asReadonly();

  show(): void {
    this.loadingSignal.set(true);
  }

  hide(): void {
    this.loadingSignal.set(false);
  }
}
