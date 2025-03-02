import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-signed-out',
  standalone: true,
  template: `<p>Signed Out</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignedOutPage {}