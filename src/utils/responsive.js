/**
 * responsive.js
 * ─────────────────────────────────────────────────────────────
 * A comprehensive responsive utility for React Native.
 * Designed for 15+ screen apps with minimal code changes.
 *
 * Usage:
 *   import { s, vs, ms, rf, wp, hp, isTablet, rSelect, getResponsive } from './utils/responsive';
 *
 * Author convention:
 *   s()  → horizontal scale   (padding, margin, width)
 *   vs() → vertical scale     (height, vertical margin/padding)
 *   ms() → moderate scale     (font sizes, icons, border radius)
 *   rf() → responsive font    (respects OS accessibility font scale)
 *   wp() → width percentage
 *   hp() → height percentage
 * ─────────────────────────────────────────────────────────────
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

// ─── Base Design Dimensions ───────────────────────────────────
// Change these to match the screen size you originally designed for.
const BASE_WIDTH  = 400; 
const BASE_HEIGHT = 920; 

// ─── Current Device Dimensions ───────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Scale Ratios ─────────────────────────────────────────────
const widthRatio  = SCREEN_WIDTH  / BASE_WIDTH;
const heightRatio = SCREEN_HEIGHT / BASE_HEIGHT;

// ─────────────────────────────────────────────────────────────
// STATIC SCALING FUNCTIONS
// Use these in StyleSheet.create() — most common usage.
// ─────────────────────────────────────────────────────────────

/**
 * Horizontal scale — for widths, horizontal padding/margin.
 * @param {number} size - size in dp from your base design
 * @returns {number}
 */
export const s = (size) => Math.round(widthRatio * size);

/**
 * Vertical scale — for heights, vertical padding/margin.
 * @param {number} size - size in dp from your base design
 * @returns {number}
 */
export const vs = (size) => Math.round(heightRatio * size);

/**
 * Moderate scale — for font sizes, icons, border radius.
 * Uses a factor to avoid extreme scaling on large devices.
 * @param {number} size   - size in dp from your base design
 * @param {number} factor - scaling aggressiveness 0 (none) to 1 (full), default 0.5
 * @returns {number}
 */
export const ms = (size, factor = 0.3) =>
  Math.round(size + (s(size) - size) * factor);

/**
 * Responsive font — moderate scale that also respects
 * the user's OS-level font size accessibility setting.
 * Recommended for all Text fontSize values.
 * @param {number} size - size in dp from your base design
 * @returns {number}
 */
export const rf = (size) => Math.round(ms(size) / PixelRatio.getFontScale());

/**
 * Width percentage — percent of current screen width.
 * @param {number} percent - 0 to 100
 * @returns {number}
 */
export const wp = (percent) => Math.round((SCREEN_WIDTH * percent) / 100);

/**
 * Height percentage — percent of current screen height.
 * @param {number} percent - 0 to 100
 * @returns {number}
 */
export const hp = (percent) => Math.round((SCREEN_HEIGHT * percent) / 100);

// ─────────────────────────────────────────────────────────────
// DEVICE TYPE DETECTION
// ─────────────────────────────────────────────────────────────

/** True if the device is a tablet (width >= 768dp) */
export const isTablet = SCREEN_WIDTH >= 768;

/** True if the device is a small phone (width <= 360dp, e.g. Galaxy A series) */
export const isSmallPhone = SCREEN_WIDTH <= 360;

/** True if the device is a large phone / phablet (width >= 414dp) */
export const isLargePhone = SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768;

/** Current platform */
export const isIOS     = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// ─────────────────────────────────────────────────────────────
// CONDITIONAL VALUE SELECTORS
// ─────────────────────────────────────────────────────────────

/**
 * Select a value based on device type.
 * @param {object} options
 * @param {*} options.phone  - value for phones (default)
 * @param {*} options.tablet - value for tablets
 * @param {*} [options.smallPhone] - value for small phones (optional)
 * @returns {*}
 *
 * @example
 * fontSize: rSelect({ phone: ms(16), tablet: ms(22) })
 */
export const rSelect = ({ phone, tablet, smallPhone }) => {
  if (isTablet    && tablet     !== undefined) return tablet;
  if (isSmallPhone && smallPhone !== undefined) return smallPhone;
  return phone;
};

/**
 * Platform-aware value selector.
 * @param {*} iosValue
 * @param {*} androidValue
 * @returns {*}
 */
export const platformSelect = (iosValue, androidValue) =>
  Platform.OS === 'ios' ? iosValue : androidValue;

// ─────────────────────────────────────────────────────────────
// DYNAMIC SCALING (for orientation change / foldables)
// Use getResponsive() inside components with useWindowDimensions.
// ─────────────────────────────────────────────────────────────

/**
 * Returns fresh scale functions based on current window dimensions.
 * Use this with useWindowDimensions() to support screen rotation.
 *
 * @param {number} width  - from useWindowDimensions()
 * @param {number} height - from useWindowDimensions()
 * @returns {{ s, vs, ms, rf, wp, hp }}
 *
 * @example
 * const { width, height } = useWindowDimensions();
 * const { s, vs, ms } = useMemo(() => getResponsive(width, height), [width, height]);
 */
export const getResponsive = (width = SCREEN_WIDTH, height = SCREEN_HEIGHT) => {
  const wRatio = width  / BASE_WIDTH;
  const hRatio = height / BASE_HEIGHT;

  const _s  = (size)            => Math.round(wRatio * size);
  const _vs = (size)            => Math.round(hRatio * size);
  const _ms = (size, factor = 0.5) => Math.round(size + (_s(size) - size) * factor);
  const _rf = (size)            => Math.round(_ms(size) / PixelRatio.getFontScale());
  const _wp = (percent)         => Math.round((width  * percent) / 100);
  const _hp = (percent)         => Math.round((height * percent) / 100);

  return { s: _s, vs: _vs, ms: _ms, rf: _rf, wp: _wp, hp: _hp };
};

// ─────────────────────────────────────────────────────────────
// SPACING SYSTEM  (optional — consistent design token spacing)
// Mirrors an 8pt grid scaled to the device.
// ─────────────────────────────────────────────────────────────

export const spacing = {
  xxs  : s(2),
  xs   : s(4),
  sm   : s(8),
  md   : s(12),
  base : s(16),
  lg   : s(20),
  xl   : s(24),
  xxl  : s(32),
  xxxl : s(48),
};

// ─────────────────────────────────────────────────────────────
// FONT SIZE SYSTEM (optional — consistent typography scale)
// ─────────────────────────────────────────────────────────────

export const fontSize = {
  xs     : ms(10),
  sm     : ms(12),
  md     : ms(14),
  base   : ms(16),
  lg     : ms(18),
  xl     : ms(20),
  xxl    : ms(24),
  xxxl   : ms(30),
  display: ms(36),
};

// ─────────────────────────────────────────────────────────────
// BORDER RADIUS SYSTEM
// ─────────────────────────────────────────────────────────────

export const radius = {
  xs  : ms(4),
  sm  : ms(8),
  md  : ms(12),
  lg  : ms(16),
  xl  : ms(24),
  full: ms(999),
};

// ─────────────────────────────────────────────────────────────
// DEBUG HELPER (remove in production)
// ─────────────────────────────────────────────────────────────

export const logDeviceInfo = () => {
  console.log('─── Responsive Debug ───────────────────');
  console.log(`Screen     : ${SCREEN_WIDTH} x ${SCREEN_HEIGHT}`);
  console.log(`Base       : ${BASE_WIDTH} x ${BASE_HEIGHT}`);
  console.log(`Width ratio: ${widthRatio.toFixed(3)}`);
  console.log(`Height ratio: ${heightRatio.toFixed(3)}`);
  console.log(`Font scale  : ${PixelRatio.getFontScale()}`);
  console.log(`Pixel ratio : ${PixelRatio.get()}`);
  console.log(`Device type : ${isTablet ? 'Tablet' : isSmallPhone ? 'Small Phone' : isLargePhone ? 'Large Phone' : 'Phone'}`);
  console.log(`Platform    : ${Platform.OS}`);
  console.log('────────────────────────────────────────');
};

// ─────────────────────────────────────────────────────────────
// DEFAULT EXPORT — convenience object
// ─────────────────────────────────────────────────────────────

export default {
  s, vs, ms, rf, wp, hp,
  isTablet, isSmallPhone, isLargePhone, isIOS, isAndroid,
  rSelect, platformSelect, getResponsive,
  spacing, fontSize, radius,
  logDeviceInfo,
  SCREEN_WIDTH, SCREEN_HEIGHT,
};