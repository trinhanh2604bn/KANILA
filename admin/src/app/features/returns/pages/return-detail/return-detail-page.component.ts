import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReturnsApiService } from '../../services/returns-api.service';
import { ReturnRequest, ReturnStatus } from '../../models/return.model';

@Component({
  selector: 'app-return-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './return-detail-page.component.html',
  styleUrl: './return-detail-page.component.css',
})
export class ReturnDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ReturnsApiService);

  request = signal<ReturnRequest | null>(null);
  loading = signal(true);
  isProcessing = signal(false);

  activeActionContext = signal<'approve' | 'reject' | null>(null);
  actionError = signal('');
  actionSuccess = signal('');

  /** Aligns with backend returnStatus (received = warehouse processing) */
  workflowSteps = ['requested', 'approved', 'received', 'completed'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getReturn(id).subscribe({
        next: (data) => {
          this.request.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  /** Strictly before current (for checkmarks on past steps) */
  isStepPast(step: string, currentStatus: string): boolean {
    if (currentStatus === 'rejected') return false;
    const ci = this.workflowSteps.indexOf(currentStatus);
    const si = this.workflowSteps.indexOf(step);
    if (ci === -1 || si === -1) return false;
    return si < ci;
  }

  showStepCheck(step: string, currentStatus: string): boolean {
    if (currentStatus === 'rejected') return false;
    return (
      this.isStepPast(step, currentStatus) ||
      (step === 'completed' && currentStatus === 'completed')
    );
  }

  /** Connector after step at index `beforeIndex` is highlighted when we've moved past that step */
  isConnectorFilled(beforeIndex: number, currentStatus: string): boolean {
    if (currentStatus === 'rejected') return false;
    const currentIndex = this.workflowSteps.indexOf(currentStatus);
    if (currentIndex === -1) return false;
    return currentIndex > beforeIndex;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
      price
    );
  }

  get returnTotal() {
    const r = this.request();
    if (!r) return 0;
    return r.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  customerInitial(name: string): string {
    const t = (name ?? '').trim();
    if (!t || t === '—') return '?';
    return t.charAt(0).toUpperCase();
  }

  displayReturnRef(r: ReturnRequest): string {
    if (r.returnNumber?.trim()) return r.returnNumber;
    const id = r.id;
    if (id && id.length > 10) return `#${id.slice(-8).toUpperCase()}`;
    return id || '—';
  }

  statusLabel(status: ReturnStatus): string {
    const map: Record<ReturnStatus, string> = {
      requested: 'Pending action',
      approved: 'Approved',
      received: 'Processing',
      completed: 'Completed',
      rejected: 'Rejected',
    };
    return map[status] ?? status;
  }

  formatReasonDisplay(reason: string): string {
    if (reason == null || reason === '' || reason === '—') return '—';
    return reason.replace(/_/g, ' ').trim();
  }

  stepLabel(step: string): string {
    if (step === 'received') return 'Processing';
    return step.charAt(0).toUpperCase() + step.slice(1);
  }

  startAction(action: 'approve' | 'reject') {
    this.activeActionContext.set(action);
    this.actionError.set('');
  }

  cancelAction() {
    this.activeActionContext.set(null);
  }

  confirmAction() {
    const r = this.request();
    const action = this.activeActionContext();
    if (!r || !action) return;

    this.isProcessing.set(true);
    const updatedStatus: ReturnStatus = action === 'approve' ? 'approved' : 'rejected';

    this.api.updateReturnStatus(r.id, updatedStatus).subscribe({
      next: (updated) => {
        this.request.set(updated);
        this.isProcessing.set(false);
        this.activeActionContext.set(null);
        this.actionSuccess.set(`Return request ${updatedStatus} successfully.`);
        setTimeout(() => this.actionSuccess.set(''), 3000);
      },
      error: () => {
        this.isProcessing.set(false);
        this.actionError.set('An error occurred while updating the status. Please try again.');
      },
    });
  }

  fastForward(status: 'received' | 'completed') {
    const r = this.request();
    if (!r) return;
    this.isProcessing.set(true);
    this.api.updateReturnStatus(r.id, status).subscribe({
      next: (updated) => {
        this.request.set(updated);
        this.isProcessing.set(false);
        const label = status === 'received' ? 'processing' : 'completed';
        this.actionSuccess.set(`Return moved to ${label}.`);
        setTimeout(() => this.actionSuccess.set(''), 3000);
      },
      error: () => {
        this.isProcessing.set(false);
        this.actionError.set('Status update failed.');
        setTimeout(() => this.actionError.set(''), 3000);
      },
    });
  }
}
