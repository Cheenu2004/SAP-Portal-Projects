import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'card ' + class">
      <div *ngIf="title || subtitle" class="card-header border-b border-gray-100 p-6">
        <h3 *ngIf="title" class="text-lg font-semibold text-gray-900 leading-none tracking-tight">{{ title }}</h3>
        <p *ngIf="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
      </div>
      <div class="card-content p-6 pt-0 mt-6" [class.pt-6]="!title && !subtitle">
        <ng-content></ng-content>
      </div>
      <div *ngIf="hasFooter" class="card-footer p-6 pt-0 flex items-center">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card-header { padding-bottom: 0; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .font-semibold { font-weight: 600; }
    .text-gray-900 { color: var(--color-gray-900); }
    .text-gray-500 { color: var(--color-gray-500); }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-6 { margin-top: 1.5rem; }
    .p-6 { padding: 1.5rem; }
    .pt-0 { padding-top: 0; }
    .pt-6 { padding-top: 1.5rem; }
    .border-b { border-bottom-width: 1px; }
    .border-gray-100 { border-color: var(--color-gray-100); }
    .flex { display: flex; }
    .items-center { align-items: center; }
  `]
})
export class CardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() class = '';
  @Input() hasFooter = false;
}
