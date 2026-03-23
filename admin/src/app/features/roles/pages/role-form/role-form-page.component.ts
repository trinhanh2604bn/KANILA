import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RolesApiService } from '../../services/roles-api.service';
import { PERMISSION_GROUPS, PermissionGroup } from '../../models/role.model';

@Component({
  selector: 'app-role-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './role-form-page.component.html',
  styleUrl: './role-form-page.component.css',
})
export class RoleFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RolesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  successMessage = signal('');
  roleId = '';

  permissionGroups: PermissionGroup[] = PERMISSION_GROUPS;
  selectedPermissions = signal<Set<string>>(new Set());

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.roleId = this.route.snapshot.params['id'];
    if (this.roleId) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.api.getById(this.roleId).subscribe((role) => {
        this.form.patchValue({ name: role.name, description: role.description });
        this.selectedPermissions.set(new Set(role.permissions));
        this.loading.set(false);
      });
    }
  }

  togglePermission(key: string): void {
    this.selectedPermissions.update((set) => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  isSelected(key: string): boolean {
    return this.selectedPermissions().has(key);
  }

  toggleGroup(group: PermissionGroup): void {
    const keys = group.permissions.map((p) => p.key);
    const allSelected = keys.every((k) => this.selectedPermissions().has(k));
    this.selectedPermissions.update((set) => {
      const next = new Set(set);
      keys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  }

  isGroupFullySelected(group: PermissionGroup): boolean {
    return group.permissions.every((p) => this.selectedPermissions().has(p.key));
  }

  isGroupPartiallySelected(group: PermissionGroup): boolean {
    const selected = group.permissions.filter((p) => this.selectedPermissions().has(p.key));
    return selected.length > 0 && selected.length < group.permissions.length;
  }

  selectAll(): void {
    const all = new Set<string>();
    this.permissionGroups.forEach((g) => g.permissions.forEach((p) => all.add(p.key)));
    this.selectedPermissions.set(all);
  }

  deselectAll(): void {
    this.selectedPermissions.set(new Set());
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.successMessage.set('');
    const { name, description } = this.form.getRawValue();
    const permissions = [...this.selectedPermissions()];

    const obs = this.isEdit()
      ? this.api.update(this.roleId, { name, description, permissions })
      : this.api.create({ name, description, permissions });

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set(this.isEdit() ? 'Role updated successfully' : 'Role created successfully');
        setTimeout(() => this.router.navigate(['/roles']), 1200);
      },
      error: () => this.saving.set(false),
    });
  }
}
