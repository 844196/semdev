import { IO, io } from 'fp-ts/lib/IO';
import { default as signale, DefaultMethods } from 'signale';
import { FunctionKeys } from 'utility-types';

export class SignaleLogger {
  public constructor(private readonly inner: typeof signale) {}

  public log(type: DefaultMethods, value: any) {
    return new IO(() => this.inner[type](value));
  }
}

export class EmptyLogger implements Logger {
  public log() {
    return io.of<void>(undefined);
  }
}

export type Logger = { [P in FunctionKeys<SignaleLogger>]: SignaleLogger[P] };
