import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import { PixelRatio } from "react-native";

export { moderateScale, scale, verticalScale };

export const normalizeFont = (size) =>
  Math.round(PixelRatio.roundToNearestPixel(moderateScale(size)));