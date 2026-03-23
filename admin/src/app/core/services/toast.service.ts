import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  undoAction?: () => void;
  timeoutId?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(type: ToastType, message: string, title?: string, undoAction?: () => void) {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Auto-dismiss after 5s if undo, otherwise 3.5s
    const duration = undoAction ? 6000 : 3500;
    const timeoutId = setTimeout(() => this.remove(id), duration);

    this.toasts.update(current => {
      const updated = [...current, { id, type, message, title, undoAction, timeoutId }];
      if (updated.length > 3) {
        const removed = updated.shift();
        if (removed?.timeoutId) clearTimeout(removed.timeoutId);
      }
      return updated;
    });
  }

  success(message: string, title?: string, undoAction?: () => void) {
    this.show('success', message, title, undoAction);
  }

  error(message: string, title?: string, undoAction?: () => void) {
    this.show('error', message, title, undoAction);
  }

  info(message: string, title?: string, undoAction?: () => void) {
    this.show('info', message, title, undoAction);
  }

  triggerUndo(id: string) {
    const toast = this.toasts().find(t => t.id === id);
    if (toast && toast.undoAction) {
      toast.undoAction();
      this.remove(id);
    }
  }

  remove(id: string) {
    this.toasts.update(current => {
      const t = current.find(x => x.id === id);
      if (t?.timeoutId) clearTimeout(t.timeoutId);
      return current.filter(x => x.id !== id);
    });
  }
}
