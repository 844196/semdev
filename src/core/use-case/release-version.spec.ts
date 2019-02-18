import { right } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../model/release-branch';
import { ReleasedVersion, WipVersion } from '../model/version';
import { ReleaseVersion, ReleaseVersionPort } from './release-version';

let port: jest.Mocked<ReleaseVersionPort>;
let useCase: ReleaseVersion;

beforeEach(() => {
  port = jest.fn(
    (): ReleaseVersionPort => {
      return {
        mergeBranch: jest.fn((a) => fromEither(right(a))),
        createTag: jest.fn((a) => fromEither(right(a))),
        latestVersion: jest.fn(),
        runHooks: jest.fn(() => fromEither(right(undefined))),
        notify: {
          merged: jest.fn((a) => fromEither(right(a))),
          tagged: jest.fn((a) => fromEither(right(a))),
        },
        ensureReleasable: jest.fn(() => fromEither(right(undefined))),
      };
    },
  )();
  useCase = new ReleaseVersion(port);
});

describe('ReleaseVersion', () => {
  it('byVersion()', async () => {
    const latestVersion = ReleasedVersion.of(1, 0, 0);
    port.latestVersion.mockReturnValue(fromEither(right(latestVersion)));

    const releaseVersion = WipVersion.of(1, 1, 0);
    const expectedReleaseBranch = ReleaseBranch.of(releaseVersion);

    const rtn = await useCase.byVersion(releaseVersion).run();

    expect(rtn.isRight()).toBeTruthy();
    expect(port.mergeBranch).toHaveBeenCalledWith(expectedReleaseBranch);
    expect(port.createTag).toHaveBeenCalledWith(releaseVersion);
  });
});
