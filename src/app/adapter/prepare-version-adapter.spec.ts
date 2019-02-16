import { right } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../../core/model/release-branch';
import { WipVersion } from '../../core/model/version';
import { encode } from '../config';
import { Git } from '../shim/git';
import { EmptyLogger, Logger } from '../shim/logger';
import { PrepareVersionAdapter } from './prepare-version-adapter';

const config = encode({
  versionPrefix: 'v',
  releaseBranchPrefix: 'release/',
  masterBranch: 'master',
});
let git: jest.Mocked<Git>;
let adapter: PrepareVersionAdapter;
let logger: Logger;

beforeEach(() => {
  git = jest.fn(
    (): Pick<Git, 'tags' | 'createBranch'> => {
      return {
        tags: jest.fn(),
        createBranch: jest.fn(() => fromEither(right(undefined))),
      };
    },
  )();
  logger = new EmptyLogger();
  jest.spyOn(logger, 'log');
  adapter = new PrepareVersionAdapter(config, git, logger);
});

describe('PrepareVersionAdapter', () => {
  describe('notify', () => {
    it('detectedLatest()', async () => {
      await adapter.notify.detectedLatest(WipVersion.of(1, 0, 0));
      expect(logger.log).toBeCalledWith('info', 'detected latest version: v1.0.0');
    });

    it('computedNext()', async () => {
      await adapter.notify.computedNext(WipVersion.of(1, 0, 1));
      expect(logger.log).toBeCalledWith('info', 'compute next version: v1.0.1');
    });

    it('createdBranch()', async () => {
      await adapter.notify.createdBranch(ReleaseBranch.of(WipVersion.of(1, 0, 1)));
      expect(logger.log).toBeCalledWith('success', 'create development branch: release/v1.0.1');
    });
  });

  it('createBranch()', async () => {
    await adapter.createBranch(ReleaseBranch.of(WipVersion.of(1, 1, 0))).run();
    expect(git.createBranch).toHaveBeenCalledWith('release/v1.1.0', 'master');
  });
});
