import { ReleaseType } from './release-type';
import { isVersionString, ordVersion, ReleasedVersion, setoidVersion, VersionString, WipVersion } from './version';

describe('Version', () => {
  describe('increment()', () => {
    const patterns = [
      {
        pattern: 'major release',
        releaseType: ReleaseType.major,
        expected: WipVersion.of(2, 0, 0),
      },
      {
        pattern: 'minor release',
        releaseType: ReleaseType.minor,
        expected: WipVersion.of(1, 3, 0),
      },
      {
        pattern: 'patch release',
        releaseType: ReleaseType.patch,
        expected: WipVersion.of(1, 2, 4),
      },
    ];

    patterns.forEach(({ pattern, releaseType, expected }) => {
      it(pattern, () => expect(ReleasedVersion.of(1, 2, 3).increment(releaseType)).toEqual(expected));
    });
  });

  describe('toString()', () => {
    it('not pre', () => {
      expect(ReleasedVersion.of(1, 2, 3).toString({ versionPrefix: 'v' })).toBe('v1.2.3');
    });

    it('pre', () => {
      expect(ReleasedVersion.of(1, 2, 3, 'alpha.1').toString({ versionPrefix: 'v' })).toBe('v1.2.3-alpha.1');
    });
  });
});

describe('ReleasedVersion', () => {
  it('of()', () => {
    const v123 = ReleasedVersion.of(1, 2, 3);
    expect(v123.major).toBe(1);
    expect(v123.minor).toBe(2);
    expect(v123.patch).toBe(3);
    expect(v123.preRelease).toBe('');

    const v123Alpha1 = ReleasedVersion.of(1, 2, 3, 'alpha.1');
    expect(v123Alpha1.major).toBe(1);
    expect(v123Alpha1.minor).toBe(2);
    expect(v123Alpha1.patch).toBe(3);
    expect(v123Alpha1.preRelease).toBe('alpha.1');
  });

  it('fromString()', () => {
    expect(ReleasedVersion.fromString('1.2.3' as VersionString)).toEqual(ReleasedVersion.of(1, 2, 3));
    expect(ReleasedVersion.fromString('v1.2.3' as VersionString)).toEqual(ReleasedVersion.of(1, 2, 3));
    expect(ReleasedVersion.fromString('1.2.3-alpha.1' as VersionString)).toEqual(
      ReleasedVersion.of(1, 2, 3, 'alpha.1'),
    );
    expect(ReleasedVersion.fromString('v1.2.3-alpha.1' as VersionString)).toEqual(
      ReleasedVersion.of(1, 2, 3, 'alpha.1'),
    );
  });

  it('isReleased()', () => {
    expect(ReleasedVersion.of(1, 2, 3).isReleased()).toBeTruthy();
  });

  it('isWip()', () => {
    expect(ReleasedVersion.of(1, 2, 3).isWip()).toBeFalsy();
  });
});

describe('WipVersion', () => {
  it('of()', () => {
    const v123 = WipVersion.of(1, 2, 3);
    expect(v123.major).toBe(1);
    expect(v123.minor).toBe(2);
    expect(v123.patch).toBe(3);
    expect(v123.preRelease).toBe('');
  });

  it('fromString()', () => {
    expect(WipVersion.fromString('1.2.3' as VersionString)).toEqual(WipVersion.of(1, 2, 3));
    expect(WipVersion.fromString('v1.2.3' as VersionString)).toEqual(WipVersion.of(1, 2, 3));
  });

  it('isReleased()', () => {
    expect(WipVersion.of(1, 2, 3).isReleased()).toBeFalsy();
  });

  it('isWip()', () => {
    expect(WipVersion.of(1, 2, 3).isWip()).toBeTruthy();
  });
});

describe('setoidVersion', () => {
  describe('equals()', () => {
    const patterns = [
      {
        pattern: 'wip1.2.3 === wip1.2.3',
        a: WipVersion.of(1, 2, 3),
        b: WipVersion.of(1, 2, 3),
        expected: true,
      },
      {
        pattern: 'released1.2.3 === released1.2.3',
        a: ReleasedVersion.of(1, 2, 3),
        b: ReleasedVersion.of(1, 2, 3),
        expected: true,
      },
      {
        pattern: 'wip1.2.3 !== wip1.2.4',
        a: WipVersion.of(1, 2, 3),
        b: WipVersion.of(1, 2, 4),
        expected: false,
      },
      {
        pattern: 'wip1.2.4 !== wip1.2.3',
        a: WipVersion.of(1, 2, 4),
        b: WipVersion.of(1, 2, 3),
        expected: false,
      },
      {
        pattern: 'wip1.2.3 !== released1.2.3',
        a: WipVersion.of(1, 2, 3),
        b: ReleasedVersion.of(1, 2, 3),
        expected: false,
      },
      {
        pattern: 'wip1.2.3 !== released1.2.4',
        a: WipVersion.of(1, 2, 3),
        b: ReleasedVersion.of(1, 2, 4),
        expected: false,
      },
      {
        pattern: 'released1.2.4 !== wip1.2.3',
        a: ReleasedVersion.of(1, 2, 4),
        b: WipVersion.of(1, 2, 3),
        expected: false,
      },
      {
        pattern: 'released1.2.3 !== released1.2.4',
        a: ReleasedVersion.of(1, 2, 3),
        b: ReleasedVersion.of(1, 2, 4),
        expected: false,
      },
      {
        pattern: 'released1.2.4 !== released1.2.3',
        a: ReleasedVersion.of(1, 2, 4),
        b: ReleasedVersion.of(1, 2, 3),
        expected: false,
      },
    ];

    patterns.forEach(({ pattern, a, b, expected }) => {
      it(pattern, () => expect(setoidVersion.equals(a, b)).toBe(expected));
    });
  });
});

describe('ordVersion', () => {
  describe('compare()', () => {
    const patterns = [
      {
        pattern: 'wip1.2.3 === wip1.2.3',
        a: WipVersion.of(1, 2, 3),
        b: WipVersion.of(1, 2, 3),
        expected: 0,
      },
      {
        pattern: 'released1.2.3 === released1.2.3',
        a: ReleasedVersion.of(1, 2, 3),
        b: ReleasedVersion.of(1, 2, 3),
        expected: 0,
      },
      {
        pattern: 'wip1.2.3 < wip1.2.4',
        a: WipVersion.of(1, 2, 3),
        b: WipVersion.of(1, 2, 4),
        expected: -1,
      },
      {
        pattern: 'wip1.2.4 > wip1.2.3',
        a: WipVersion.of(1, 2, 4),
        b: WipVersion.of(1, 2, 3),
        expected: 1,
      },
      {
        pattern: 'wip1.2.3 < released1.2.3',
        a: WipVersion.of(1, 2, 3),
        b: ReleasedVersion.of(1, 2, 3),
        expected: -1,
      },
      {
        pattern: 'wip1.2.3 < released1.2.4',
        a: WipVersion.of(1, 2, 3),
        b: ReleasedVersion.of(1, 2, 4),
        expected: -1,
      },
      {
        pattern: 'released1.2.4 > wip1.2.3',
        a: ReleasedVersion.of(1, 2, 4),
        b: WipVersion.of(1, 2, 3),
        expected: 1,
      },
      {
        pattern: 'released1.2.3 < released1.2.4',
        a: ReleasedVersion.of(1, 2, 3),
        b: ReleasedVersion.of(1, 2, 4),
        expected: -1,
      },
      {
        pattern: 'released1.2.4 > released1.2.3',
        a: ReleasedVersion.of(1, 2, 4),
        b: ReleasedVersion.of(1, 2, 3),
        expected: 1,
      },
    ];

    patterns.forEach(({ pattern, a, b, expected }) => {
      it(pattern, () => expect(ordVersion.compare(a, b)).toBe(expected));
    });
  });
});

describe('isVersionString()', () => {
  it('valid', () => {
    expect(isVersionString('1.2.3')).toBeTruthy();
    expect(isVersionString('v1.2.3')).toBeTruthy();
    expect(isVersionString('1.2.3-alpha.1')).toBeTruthy();
    expect(isVersionString('v1.2.3-alpha.1')).toBeTruthy();
  });

  it('invalid', () => {
    expect(isVersionString('aaa')).toBeFalsy();
  });
});
