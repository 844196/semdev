import { spawn } from 'child_process';
import { toError } from 'fp-ts/lib/Either';
import { tryCatch } from 'fp-ts/lib/TaskEither';
import { CommandRunner } from '../../core/model/cli-hook-action';

export const runner: CommandRunner = {
  run: (cmd: string, env: Record<string, string> = {}) =>
    tryCatch<Error, void>(
      () =>
        new Promise((ok, ng) => {
          const p = spawn(cmd, { shell: true, env: { ...process.env, ...env } });
          p.on('close', (code) => (code === 0 ? ok() : ng(`command failed: ${cmd}`)));
        }),
      toError,
    ),
};
