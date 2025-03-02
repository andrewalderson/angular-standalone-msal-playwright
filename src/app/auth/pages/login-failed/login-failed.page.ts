import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login-failed',
  standalone: true,
  template: `<p>Login Failed</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFailedPage {}