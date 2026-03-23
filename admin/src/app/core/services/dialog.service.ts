import { Injectable, signal } from '@angular/core';

export interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  isOpen = signal(false);
  options = signal<DialogOptions | null>(null);
  
  private resolveFn: ((value: boolean) => void) | null = null;

  confirm(options: DialogOptions): Promise<boolean> {
    this.options.set({
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      isDestructive: false,
      ...options
    });
    this.isOpen.set(true);

    return new Promise((resolve) => {
      this.resolveFn = resolve;
    });
  }

  close(result: boolean) {
    this.isOpen.set(false);
    if (this.resolveFn) {
      this.resolveFn(result);
      this.resolveFn = null;
    }
    setTimeout(() => this.options.set(null), 300); // Wait for transition
  }
}
