type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  Plugins?: { SystemBars?: { setStyle?: (options: { style: "DARK" | "LIGHT" | "DEFAULT" }) => Promise<void> } };
};

const capacitor = () => (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;

export const isNativeApp = () => Boolean(capacitor()?.isNativePlatform?.());

// DARK = light icons for dark backgrounds; LIGHT = dark icons for light backgrounds.
export function syncSystemBars(theme: "light" | "dark") {
  void capacitor()?.Plugins?.SystemBars?.setStyle?.({ style: theme === "dark" ? "DARK" : "LIGHT" })?.catch(() => undefined);
}
