import { IO } from 'fp-ts/lib/IO';
import { default as signale } from 'signale';

export interface Logger {
  log(x: any): IO<void>;
  note(x: any): IO<void>;
  info(x: any): IO<void>;
  start(x: any): IO<void>;
  complete(x: any): IO<void>;
  success(x: any): IO<void>;
  error(x: any): IO<void>;
}

export class SignaleLogger implements Logger {
  public constructor(private readonly inner: typeof signale) {}

  public log(x: any) {
    return new IO(() => this.inner.log(x));
  }

  public note(x: any) {
    return new IO(() => this.inner.note(x));
  }

  public info(x: any) {
    return new IO(() => this.inner.info(x));
  }

  public start(x: any) {
    return new IO(() => this.inner.start(x));
  }

  public complete(x: any) {
    return new IO(() => this.inner.complete(x));
  }

  public success(x: any) {
    return new IO(() => this.inner.success(x));
  }

  public error(x: any) {
    return new IO(() => this.inner.error(x));
  }
}
