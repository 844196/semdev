import { DeepPartial } from 'utility-types';

type DevelopmentEvent = 'prepare' | 'release';
type HookTiming = 'pre' | 'post';
type HookCommand = string;
type HookTimingMap = Record<HookTiming, HookCommand[]>;
type DevelopmentEventMap = Record<DevelopmentEvent, HookTimingMap>;

export interface Config {
  versionPrefix: string;
  releaseBranchPrefix: string;
  masterBranch: string;
  hooks?: DeepPartial<DevelopmentEventMap>;
}

export const defaultConfig: Config = {
  versionPrefix: 'v',
  releaseBranchPrefix: 'release/',
  masterBranch: 'master',
};
