/**
 * Runtime configuration for backend URLs.
 * These are loaded from build.json at runtime, not baked into the build.
 */

export interface RuntimeConfig {
  backendUrl: string;
  backendWsUrl: string;
  nodeEnv: string;
}

const defaultConfig: RuntimeConfig = {
  backendUrl: "http://127.0.0.1:3000",
  backendWsUrl: "ws://127.0.0.1:3000/ws",
  nodeEnv: "production",
};

let runtimeConfig: RuntimeConfig = { ...defaultConfig };

export function setRuntimeConfig(config: Partial<RuntimeConfig>): void {
  runtimeConfig = {
    ...runtimeConfig,
    ...config,
  };
}

export function getRuntimeConfig(): RuntimeConfig {
  return runtimeConfig;
}

export function getBackendUrl(): string {
  return runtimeConfig.backendUrl;
}

export function getBackendWsUrl(): string {
  return runtimeConfig.backendWsUrl;
}
