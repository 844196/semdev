import { right } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../model/release-branch';
import { ReleaseType } from '../model/release-type';
import { Version } from '../model/version';
import { PrepareNextVersion, PrepareNextVersionPort } from './prepare-next-version';

let port: jest.Mocked<PrepareNextVersionPort>;
let useCase: PrepareNextVersion;

beforeEach(() => {
  port = jest.fn(
    (): PrepareNextVersionPort => {
      return {
        fetchAllVersion: jest.fn(),
        checkoutBranch: jest.fn((a) => fromEither(right(a))),
        notify: {
          detectedLatest: jest.fn((a) => fromEither(right(a))),
          computedNext: jest.fn((a) => fromEither(right(a))),
          createdBranch: jest.fn((a) => fromEither(right(a))),
        },
      };
    },
  )();
  useCase = new PrepareNextVersion(port);
});

describe('PrepareNextVersion', () => {
  describe('byReleaseType()', () => {
    it('success1', async () => {
      const versions = [
        Version.released(1, 0, 2),
        Version.released(1, 2, 1),
        Version.released(1, 0, 0),
        Version.wip(2, 0, 0),
        Version.released(1, 0, 1),
        Version.released(1, 2, 0),
      ];
      const releaseType = ReleaseType.patch;

      port.fetchAllVersion.mockReturnValue(fromEither(right(new Set(versions))));

      const rtn = await useCase.byReleaseType(releaseType).run();
      expect(rtn.isRight()).toBeTruthy();
      expect(port.fetchAllVersion).toHaveBeenCalled();
      expect(port.checkoutBranch).toHaveBeenCalledWith(ReleaseBranch.of(Version.wip(1, 2, 2)).value as ReleaseBranch);
    });

    it('success2', async () => {
      port.fetchAllVersion.mockReturnValue(fromEither(right(new Set())));

      const rtn = await useCase.byReleaseType(ReleaseType.minor).run();
      expect(rtn.isRight()).toBeTruthy();
      expect(port.fetchAllVersion).toHaveBeenCalled();
      expect(port.checkoutBranch).toHaveBeenCalledWith(ReleaseBranch.of(Version.wip(0, 1, 0)).value as ReleaseBranch);
    });
  });

  it('byVersion()', async () => {
    const version = Version.wip(1, 0, 0);
    const expectedReleaseBranch = ReleaseBranch.of(version).value as ReleaseBranch;

    const rtn = await useCase.byVersion(version).run();

    expect(rtn.isRight).toBeTruthy();
    expect(port.checkoutBranch).toHaveBeenCalledWith(expectedReleaseBranch);
  });
});
