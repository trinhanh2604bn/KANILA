import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Comment {
  id: string;
  user: string;
  userColor: string;
  text: string;
  timestamp: string;
  replies?: Comment[];
}

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-thread.component.html',
  styleUrl: './comment-thread.component.css'
})
export class CommentThreadComponent {
  @Input() entityType = 'item';

  comments = signal<Comment[]>([
    {
      id: 'c1', user: 'Sarah Chen', userColor: '#3b82f6', text: 'Customer requested priority shipping for this order. Please expedite.', timestamp: '2026-03-21T18:20:00Z',
      replies: [
        { id: 'c1r1', user: 'Minh Tran', userColor: '#8b5cf6', text: 'Got it, will process today. @Admin please confirm stock.', timestamp: '2026-03-21T18:35:00Z' },
      ]
    },
    { id: 'c2', user: 'Admin', userColor: '#d4708f', text: 'Stock confirmed. Ready to ship.', timestamp: '2026-03-21T18:50:00Z', replies: [] },
  ]);

  newComment = signal('');
  replyingTo = signal<string | null>(null);
  replyText = signal('');

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  highlightMentions(text: string): string {
    return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  }

  addComment() {
    const text = this.newComment().trim();
    if (!text) return;
    this.comments.update(list => [...list, {
      id: 'c' + Date.now(), user: 'You', userColor: '#d4708f', text, timestamp: new Date().toISOString(), replies: []
    }]);
    this.newComment.set('');
  }

  startReply(commentId: string) { this.replyingTo.set(commentId); this.replyText.set(''); }
  cancelReply() { this.replyingTo.set(null); }

  addReply(parentId: string) {
    const text = this.replyText().trim();
    if (!text) return;
    this.comments.update(list => list.map(c =>
      c.id === parentId ? { ...c, replies: [...(c.replies || []), { id: 'r' + Date.now(), user: 'You', userColor: '#d4708f', text, timestamp: new Date().toISOString() }] } : c
    ));
    this.replyingTo.set(null);
  }
}
