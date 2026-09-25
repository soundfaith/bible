import type { TemplateProject as Project } from "../lib/template";

export function optimizeProjectImageUrl(imageUrl: string, width: number) {
  return imageUrl;
}

export function Progress({ project, large = false }: { project: Project; large?: boolean }) {
  const percent = Math.min(100, Math.round((project.raised / project.goal) * 100));
  return <div className={large ? "progress progress-large" : "progress"}><div style={{ width: `${percent}%` }} /></div>;
}

export function ProjectVisual({ project, featured = false, compact = false }: { project: Project; featured?: boolean; compact?: boolean }) {
  const imageUrl = project.image_urls?.[0];
  const optimizedImageUrl = imageUrl ? optimizeProjectImageUrl(imageUrl, featured ? 1280 : 720) : undefined;

  return (
    <div
      className={`project-visual ${project.accent} ${featured ? "project-visual-featured" : ""} ${compact ? "project-visual-compact" : ""} ${
        imageUrl ? "project-visual-has-image" : ""
      }`}
      style={
        optimizedImageUrl
          ? {
              backgroundImage: `url(${optimizedImageUrl})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center"
            }
          : undefined
      }
      role="img"
      aria-label={`${project.title} project visual`}
    >
      {!imageUrl && (
        <>
          <span className="visual-sun" />
          <span className="visual-arch" />
          <span className="visual-line" />
        </>
      )}
      <span className="visual-label">{project.location}</span>
    </div>
  );
}
