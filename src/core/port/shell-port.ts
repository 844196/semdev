import { TaskEither } from 'fp-ts/lib/TaskEither';

export interface ShellPort {
  runCommand(command: string, env?: Record<string, string>): TaskEither<Error, void>;
}
