const fs = require("node:fs");
const path = require("node:path");
const { withDangerousMod } = require("expo/config-plugins.js");

/** @type {import("expo/config-plugins").ConfigPlugin} */
const withAdiRegistration = (config) => {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const token = process.env.ADI_REGISTRATION_TOKEN;

      if (!token) {
        console.log(
          "ADI_REGISTRATION_TOKEN is not set. Skip generating adi-registration.properties"
        );

        return config;
      }

      const assetsDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/assets"
      );

      fs.mkdirSync(assetsDir, { recursive: true });

      const dest = path.join(assetsDir, "adi-registration.properties");

      fs.writeFileSync(dest, token, "utf8");

      console.log(
        "adi-registration.properties generated from environment variable"
      );

      return config;
    },
  ]);
};

module.exports = withAdiRegistration;
