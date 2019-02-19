import { ConfigPort } from '../../core/port/config-port';
import { Config } from '../config';

export class ConfigAdapter implements ConfigPort {
  public constructor(private readonly config: Config) {}

  public masterBranch() {
    return this.config.masterBranch;
  }

  public releaseBranchPrefix() {
    return this.config.releaseBranchPrefix;
  }

  public versionPrefix() {
    return this.config.versionPrefix;
  }

  public hooks(type: 'prepare' | 'release') {
    return this.config.hooks[type];
  }
}
