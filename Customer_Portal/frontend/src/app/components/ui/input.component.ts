import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div [class]="'form-group ' + class">
      <label *ngIf="label" [for]="id">{{ label }}</label>
      <input
        [id]="id"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [name]="name"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
        class="form-input"
      />
      <p *ngIf="error" class="text-error text-xs mt-1">{{ error }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .text-error { color: var(--color-error); }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .mt-1 { margin-top: 0.25rem; }
  `]
})
export class InputComponent {
  @Input() id = '';
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() name = '';
  @Input() value: any = '';
  @Input() error = '';
  @Input() class = '';

  @Output() valueChange = new EventEmitter<any>();

  onValueChange(val: any): void {
    this.value = val;
    this.valueChange.emit(val);
  }
}
