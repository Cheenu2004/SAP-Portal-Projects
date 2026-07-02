import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    :host { display: inline-block; }
  `]
})
export class BadgeComponent {
  @Input() variant: 'success' | 'warning' | 'error' | 'info' | 'outline' = 'info';
  @Input() class = '';

  get badgeClasses(): string {
    return `badge badge-${this.variant} ${this.class}`.trim();
  }
}
