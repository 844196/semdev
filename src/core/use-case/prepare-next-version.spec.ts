import { left, right } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { ReleaseType } from '../model/release-type';
import { Version } from '../model/version';
import { VersionDevelopmentBranch } from '../model/version-development-branch';
import { PrepareNextVersion, PrepareNextVersionPort } from './prepare-next-version';

let port: jest.Mocked<PrepareNextVersionPort>;
let useCase: PrepareNextVersion;

beforeEach(() => {
  port = jest.fn(
    (): PrepareNextVersionPort => {
      return {
        fetchAllVersion: jest.fn(),
        checkoutBranch: jest.fn(),
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
      port.checkoutBranch.mockReturnValue(fromEither(right(VersionDevelopmentBranch.of(Version.wip(1, 2, 2)))));

      const rtn = await useCase.byReleaseType(releaseType).run();
      expect(rtn.isRight()).toBeTruthy();
      expect(port.fetchAllVersion).toHaveBeenCalled();
      expect(port.checkoutBranch).toHaveBeenCalledWith(VersionDevelopmentBranch.of(Version.wip(1, 2, 2))
        .value as VersionDevelopmentBranch);
    });

    it('success2', async () => {
      port.fetchAllVersion.mockReturnValue(fromEither(right(new Set())));
      port.checkoutBranch.mockReturnValue(fromEither(right(VersionDevelopmentBranch.of(Version.wip(0, 1, 0)))));

      const rtn = await useCase.byReleaseType(ReleaseType.minor).run();
      expect(rtn.isRight()).toBeTruthy();
      expect(port.fetchAllVersion).toHaveBeenCalled();
      expect(port.checkoutBranch).toHaveBeenCalledWith(VersionDevelopmentBranch.of(Version.wip(0, 1, 0))
        .value as VersionDevelopmentBranch);
    });

    it('some error happen', async () => {
      port.fetchAllVersion.mockReturnValue(fromEither(left('command not found: git')));

      const rtn = await useCase.byReleaseType(ReleaseType.minor).run();
      expect(rtn.value).toEqual('command not found: git');
    });
  });
});
