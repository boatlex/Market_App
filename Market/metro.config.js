const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const baseConfig = getDefaultConfig(__dirname);
baseConfig.maxWorkers = 2;

// Apply NativeWind FIRST so our resolveRequest wrapper runs after it
const config = withNativeWind(baseConfig, { input: "./global.css" });

const shimPath = path.resolve(__dirname, "react-native-web-shim.js");
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "web" &&
    (moduleName === "react-native-web" ||
      moduleName === "react-native-web/dist/index" ||
      moduleName === "react-native-web/dist/index.js") &&
    context.originModulePath !== shimPath
  ) {
    return {
      filePath: shimPath,
      type: "sourceFile",
    };
  }

  if (platform === "web" && moduleName === "react-native-image-viewing") {
    return {
      filePath: path.resolve(
        __dirname,
        "components/CrossPlatformImageView.web.tsx"
      ),
      type: "sourceFile",
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
