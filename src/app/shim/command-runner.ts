import { ExecaStatic } from 'execa';
import { toError } from 'fp-ts/lib/Either';
import { taskEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { FunctionKeys } from 'utility-types';

export class ExecaCommandRunner {
  public constructor(private readonly inner: ExecaStatic, private readonly env: NodeJS.ProcessEnv) {}

  public run(cmd: string, env: Record<string, string> = {}) {
    return tryCatch(() => this.inner.shell(cmd, { env: { ...this.env, ...env } }), toError).map((): void => undefined);
  }
}

export type CommandRunner = { [P in FunctionKeys<ExecaCommandRunner>]: ExecaCommandRunner[P] };

export class EmptyCommandRunner implements CommandRunner {
  public run() {
    return taskEither.of<Error, void>(undefined);
  }
}
