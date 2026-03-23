import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollaborationService } from '../../../core/services/collaboration/collaboration.service';

@Component({
  selector: 'app-presence-avatars',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presence-avatars.component.html',
  styleUrl: './presence-avatars.component.css'
})
export class PresenceAvatarsComponent {
  collab = inject(CollaborationService);
}
