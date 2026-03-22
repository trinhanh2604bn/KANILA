import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogApiService } from '../../services/audit-log-api.service';
import { AuditLogEntry } from '../../models/audit-log.model';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log-list-page.component.html',
  styleUrl: './audit-log-list-page.component.css'
})
export class AuditLogListPageComponent implements OnInit {
  private api = inject(AuditLogApiService);

  logs = signal<AuditLogEntry[]>([]);
  loading = signal(true);
  filterUser = signal('');
  filterAction = signal('');

  ngOnInit() {
    this.api.getAll().subscribe({
      next: (data) => { this.logs.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  get filteredLogs() {
    let list = this.logs();
    const u = this.filterUser().toLowerCase();
    const a = this.filterAction();
    if (u) list = list.filter(l => l.user.toLowerCase().includes(u));
    if (a) list = list.filter(l => l.actionType === a);
    return list;
  }

  getActionBadgeClass(type: string): string {
    const map: Record<string, string> = {
      create: 'badge-success', update: 'badge-info', delete: 'badge-danger', system: 'badge-muted'
    };
    return map[type] || 'badge-muted';
  }

  getActionIcon(type: string): string {
    const map: Record<string, string> = {
      create: 'add_circle', update: 'edit', delete: 'delete', system: 'settings'
    };
    return map[type] || 'info';
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
