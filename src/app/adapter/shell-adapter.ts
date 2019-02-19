import { ExecaStatic } from 'execa';
import { toError } from 'fp-ts/lib/Either';
import { taskEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { ShellPort } from '../../core/port/shell-port';

export class ExecaShellAdapter implements ShellPort {
  public constructor(private readonly execa: ExecaStatic, private readonly env: NodeJS.ProcessEnv) {}

  public runCommand(cmd: string, env: Record<string, string> = {}) {
    return tryCatch(() => this.execa.shell(cmd, { env: { ...this.env, ...env } }), toError).map((): void => undefined);
  }
}

export class EmptyShellAdapter implements ShellPort {
  public runCommand() {
    return taskEither.of<Error, void>(undefined);
  }
}
