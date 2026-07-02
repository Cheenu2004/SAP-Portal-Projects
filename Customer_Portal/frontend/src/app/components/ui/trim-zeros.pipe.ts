import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trimZeros',
  standalone: true
})
export class TrimZerosPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value == null) return '';
    const str = value.toString();
    const trimmed = str.replace(/^0+/, '');
    return trimmed === '' ? '0' : trimmed;
  }
}
