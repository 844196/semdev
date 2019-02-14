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
        latestVersion: jest.fn(),
        createBranch: jest.fn(() => fromEither(right(undefined))),
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
  it('byReleaseType()', async () => {
    const releaseType = ReleaseType.patch;

    port.latestVersion.mockReturnValue(fromEither(right(Version.released(1, 2, 1))));

    const rtn = await useCase.byReleaseType(releaseType).run();
    expect(rtn.isRight()).toBeTruthy();
    expect(port.latestVersion).toHaveBeenCalled();
    expect(port.createBranch).toHaveBeenCalledWith(ReleaseBranch.of(Version.wip(1, 2, 2)));
  });

  it('byVersion()', async () => {
    const version = Version.wip(1, 0, 0);
    const expectedReleaseBranch = ReleaseBranch.of(version);

    const rtn = await useCase.byVersion(version).run();

    expect(rtn.isRight).toBeTruthy();
    expect(port.createBranch).toHaveBeenCalledWith(expectedReleaseBranch);
  });
});
