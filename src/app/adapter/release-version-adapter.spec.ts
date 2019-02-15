import { right } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../../core/model/release-branch';
import { Version } from '../../core/model/version';
import { encode } from '../config';
import { CommandRunner } from '../shim/command-runner';
import { Git } from '../shim/git';
import { EmptyLogger, Logger } from '../shim/logger';
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
let logger: Logger;
let commandRunner: jest.Mocked<CommandRunner>;
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
  logger = new EmptyLogger();
  jest.spyOn(logger, 'log');
  commandRunner = jest.fn()();
  adapter = new ReleaseVersionAdapter(config, git, logger, commandRunner);
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
