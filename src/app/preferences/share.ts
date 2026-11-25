export const shareApp = async (): Promise<"shared" | "copied"> => {
  const shareData = {
    title: "SoundFaith",
    text: "A quiet place to return to the Scriptures.",
    url: window.location.href,
  };
  if (navigator.share) {
    await navigator.share(shareData);
    return "shared";
  }
  await navigator.clipboard?.writeText(window.location.href);
  return "copied";
};
