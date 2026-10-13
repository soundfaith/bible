import { ArrowRight, Layers3 } from "lucide-react";

type HomePageProps = {
  onResume: () => void;
  onChoose: () => void;
  onMass: () => void;
  onJourney: () => void;
  onBreviary: () => void;
};

const primaryCards = [
  {
    art: "bible",
    title: "Bible",
    description: "Return to the Scriptures, one chapter at a time.",
    action: "Open Bible",
    onClick: "onChoose",
  },
  {
    art: "journey",
    title: "Bible Journey",
    description: "Follow the story of salvation through 12 periods.",
    action: "Continue Journey",
    onClick: "onJourney",
  },
  {
    art: "readings",
    title: "Mass Readings",
    description: "Pray with today’s liturgy.",
    action: "Today’s Readings",
    onClick: "onMass",
  },
] as const;

export function HomePage({ onResume, onChoose, onMass, onJourney, onBreviary }: HomePageProps) {
  const actions = { onChoose, onMass, onJourney };

  return (
    <main className="landing-page">
      <section className="landing-hero section-wrap" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> A quieter way to meet the Word</p>
          <h1 id="landing-title">Find your <em>quiet rhythm.</em></h1>
          <p className="hero-description">Scripture, prayer, and reflection — one step at a time.</p>
          <div className="hero-actions">
            <button className="button button-coral" onClick={onResume}>
              Resume reading <ArrowRight size={16} />
            </button>
            <button className="button button-outline" onClick={onBreviary}>
              Begin today’s prayer <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="landing-actions section-wrap" aria-label="Explore">
        <div className="landing-section-heading">
          <p className="eyebrow">Make room for what matters</p>
          <h2>A rhythm for every day.</h2>
        </div>
        <div className="landing-card-grid">
          {primaryCards.map(({ art, title, description, action, onClick }) => (
            <button
              className="landing-card"
              key={title}
              type="button"
              aria-label={`${title}: ${action}`}
              onClick={actions[onClick]}
            >
              <div className={`landing-card-art landing-card-art--${art}`} aria-hidden="true">
                {art === "bible" ? (
                  <svg className="landing-card-artwork" viewBox="0 0 400 200">
                    <path className="landing-bible-book-shadow" d="M71 56q68-24 127 15 59-39 131-15v101q-69-20-131 17-62-37-127-17z" />
                    <path className="landing-bible-page landing-bible-page--left" d="M78 62q61-18 120 17v86q-58-31-120-17z" />
                    <path className="landing-bible-page landing-bible-page--right" d="M202 79q58-35 120-17v86q-62-14-120 17z" />
                    <path className="landing-bible-spine" d="M198 78v87" />
                    <path className="landing-bible-text-lines" d="M99 86q37-9 72 6m-71 10q32-7 65 7m-63 10q30-6 57 7m59-40q31-17 65-16m-65 27q34-16 67-13m-66 25q31-12 66-10" />
                  </svg>
                ) : art === "journey" ? (
                  <svg className="landing-card-artwork" viewBox="0 0 400 200">
                    <ellipse className="landing-journey-sun" cx="200" cy="100" rx="60" ry="22" />
                    <path
                      className="landing-journey-mountains-distant"
                      d="M0 138l48-18 68-30 64 24 20-6 20 6 64-24 68 30 48 18v62H0z"
                    />
                    <path className="landing-journey-mountains-mid-left" d="M0 156q88-30 178-14v58H0z" />
                    <path className="landing-journey-mountains-mid-right" d="M400 150q-92-32-184-10v60h184z" />
                    <path className="landing-journey-ground" d="M0 176q100-14 200-2t200 4v22H0z" />
                    <path
                      className="landing-journey-path"
                      d="M197 108C206 118 223 125 223 136C223 148 174 152 174 165C174 178 164 188 164 200H236C236 188 200 178 200 165C200 152 239 148 239 136C239 125 203 118 203 108Z"
                    />
                    <path
                      className="landing-journey-path-line"
                      d="M200 110C209 119 231 126 231 136C231 148 187 152 187 165C187 178 200 188 200 200"
                    />
                    <ellipse className="landing-journey-cairn" cx="140" cy="182" rx="10" ry="4.5" />
                    <ellipse className="landing-journey-cairn" cx="141" cy="175" rx="7.5" ry="3.5" />
                    <ellipse className="landing-journey-cairn" cx="142" cy="169" rx="5" ry="2.5" />
                    <circle className="landing-journey-star-glow" cx="200" cy="42" r="16" />
                    <path className="landing-journey-star" d="M200 22q0 20 20 20q-20 0-20 20q0-20-20-20q20 0 20-20z" />
                    <circle className="landing-journey-star-center" cx="200" cy="42" r="2.5" />
                    <path className="landing-journey-star-rays" d="M200 14v6m0 44v6m-28-28h6m44 0h6" />
                  </svg>
                ) : art === "readings" ? (
                  <svg className="landing-card-artwork" viewBox="0 0 400 200">
                    <path className="landing-church-ground" d="M0 166q100-19 200 0t200 0v34H0z" />
                    <path className="landing-church-building" d="M118 97h164v71H118z" />
                    <path className="landing-church-roof" d="m99 99 101-55 101 55z" />
                    <path className="landing-church-tower" d="M169 62h62v-27h-62z" />
                    <path className="landing-church-spire" d="m160 36 40-27 40 27z" />
                    <path className="landing-church-cross" d="M197 10h6v20h-6zm-7 7h20v5h-20z" />
                    <path className="landing-church-door" d="M180 168v-36q0-20 20-20t20 20v36z" />
                    <path className="landing-church-window" d="M139 117q0-12 10-12t10 12v17h-20zm102 0q0-12 10-12t10 12v17h-20z" />
                  </svg>
                ) : (
                  <>
                    <svg className="landing-card-artwork" viewBox="0 0 400 200">
                      <path className="landing-prayer-table" d="M95 157h210v9H95z" />
                      <path className="landing-prayer-book" d="M128 135q36-16 72 0 36-16 72 0v31q-36-14-72 0-36-14-72 0z" />
                      <path className="landing-prayer-book-lines" d="M140 145q27-9 48 0m-47 8q24-8 46 0m30-8q24-9 45 0m-44 8q22-8 44 0" />
                      <path className="landing-prayer-candle" d="M286 90h25l-3 48h-19z" />
                      <path className="landing-prayer-candle-top" d="M286 90q12-7 25 0-12 7-25 0" />
                      <path className="landing-prayer-flame" d="M299 84q-13-12 0-30 13 18 0 30" />
                      <path className="landing-prayer-wick" d="M299 86v5" />
                    </svg>
                  </>
                )}
              </div>
              <div className="landing-card-copy">
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="text-link">
                  {action} <ArrowRight size={15} />
                </span>
              </div>
            </button>
          ))}
          <button className="landing-card" type="button" aria-label="Breviary: Pray the Hours" onClick={onBreviary}>
            <div className="landing-card-art landing-card-art--prayer" aria-hidden="true">
              <svg className="landing-card-artwork" viewBox="0 0 400 200">
                <path className="landing-prayer-table" d="M95 157h210v9H95z" />
                <path className="landing-prayer-book" d="M128 135q36-16 72 0 36-16 72 0v31q-36-14-72 0-36-14-72 0z" />
                <path className="landing-prayer-book-lines" d="M140 145q27-9 48 0m-47 8q24-8 46 0m30-8q24-9 45 0m-44 8q22-8 44 0" />
                <path className="landing-prayer-candle" d="M286 90h25l-3 48h-19z" />
                <path className="landing-prayer-candle-top" d="M286 90q12-7 25 0-12 7-25 0" />
                <path className="landing-prayer-flame" d="M299 84q-13-12 0-30 13 18 0 30" />
                <path className="landing-prayer-wick" d="M299 86v5" />
              </svg>
            </div>
            <div className="landing-card-copy">
              <h3>Breviary</h3>
              <p>Pray Lauds, Vespers, and Compline each day.</p>
              <span className="text-link">
                Pray the Hours <ArrowRight size={15} />
              </span>
            </div>
          </button>
        </div>
      </section>

      <section className="landing-continuation section-wrap" aria-labelledby="landing-continuation-title">
        <Layers3 size={20} aria-hidden="true" />
        <p className="eyebrow">A place to return to</p>
        <h2 id="landing-continuation-title">Continue your journey.</h2>
        <p className="landing-continuation-description">Your place is still here. Pick up where you left off.</p>
        <div className="landing-continuation-actions">
          <button className="button landing-continuation-button" onClick={onResume}>
            Continue reading <ArrowRight size={16} />
          </button>
          <button className="button button-outline" onClick={onJourney}>
            Explore Bible Journey <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </main>
  );
}
