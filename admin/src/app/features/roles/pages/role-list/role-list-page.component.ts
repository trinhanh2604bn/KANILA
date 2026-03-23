import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { RolesApiService } from '../../services/roles-api.service';
import { Role } from '../../models/role.model';

@Component({
  selector: 'app-role-list-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './role-list-page.component.html',
  styleUrl: './role-list-page.component.css',
})
export class RoleListPageComponent implements OnInit {
  private readonly api = inject(RolesApiService);

  roles = signal<Role[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.api.getAll().subscribe((data) => {
      this.roles.set(data);
      this.loading.set(false);
    });
  }
}
