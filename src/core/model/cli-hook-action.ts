import { TaskEither } from 'fp-ts/lib/TaskEither';
import { Version } from './version';

export class CLIHookAction {
  public constructor(
    private readonly command: string,
    private readonly runner: CommandRunner,
    private readonly versionPrefix: string,
  ) {}

  public inspect() {
    return this.command;
  }

  public build(next: Version, prev: Version) {
    return this.runner.run(this.command, {
      NEXT_VERSION: next.toString({ versionPrefix: this.versionPrefix }),
      PREV_VERSION: prev.toString({ versionPrefix: this.versionPrefix }),
    });
  }
}

export interface CommandRunner {
  run(cmd: string, env: Record<string, string>): TaskEither<Error, void>;
}
