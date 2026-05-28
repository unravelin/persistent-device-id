import { Core, type CoreConfig } from './core';

export default class PersistentDeviceId {
  public core: Core;

  public constructor(cfg: CoreConfig = {}) {
    this.core = new Core(cfg);
  }
}
