import { taskEither } from 'fp-ts/lib/TaskEither';
import { CLIHookAction } from './cli-hook-action';
import { Version } from './version';

describe('CLIHookAction', () => {
  it('inspect()', () => {
    const command = 'yarn build';
    const subject = new CLIHookAction(command, jest.fn()(), 'v');

    expect(subject.inspect()).toBe(command);
  });

  it('build()', () => {
    const command = 'git diff ${PREV_VERSION}..${NEXT_VERSION}';
    const expectedTaskEither = taskEither.of(undefined);
    const commandRunner = jest.fn(() => ({ run: jest.fn(() => expectedTaskEither) }))();
    const versionPrefix = 'v';
    const subject = new CLIHookAction(command, commandRunner, versionPrefix);

    const rtn = subject.build(Version.released(1, 1, 0), Version.released(1, 0, 0));

    expect(rtn).toBe(expectedTaskEither);
    expect(commandRunner.run).toHaveBeenCalledWith(command, {
      NEXT_VERSION: 'v1.1.0',
      PREV_VERSION: 'v1.0.0',
    });
  });
});
