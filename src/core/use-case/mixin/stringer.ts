import { ReleaseBranch } from '../../model/release-branch';
import { Version } from '../../model/version';
import { ConfigPort } from '../../port/config-port';

export const versionAsString = (config: ConfigPort) => (version: Version) =>
  version.toString({
    versionPrefix: config.versionPrefix(),
  });

export const releaseBranchAsString = (config: ConfigPort) => (releaseBranch: ReleaseBranch) =>
  releaseBranch.toString({
    branchPrefix: config.releaseBranchPrefix(),
    versionPrefix: config.versionPrefix(),
  });
