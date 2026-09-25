import { ArrowUpRight } from "lucide-react";
import type { TemplateProject as Project } from "../lib/template";
import { formatMoney, isGoalReachedStatus } from "../lib/template";
import { Progress, ProjectVisual } from "./ProjectPrimitives";

export function ProjectCard({ project, index, onDetails, onDonate, compact = false }: { project: Project; index: number; onDetails: () => void; onDonate: () => void; compact?: boolean }) {
  return <article className={compact ? "project-card project-card-compact" : "project-card"} style={{ animationDelay: `${index * 70}ms` }}><ProjectVisual project={project} compact={compact} /><div className="project-card-body"><div className="card-meta"><span className="category-label">{project.category}</span><span>{project.location}</span></div><p className="card-organization">{project.organization}</p><h3>{project.title}</h3><p className="card-description">{project.description}</p><div className="card-funding-copy"><strong>{formatMoney(project.raised)}</strong><span>of {formatMoney(project.goal)}</span></div><Progress project={project} /><footer className="card-footer"><span>{project.supporters} supporters</span><div className="card-actions"><button className="card-details" onClick={onDetails}>View details</button>{!compact && <button className="card-donate" disabled={isGoalReachedStatus(project.status)} onClick={onDonate}>{isGoalReachedStatus(project.status) ? "Complete" : <>Support <ArrowUpRight size={14} /></>}</button>}</div></footer></div></article>;
}
