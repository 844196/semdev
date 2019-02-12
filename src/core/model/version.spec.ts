import { ReleaseType } from './release-type';
import { ordVersion, Version } from './version';

describe('Version', () => {
  it('initial()', () => {
    const v000 = Version.initial();
    expect(v000.major).toBe(0);
    expect(v000.minor).toBe(0);
    expect(v000.patch).toBe(0);
    expect(v000.preRelease).toBe('');
    expect(v000.wip).toBe(true);
  });

  describe('released()', () => {
    it('not pre', () => {
      const v123 = Version.released(1, 2, 3);
      expect(v123.major).toBe(1);
      expect(v123.minor).toBe(2);
      expect(v123.patch).toBe(3);
      expect(v123.preRelease).toBe('');
      expect(v123.wip).toBe(false);
    });

    it('pre', () => {
      const v123 = Version.released(1, 2, 3, 'alpha.1');
      expect(v123.major).toBe(1);
      expect(v123.minor).toBe(2);
      expect(v123.patch).toBe(3);
      expect(v123.preRelease).toBe('alpha.1');
      expect(v123.wip).toBe(false);
    });
  });

  describe('releasedFromString()', () => {
    it('not pre', () => {
      expect(Version.releasedFromString('1.2.3').value).toEqual(Version.released(1, 2, 3));
      expect(Version.releasedFromString('v1.2.3').value).toEqual(Version.released(1, 2, 3));
      expect(Version.releasedFromString('foo').value).toEqual(new Error('invalid version string given: foo'));
    });

    it('pre', () => {
      expect(Version.releasedFromString('1.2.3-alpha.1').value).toEqual(Version.released(1, 2, 3, 'alpha.1'));
      expect(Version.releasedFromString('v1.2.3-alpha.1').value).toEqual(Version.released(1, 2, 3, 'alpha.1'));
    });
  });

  it('wip()', () => {
    const v124Wip = Version.wip(1, 2, 4);
    expect(v124Wip.major).toBe(1);
    expect(v124Wip.minor).toBe(2);
    expect(v124Wip.patch).toBe(4);
    expect(v124Wip.preRelease).toBe('');
    expect(v124Wip.wip).toBe(true);
  });

  it('wipFromString()', () => {
    expect(Version.wipFromString('1.2.3').value).toEqual(Version.wip(1, 2, 3));
    expect(Version.wipFromString('v1.2.3').value).toEqual(Version.wip(1, 2, 3));
    expect(Version.wipFromString('foo').value).toEqual(new Error('invalid version string given: foo'));
  });

  describe('increment()', () => {
    const patterns = [
      {
        pattern: 'major release',
        releaseType: ReleaseType.major,
        expected: Version.wip(2, 0, 0),
      },
      {
        pattern: 'minor release',
        releaseType: ReleaseType.minor,
        expected: Version.wip(1, 3, 0),
      },
      {
        pattern: 'patch release',
        releaseType: ReleaseType.patch,
        expected: Version.wip(1, 2, 4),
      },
    ];

    patterns.forEach(({ pattern, releaseType, expected }) => {
      it(pattern, () => expect(Version.released(1, 2, 3).increment(releaseType)).toEqual(expected));
    });
  });

  describe('toString()', () => {
    it('not pre', () => {
      expect(Version.released(1, 2, 3).toString({ versionPrefix: 'v' })).toBe('v1.2.3');
    });

    it('pre', () => {
      expect(Version.released(1, 2, 3, 'alpha.1').toString({ versionPrefix: 'v' })).toBe('v1.2.3-alpha.1');
    });
  });
});

describe('ordVersion', () => {
  const a = () => Version.wip(1, 2, 3);
  const b = () => Version.wip(1, 2, 4);

  it('equals()', () => {
    expect(ordVersion.equals(a(), a())).toBe(true);
    expect(ordVersion.equals(a(), b())).toBe(false);
    expect(ordVersion.equals(b(), a())).toBe(false);
    expect(ordVersion.equals(b(), b())).toBe(true);
  });

  it('compare()', () => {
    expect(ordVersion.compare(a(), a())).toBe(0);
    expect(ordVersion.compare(a(), b())).toBe(-1);
    expect(ordVersion.compare(b(), a())).toBe(1);
    expect(ordVersion.compare(b(), b())).toBe(0);
  });
});
