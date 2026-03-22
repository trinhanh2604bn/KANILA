import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsApiService } from '../../services/accounts-api.service';
import { RolesApiService } from '../../../roles/services/roles-api.service';
import { Account } from '../../models/account.model';
import { Role } from '../../../roles/models/role.model';

@Component({
  selector: 'app-account-list-page',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './account-list-page.component.html',
  styleUrl: './account-list-page.component.css',
})
export class AccountListPageComponent implements OnInit {
  private readonly api = inject(AccountsApiService);
  private readonly rolesApi = inject(RolesApiService);

  accounts = signal<Account[]>([]);
  roles = signal<Role[]>([]);
  loading = signal(true);
  togglingId = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  roleFilter = signal('');
  statusFilter = signal('');

  filtered = computed(() => {
    let list = this.accounts();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(
        (a) => a.username.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
      );
    }
    if (this.roleFilter()) {
      list = list.filter((a) => a.roleId === this.roleFilter());
    }
    if (this.statusFilter()) {
      list = list.filter((a) => a.accountStatus === this.statusFilter());
    }
    return list;
  });

  hasActiveFilters = computed(
    () => !!this.searchQuery() || !!this.roleFilter() || !!this.statusFilter()
  );

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.api.getAll().subscribe((data) => {
      this.accounts.set(data);
      this.loading.set(false);
    });
    this.rolesApi.getAll().subscribe((roles) => this.roles.set(roles));
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  onRoleFilter(value: string): void {
    this.roleFilter.set(value);
  }

  onStatusFilter(value: string): void {
    this.statusFilter.set(value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('');
    this.statusFilter.set('');
  }

  toggleStatus(account: Account): void {
    this.togglingId.set(account.id);
    this.api.toggleStatus(account.id).subscribe({
      next: (updated) => {
        this.accounts.update((list) =>
          list.map((a) => (a.id === updated.id ? updated : a))
        );
        this.togglingId.set(null);
      },
      error: () => this.togglingId.set(null),
    });
  }
}
