export const sceneOf = (icon) => {
  const i = icon || "";
  if (i.includes("⛈")) return "thunder";
  if (i.includes("🌧") || i.includes("🌦")) return "rain";
  if (i.includes("☁")) return "overcast";
  if (i.includes("🌤") || i.includes("⛅") || i.includes("🌥")) return "partly";
  if (i.includes("🌫") || i.includes("🌁")) return "mist";
  if (i.includes("🌙") || i.includes("🌑")) return "night";
  return "sunny";
};
