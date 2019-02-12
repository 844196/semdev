import { DefaultMethods, LoggerFunc } from 'signale';
import { SimpleGit } from 'simple-git/promise';
import { ReleaseBranch } from '../../core/model/release-branch';
import { Version } from '../../core/model/version';
import { Config } from '../config';
import { ReleaseVersionAdapter } from './release-version-adapter';

const config: Config = {
  masterBranch: 'master',
  versionPrefix: 'v',
  releaseBranchPrefix: 'release/',
};
let simpleGit: jest.Mocked<SimpleGit>;
let signale: jest.Mocked<Record<Extract<DefaultMethods, 'success' | 'info'>, LoggerFunc>>;
let adapter: ReleaseVersionAdapter;

beforeEach(() => {
  simpleGit = jest.fn(
    (): Pick<SimpleGit, 'checkout' | 'merge' | 'addTag'> => {
      return {
        addTag: jest.fn(),
        checkout: jest.fn(),
        merge: jest.fn(),
      };
    },
  )();
  signale = jest.fn(() => {
    return {
      success: jest.fn(() => undefined),
      info: jest.fn(() => undefined),
    };
  })();
  adapter = new ReleaseVersionAdapter(config, simpleGit, signale);
});

describe('ReleaseVersionAdapter', () => {
  it('mergeBranch()', async () => {
    const branch = ReleaseBranch.of(Version.wip(1, 0, 0)).value as ReleaseBranch;

    simpleGit.checkout.mockResolvedValue(undefined);
    simpleGit.merge.mockResolvedValue({});

    const rtn = await adapter.mergeBranch(branch).run();

    expect(rtn.value).toBe(branch);
    expect(simpleGit.checkout).toHaveBeenCalledWith('master');
    expect(simpleGit.merge).toHaveBeenCalledWith(['release/v1.0.0', '--no-ff']);
  });

  it('createTag()', async () => {
    const version = Version.wip(1, 0, 0);

    simpleGit.checkout.mockResolvedValue(undefined);
    simpleGit.addTag.mockResolvedValue('v1.0.0');

    const rtn = await adapter.createTag(version).run();
    expect(rtn.value).toBe(version);
    expect(simpleGit.checkout).toHaveBeenCalledWith('master');
    expect(simpleGit.addTag).toHaveBeenCalledWith('v1.0.0');
  });
});
