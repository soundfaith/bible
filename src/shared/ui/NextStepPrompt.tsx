import { SmallCard, type SmallCardProps } from "./LandingSmallCard";

export function NextStepPrompt({ heading, card, className = "" }: { heading: string; card: SmallCardProps; className?: string }) {
  return <section className={`landing-next section-wrap ${className}`.trim()} aria-label={heading}>
    <div className="landing-section-heading landing-centered-heading"><h2>{heading}</h2></div>
    <div className="landing-next-card"><SmallCard {...card} /></div>
  </section>;
}
