import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly userSignal = signal<User | null>(null);

  readonly user = this.userSignal.asReadonly();

  setUser(user: User): void {
    this.userSignal.set(user);
  }

  clearUser(): void {
    this.userSignal.set(null);
  }

  get currentUser(): User | null {
    return this.userSignal();
  }
}
