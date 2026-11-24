const RNW = require("react-native-web");

if (RNW && typeof RNW.PlatformColor !== "function") {
  RNW.PlatformColor = (...names) => names[0] || "transparent";
}
