import { mapOption } from 'fp-ts/lib/Array';
import { fromNullable } from 'fp-ts/lib/Option';
import { lookup } from 'fp-ts/lib/Record';
import { DeepPartial } from 'utility-types';

// see https://stackoverflow.com/a/45486495
const tuple = <T extends string[]>(...xs: T) => xs;

const DEVELOPMENT_EVENT = tuple('prepare', 'release');
const HOOK_TIMING = tuple('pre', 'post');

type DevelopmentEvent = typeof DEVELOPMENT_EVENT[number];
type HookTiming = typeof HOOK_TIMING[number];
type HookCommand = string;
type HookTimingMap = Record<HookTiming, HookCommand[]>;
type DevelopmentEventMap = Record<DevelopmentEvent, HookTimingMap>;

interface RawConfig {
  versionPrefix: string;
  releaseBranchPrefix: string;
  masterBranch: string;
  hooks?: DeepPartial<DevelopmentEventMap>;
}

export interface Config extends RawConfig {
  hooks: DevelopmentEventMap;
}

export const encode = (raw: RawConfig): Config => {
  const m: any = {};
  for (const e of DEVELOPMENT_EVENT) {
    const map = lookup(e, raw.hooks || {})
      .chain(fromNullable)
      .getOrElse({});
    m[e] = {};
    for (const t of HOOK_TIMING) {
      const hooks = lookup(t, map)
        .chain(fromNullable)
        .map((hs) => mapOption(hs, fromNullable))
        .getOrElse([]);
      m[e][t] = hooks;
    }
  }
  return { ...raw, hooks: m };
};

export const defaultConfig = encode({
  versionPrefix: 'v',
  releaseBranchPrefix: 'release/',
  masterBranch: 'master',
});

export const toStringerConfig = ({ versionPrefix, releaseBranchPrefix: branchPrefix }: Config) => ({
  versionPrefix,
  branchPrefix,
});
