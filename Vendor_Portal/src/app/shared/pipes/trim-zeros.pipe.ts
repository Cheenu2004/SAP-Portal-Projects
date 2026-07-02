import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trimZeros',
  standalone: true
})
export class TrimZerosPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '';
    return value.replace(/^0+/, '') || '0';
  }
}
