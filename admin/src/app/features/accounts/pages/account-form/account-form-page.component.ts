import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccountsApiService } from '../../services/accounts-api.service';
import { RolesApiService } from '../../../roles/services/roles-api.service';
import { Role } from '../../../roles/models/role.model';

@Component({
  selector: 'app-account-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account-form-page.component.html',
  styleUrl: './account-form-page.component.css',
})
export class AccountFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AccountsApiService);
  private readonly rolesApi = inject(RolesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  accountId = '';
  roles = signal<Role[]>([]);
  successMessage = signal('');

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: [''],
    account_type: ['staff' as 'admin' | 'staff', Validators.required],
    roleId: [''],
    account_status: ['active' as 'active' | 'inactive', Validators.required],
  });

  ngOnInit(): void {
    this.rolesApi.getAll().subscribe((r) => this.roles.set(r));

    this.accountId = this.route.snapshot.params['id'];
    if (this.accountId) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();

      this.api.getById(this.accountId).subscribe((account) => {
        this.form.patchValue({
          username: account.username,
          email: account.email,
          phone: account.phone,
          account_type: account.account_type as 'admin' | 'staff',
          roleId: account.roleId || '',
          account_status: account.account_status as 'active' | 'inactive',
        });
        this.loading.set(false);
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.successMessage.set('');
    const data = this.form.getRawValue();

    if (this.isEdit()) {
      this.api.update(this.accountId, {
        username: data.username,
        phone: data.phone,
        account_type: data.account_type,
        roleId: data.roleId,
        account_status: data.account_status,
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.successMessage.set('Account updated successfully');
          setTimeout(() => this.router.navigate(['/accounts']), 1200);
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.api.create({
        email: data.email,
        username: data.username,
        password: data.password,
        phone: data.phone,
        account_type: data.account_type,
        roleId: data.roleId,
        account_status: data.account_status,
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.successMessage.set('Account created successfully');
          setTimeout(() => this.router.navigate(['/accounts']), 1200);
        },
        error: () => this.saving.set(false),
      });
    }
  }
}
