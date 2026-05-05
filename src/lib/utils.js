/**
 * Merge classnames conditionally
 * Handles strings, arrays, and objects to create a single className string
 */
export function cn(...classes) {
  return classes
    .flat()
    .filter((cls) => typeof cls === "string" && cls.length > 0)
    .join(" ");
}
