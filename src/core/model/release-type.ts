export enum ReleaseType {
  major = 'major',
  minor = 'minor',
  patch = 'patch',
}

export const isReleaseType = (x: string): x is ReleaseType => Object.values(ReleaseType).includes(x);
