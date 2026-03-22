import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AccountsApiService } from '../../services/accounts-api.service';
import { Account } from '../../models/account.model';

@Component({
  selector: 'app-account-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './account-detail-page.component.html',
  styleUrl: './account-detail-page.component.css',
})
export class AccountDetailPageComponent implements OnInit {
  private readonly api = inject(AccountsApiService);
  private readonly route = inject(ActivatedRoute);

  account = signal<Account | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.api.getById(id).subscribe({
      next: (data) => {
        this.account.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
