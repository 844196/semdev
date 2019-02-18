import { right } from 'fp-ts/lib/Either';
import { io } from 'fp-ts/lib/IO';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../../core/model/release-branch';
import { ReleasedVersion, WipVersion } from '../../core/model/version';
import { encode } from '../config';
import { CommandRunner } from '../shim/command-runner';
import { Git } from '../shim/git';
import { Logger } from '../shim/logger';
import { ReleaseVersionAdapter } from './release-version-adapter';

const config = encode({
  masterBranch: 'master',
  versionPrefix: 'v',
  releaseBranchPrefix: 'release/',
  hooks: {
    release: {
      pre: ['pwd', 'ls'],
    },
  },
});
let git: jest.Mocked<Git>;
let logger: Logger;
let commandRunner: jest.Mocked<CommandRunner>;
let adapter: ReleaseVersionAdapter;

beforeEach(() => {
  git = jest.fn(
    (): Pick<Git, 'checkout' | 'merge' | 'tags' | 'createTag' | 'localBranches'> => {
      return {
        createTag: jest.fn(() => fromEither(right(undefined))),
        tags: jest.fn(),
        checkout: jest.fn(() => fromEither(right(undefined))),
        merge: jest.fn(() => fromEither(right(undefined))),
        localBranches: jest.fn(),
      };
    },
  )();
  logger = jest.fn(
    (): Logger => {
      return {
        log: jest.fn(() => io.of<void>(undefined)),
        logInteractive: jest.fn(() => io.of<void>(undefined)),
      };
    },
  )();
  commandRunner = jest.fn(
    (): CommandRunner => {
      return {
        run: jest.fn(() => fromEither(right(undefined))),
      };
    },
  )();
  adapter = new ReleaseVersionAdapter(config, git, logger, commandRunner);
});

describe('ReleaseVersionAdapter', () => {
  describe('notify', () => {
    it('merged()', async () => {
      await adapter.notify.merged(ReleaseBranch.of(WipVersion.of(1, 2, 3)));
      expect(logger.log).toBeCalledWith('success', 'merged: release/v1.2.3');
    });

    it('tagged()', async () => {
      await adapter.notify.tagged(WipVersion.of(1, 2, 3));
      expect(logger.log).toBeCalledWith('success', 'tag created: v1.2.3');
    });
  });

  describe('ensureReleasable()', () => {
    it('releasable', async () => {
      const version = WipVersion.of(1, 0, 1);

      git.tags.mockReturnValue(fromEither(right(new Set(['v1.0.0']))));
      git.localBranches.mockReturnValue(fromEither(right(new Set(['release/v1.0.1', 'release/v1.1.0']))));

      const rtn = await adapter.ensureReleasable(version).run();
      expect(rtn.isRight()).toBeTruthy();
    });

    it('already released', async () => {
      const version = WipVersion.of(1, 0, 1);

      git.tags.mockReturnValue(fromEither(right(new Set(['v1.0.0', 'v1.0.1']))));
      git.localBranches.mockReturnValue(fromEither(right(new Set(['release/v1.1.0']))));

      const rtn = await adapter.ensureReleasable(version).run();
      expect(rtn.value).toEqual(new Error('v1.0.1 already released'));
    });

    it('release branch does not exists', async () => {
      const version = WipVersion.of(1, 0, 1);

      git.tags.mockReturnValue(fromEither(right(new Set(['v1.0.0']))));
      git.localBranches.mockReturnValue(fromEither(right(new Set(['release/v1.1.0']))));

      const rtn = await adapter.ensureReleasable(version).run();
      expect(rtn.value).toEqual(new Error("release branch 'release/v1.0.1' does not exists"));
    });
  });

  it('mergeBranch()', async () => {
    const branch = ReleaseBranch.of(WipVersion.of(1, 0, 0));

    await adapter.mergeBranch(branch).run();

    expect(git.checkout).toHaveBeenCalledWith('master');
    expect(git.merge).toHaveBeenCalledWith('release/v1.0.0', '--no-ff');
  });

  it('createTag()', async () => {
    const version = WipVersion.of(1, 0, 0);

    await adapter.createTag(version).run();
    expect(git.checkout).toHaveBeenCalledWith('master');
    expect(git.createTag).toHaveBeenCalledWith('v1.0.0');
  });

  it('runHooks()', async () => {
    const next = WipVersion.of(1, 0, 1);
    const prev = ReleasedVersion.of(1, 0, 0);
    const expectedEnv = {
      NEXT_VERSION: 'v1.0.1',
      PREV_VERSION: 'v1.0.0',
    };

    await adapter.runHooks('pre', next, prev).run();
    expect(commandRunner.run).toHaveBeenCalledWith('pwd', expectedEnv);
    expect(commandRunner.run).toHaveBeenCalledWith('ls', expectedEnv);
  });
});
