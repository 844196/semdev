import { ExecaStatic } from 'execa';
import { toError } from 'fp-ts/lib/Either';
import { tryCatch } from 'fp-ts/lib/TaskEither';
import { CommandRunner } from '../../core/model/cli-hook-action';

export class ExecaCommandRunner implements CommandRunner {
  public constructor(private readonly inner: ExecaStatic, private readonly env: NodeJS.ProcessEnv) {}

  public run(cmd: string, env: Record<string, string> = {}) {
    return tryCatch(() => this.inner.shell(cmd, { env: { ...this.env, ...env } }), toError).map((): void => undefined);
  }
}
