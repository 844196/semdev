import { left, right } from 'fp-ts/lib/Either';
import { none, some } from 'fp-ts/lib/Option';
import { fromEither } from 'fp-ts/lib/TaskEither';
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
        existsDevelopmentBranch: jest.fn(),
        createDevelopmentBranch: jest.fn(),
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
      port.existsDevelopmentBranch.mockReturnValue(fromEither(right(none)));
      port.createDevelopmentBranch.mockReturnValue(fromEither(right(undefined)));

      const rtn = await useCase.byReleaseType(releaseType).run();
      expect(rtn.value).toEqual(Version.wip(1, 2, 2));
      expect(port.fetchAllVersion).toHaveBeenCalled();
      expect(port.existsDevelopmentBranch).toHaveBeenCalledWith(Version.wip(1, 2, 2));
      expect(port.createDevelopmentBranch).toHaveBeenCalledWith(Version.wip(1, 2, 2));
    });

    it('success2', async () => {
      port.fetchAllVersion.mockReturnValue(fromEither(right(new Set())));
      port.existsDevelopmentBranch.mockReturnValue(fromEither(right(none)));
      port.createDevelopmentBranch.mockReturnValue(fromEither(right(undefined)));

      const rtn = await useCase.byReleaseType(ReleaseType.minor).run();
      expect(rtn.value).toEqual(Version.wip(0, 1, 0));
      expect(port.fetchAllVersion).toHaveBeenCalled();
      expect(port.existsDevelopmentBranch).toHaveBeenCalledWith(Version.wip(0, 1, 0));
      expect(port.createDevelopmentBranch).toHaveBeenCalledWith(Version.wip(0, 1, 0));
    });

    it('branch already exists', async () => {
      port.fetchAllVersion.mockReturnValue(fromEither(right(new Set([Version.released(1, 2, 3)]))));
      port.existsDevelopmentBranch.mockReturnValue(fromEither(right(some('release/v1.3.0'))));

      const rtn = await useCase.byReleaseType(ReleaseType.minor).run();
      expect(rtn.value).toEqual('branch already exists: release/v1.3.0');
      expect(port.createDevelopmentBranch).toHaveBeenCalledTimes(0);
    });

    it('some error happen', async () => {
      port.fetchAllVersion.mockReturnValue(fromEither(left('command not found: git')));

      const rtn = await useCase.byReleaseType(ReleaseType.minor).run();
      expect(rtn.value).toEqual('command not found: git');
      expect(port.existsDevelopmentBranch).toHaveBeenCalledTimes(0);
      expect(port.createDevelopmentBranch).toHaveBeenCalledTimes(0);
    });
  });
});
