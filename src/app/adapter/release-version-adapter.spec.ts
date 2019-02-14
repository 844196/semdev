import { right } from 'fp-ts/lib/Either';
import { IO } from 'fp-ts/lib/IO';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { CLIHookAction } from '../../core/model/cli-hook-action';
import { ReleaseBranch } from '../../core/model/release-branch';
import { Version } from '../../core/model/version';
import { encode } from '../config';
import { Git } from '../shim/git';
import { Logger } from '../shim/logger';
import { ReleaseVersionAdapter } from './release-version-adapter';

const config = encode({
  masterBranch: 'master',
  versionPrefix: 'v',
  releaseBranchPrefix: 'release/',
  hooks: {
    release: {
      pre: ['pwd'],
      post: ['ls'],
    },
  },
});
let git: jest.Mocked<Git>;
let logger: jest.Mocked<Logger>;
let adapter: ReleaseVersionAdapter;

beforeEach(() => {
  git = jest.fn(
    (): Pick<Git, 'checkout' | 'merge' | 'tags' | 'createTag'> => {
      return {
        createTag: jest.fn(() => fromEither(right(undefined))),
        tags: jest.fn(),
        checkout: jest.fn(() => fromEither(right(undefined))),
        merge: jest.fn(() => fromEither(right(undefined))),
      };
    },
  )();
  logger = jest.fn((): Logger => ({ log: jest.fn(() => new IO(() => undefined)) }))();
  adapter = new ReleaseVersionAdapter(config, git, logger);
});

describe('ReleaseVersionAdapter', () => {
  describe('notify', () => {
    it('merged()', async () => {
      await adapter.notify.merged(ReleaseBranch.of(Version.wip(1, 2, 3)));
      expect(logger.log).toBeCalledWith('success', 'merged: release/v1.2.3');
    });

    it('tagged()', async () => {
      await adapter.notify.tagged(Version.wip(1, 2, 3));
      expect(logger.log).toBeCalledWith('success', 'tag created: v1.2.3');
    });

    it('runHook()', async () => {
      await adapter.notify.runHook(jest.fn<CLIHookAction>(() => ({ inspect: () => 'pwd' }))());
      expect(logger.log).toBeCalledWith('start', 'run: pwd');
    });
  });

  describe('hooks', () => {
    it('pre', () => {
      expect(adapter.hooks.pre[0].inspect()).toBe('pwd');
    });

    it('post', () => {
      expect(adapter.hooks.post[0].inspect()).toBe('ls');
    });
  });

  it('mergeBranch()', async () => {
    const branch = ReleaseBranch.of(Version.wip(1, 0, 0));

    await adapter.mergeBranch(branch).run();

    expect(git.checkout).toHaveBeenCalledWith('master');
    expect(git.merge).toHaveBeenCalledWith('release/v1.0.0', '--no-ff');
  });

  it('createTag()', async () => {
    const version = Version.wip(1, 0, 0);

    await adapter.createTag(version).run();
    expect(git.checkout).toHaveBeenCalledWith('master');
    expect(git.createTag).toHaveBeenCalledWith('v1.0.0');
  });
});
