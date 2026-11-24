import * as RNW from "react-native-web/dist/index";

export * from "react-native-web/dist/index";

export const PlatformColor =
  typeof RNW.PlatformColor === "function"
    ? RNW.PlatformColor
    : (...names) => names[0] || "transparent";

export default {
  ...RNW,
  PlatformColor,
};
