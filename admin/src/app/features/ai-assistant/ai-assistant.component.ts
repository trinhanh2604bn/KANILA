import { Component, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  actions?: { label: string; route: string[] }[];
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.css'
})
export class AiAssistantComponent {
  private router = inject(Router);
  @ViewChild('chatBody') chatBody!: ElementRef;

  isOpen = signal(false);
  isTyping = signal(false);
  query = signal('');
  messages = signal<ChatMessage[]>([]);

  suggestedPrompts = [
    'What are the top products this week?',
    'Are there any low stock alerts?',
    'Summarize today\'s revenue',
    'Show recent failed payments'
  ];

  toggle() { this.isOpen.update(v => !v); }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') this.isOpen.set(false);
  }

  sendMessage(text?: string) {
    const msg = text || this.query().trim();
    if (!msg) return;
    
    this.messages.update(list => [...list, { role: 'user', content: msg }]);
    this.query.set('');
    this.isTyping.set(true);
    this.scrollToBottom();

    // Simulate AI response with context-aware mock data
    setTimeout(() => {
      const response = this.generateResponse(msg.toLowerCase());
      this.messages.update(list => [...list, response]);
      this.isTyping.set(false);
      this.scrollToBottom();
    }, 1200);
  }

  useSuggestion(prompt: string) {
    this.sendMessage(prompt);
  }

  navigateAction(route: string[]) {
    this.router.navigate(route);
    this.isOpen.set(false);
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatBody?.nativeElement) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    }, 50);
  }

  formatContent(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  private generateResponse(q: string): ChatMessage {
    if (q.includes('top product')) {
      return {
        role: 'ai',
        content: '📊 This week\'s top performers:\n\n1. **Hydrating Serum 30ml** — 420 sales (+12%)\n2. **Glow Moisturizer** — 310 sales (+8%)\n3. **Vitamin C Toner** — 285 sales (+3%)\n\nHydrating Serum continues to lead. Consider increasing stock.',
        actions: [{ label: 'View Products', route: ['/products'] }, { label: 'Check Inventory', route: ['/inventory'] }]
      };
    }
    if (q.includes('low stock') || q.includes('stock alert')) {
      return {
        role: 'ai',
        content: '⚠️ **2 products need attention:**\n\n• Cleanser 100ml — only **3 units** left\n• Retinol Serum — only **2 units** left\n\nRecommendation: Place a restock order immediately to avoid lost sales.',
        actions: [{ label: 'Open Inventory', route: ['/inventory'] }]
      };
    }
    if (q.includes('revenue') || q.includes('sales')) {
      return {
        role: 'ai',
        content: '💰 **Today\'s Revenue Summary:**\n\nTotal: **$4,520** across 38 orders.\nAvg order value: **$118.95**\n\nCompared to yesterday, revenue is up **+15.2%**. The afternoon peak (2-5 PM) contributed 42% of sales.',
        actions: [{ label: 'View Dashboard', route: ['/dashboard'] }, { label: 'View Orders', route: ['/orders'] }]
      };
    }
    if (q.includes('payment') || q.includes('failed')) {
      return {
        role: 'ai',
        content: '🔴 **1 failed payment detected today:**\n\n• ORD-9048 — Payment declined ($45.00)\n  Customer: john.doe@email.com\n\nSuggestion: Reach out to the customer or retry the payment.',
        actions: [{ label: 'View Payments', route: ['/payments'] }]
      };
    }
    return {
      role: 'ai',
      content: 'I\'m here to help you understand your store data. Try asking me about:\n\n• Top products\n• Low stock alerts\n• Revenue summaries\n• Payment issues',
    };
  }
}
