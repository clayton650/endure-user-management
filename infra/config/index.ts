import devConfig from "./dev";
import prodConfig from "./prod";
import Config from "./type";

enum ConfigEnv {
  dev = "dev",
  prod = "prod",
}

export default function getConfig(configEnv?: ConfigEnv): Config {
  switch (configEnv) {
    case ConfigEnv.dev:
      return devConfig;
    case ConfigEnv.prod:
      return prodConfig;
    default:
      throw new Error(
        `Invalid environment name: ${configEnv}. Should be one of: ${Object.values(ConfigEnv).join(", ")}`,
      );
  }
}
