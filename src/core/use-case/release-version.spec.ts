import { right } from 'fp-ts/lib/Either';
import { fromEither, taskEither } from 'fp-ts/lib/TaskEither';
import { CLIHookAction } from '../model/cli-hook-action';
import { ReleaseBranch } from '../model/release-branch';
import { Version } from '../model/version';
import { ReleaseVersion, ReleaseVersionPort } from './release-version';

let hookA: jest.Mocked<CLIHookAction>;
let hookB: jest.Mocked<CLIHookAction>;
let port: jest.Mocked<ReleaseVersionPort>;
let useCase: ReleaseVersion;

beforeEach(() => {
  hookA = jest.fn(() => {
    return {
      build: jest.fn(() => taskEither.of(undefined)),
    };
  })();
  hookB = jest.fn(() => {
    return {
      build: jest.fn(() => taskEither.of(undefined)),
    };
  })();
  port = jest.fn(
    (): ReleaseVersionPort => {
      return {
        mergeBranch: jest.fn((a) => fromEither(right(a))),
        createTag: jest.fn((a) => fromEither(right(a))),
        latestVersion: jest.fn(),
        hooks: {
          pre: [hookA],
          post: [hookB],
        },
        notify: {
          merged: jest.fn((a) => fromEither(right(a))),
          tagged: jest.fn((a) => fromEither(right(a))),
          runHook: jest.fn((a) => fromEither(right(a))),
        },
      };
    },
  )();
  useCase = new ReleaseVersion(port);
});

describe('ReleaseVersion', () => {
  it('byVersion()', async () => {
    const latestVersion = Version.wip(1, 0, 0);
    port.latestVersion.mockReturnValue(fromEither(right(latestVersion)));

    const releaseVersion = Version.wip(1, 1, 0);
    const expectedReleaseBranch = ReleaseBranch.of(releaseVersion).value as ReleaseBranch;

    const rtn = await useCase.byVersion(releaseVersion).run();

    expect(rtn.isRight()).toBeTruthy();
    expect(hookA.build).toHaveBeenCalledWith(releaseVersion, latestVersion);
    expect(port.mergeBranch).toHaveBeenCalledWith(expectedReleaseBranch);
    expect(port.createTag).toHaveBeenCalledWith(releaseVersion);
    expect(hookB.build).toHaveBeenCalledWith(releaseVersion, latestVersion);
  });
});
