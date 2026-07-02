import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="onClick($event)"
    >
      <span *ngIf="loading" class="spinner me-2" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host { display: inline-block; }
    .me-2 { margin-right: 0.5rem; }
  `]
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'outline' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() class = '';

  get buttonClasses(): string {
    const base = 'btn';
    const variantClass = `btn-${this.variant}`;
    const sizeClass = this.size !== 'md' ? `btn-${this.size}` : '';
    return `${base} ${variantClass} ${sizeClass} ${this.class}`.trim();
  }

  onClick(event: MouseEvent): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
