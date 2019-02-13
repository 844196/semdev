import { IO } from 'fp-ts/lib/IO';
import { default as signale } from 'signale';

export interface Logger {
  info(x: any): IO<void>;
  success(x: any): IO<void>;
  error(x: any): IO<void>;
}

export class SignaleLogger implements Logger {
  public constructor(private readonly inner: typeof signale) {}

  public info(x: any) {
    return new IO(() => this.inner.info(x));
  }

  public success(x: any) {
    return new IO(() => this.inner.success(x));
  }

  public error(x: any) {
    return new IO(() => this.inner.error(x));
  }
}
