import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container card overflow-hidden">
      <table [class]="'table ' + class">
        <thead>
          <tr>
            <th *ngFor="let col of columns" 
                [style.width]="col.width" 
                [class.sortable]="col.sortable"
                (click)="onSort(col)">
              <div class="th-content">
                {{ col.label }}
                <span *ngIf="col.sortable" class="sort-icon">
                  <ng-container *ngIf="sortColumn !== (col.key || col.label)">↕</ng-container>
                  <ng-container *ngIf="sortColumn === (col.key || col.label)">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </ng-container>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <ng-content></ng-content>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .overflow-hidden { overflow: hidden; }
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { background-color: var(--color-gray-50); }
    .th-content { display: flex; align-items: center; justify-content: space-between; }
    .sort-icon { font-size: 12px; margin-left: 4px; color: var(--color-gray-500); }
  `]
})
export class TableComponent {
  @Input() columns: { label: string, key?: string, width?: string, sortable?: boolean }[] = [];
  @Input() class = '';
  
  @Output() sortChange = new EventEmitter<{ column: string, direction: 'asc' | 'desc' }>();

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  onSort(col: any) {
    if (!col.sortable) return;
    const key = col.key || col.label;
    
    if (this.sortColumn === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = key;
      this.sortDirection = 'asc';
    }
    
    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
  }
}
