import { ReleaseBranch } from './release-branch';
import { WipVersion } from './version';

describe('ReleaseBranch', () => {
  it('toString()', () => {
    const branch = ReleaseBranch.of(WipVersion.of(1, 2, 3));

    expect(branch.toString()).toBe('1.2.3');
    expect(branch.toString({ branchPrefix: 'release/', versionPrefix: 'v' })).toBe('release/v1.2.3');
  });
});
