import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly subject = new BehaviorSubject<ToastMessage | null>(null);
  readonly toast$ = this.subject.asObservable();
  private seq = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(text: string, type: ToastType = 'info', durationMs = 2200): void {
    const message: ToastMessage = { id: ++this.seq, text, type };
    this.subject.next(message);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.clear(), durationMs);
  }

  success(text: string): void {
    this.show(text, 'success');
  }

  warning(text: string): void {
    this.show(text, 'warning');
  }

  error(text: string): void {
    this.show(text, 'error', 2600);
  }

  clear(): void {
    this.subject.next(null);
  }
}
