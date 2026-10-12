import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Layers,
  Sparkles,
  Sun,
  Moon,
  TreePine,
  CheckCircle2,
} from "lucide-react";
import { bibleJourney } from "../data/bibleJourney";
import {
  JourneyPeriodArtwork,
  getSavedJourneyTheme,
  saveJourneyTheme,
  getSavedJourneyVariant,
  saveJourneyVariant,
  type JourneyTheme,
  type JourneyVariant,
} from "../components/JourneyPeriodArtwork";

export function JourneyPreviewLabPage() {
  const [theme, setTheme] = useState<JourneyTheme>(getSavedJourneyTheme);
  const [variant, setVariant] = useState<JourneyVariant>(getSavedJourneyVariant);
  const [viewMode, setViewMode] = useState<"cards" | "panoramic" | "compare">("cards");
  const [perPeriodVariant, setPerPeriodVariant] = useState<Record<string, JourneyVariant>>({});
  const [appliedNotice, setAppliedNotice] = useState(false);

  const handleThemeChange = (newTheme: JourneyTheme) => {
    setTheme(newTheme);
    saveJourneyTheme(newTheme);
  };

  const handleVariantChange = (newVariant: JourneyVariant) => {
    setVariant(newVariant);
    saveJourneyVariant(newVariant);
  };

  const handleApplyAll = () => {
    saveJourneyTheme(theme);
    saveJourneyVariant(variant);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 4000);
  };

  const togglePeriodVariant = (periodId: string) => {
    setPerPeriodVariant((prev) => {
      const current = prev[periodId] ?? variant;
      return {
        ...prev,
        [periodId]: current === "vista" ? "sacred" : "vista",
      };
    });
  };

  const themeMeta: Record<
    JourneyTheme,
    { label: string; sub: string; icon: typeof Sun; swatch: string }
  > = {
    dawn: {
      label: "Pilgrim’s Dawn",
      sub: "Warm sandstone, terracotta & amber dawn (matches home card)",
      icon: Sun,
      swatch: "linear-gradient(135deg, #243542 0%, #636868 50%, #c89f76 100%)",
    },
    twilight: {
      label: "Covenant Twilight",
      sub: "Lapis lazuli, midnight indigo & luminous starlight",
      icon: Moon,
      swatch: "linear-gradient(135deg, #131c2b 0%, #2c3a52 50%, #62748f 100%)",
    },
    olive: {
      label: "Sacred Olive",
      sub: "Judean sage, ancient limestone & sun-washed earth",
      icon: TreePine,
      swatch: "linear-gradient(135deg, #2b3934 0%, #576558 50%, #b4a37f 100%)",
    },
  };

  return (
    <main className="journey-page artwork-lab-page section-wrap">
      {/* Navigation */}
      <nav className="journey-detail-nav" aria-label="Lab navigation">
        <a className="button button-outline" href="#/journey">
          <ArrowLeft size={16} /> Back to journey
        </a>
        <a className="journey-artwork-link" href="#/">
          Return to home <ArrowRight size={14} />
        </a>
      </nav>

      {/* Hero Header */}
      <header className="journey-heading">
        <div className="journey-heading-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> Temporary Design Lab · 12 Journey Periods
          </p>
          <h1>
            Artwork <em>Theme Studio</em>
          </h1>
          <p className="journey-intro">
            Handcrafted vector illustrations for all 12 periods of salvation history, crafted to match
            the elevation, depth, and serenity of the Journey card. Preview themes below and choose your
            favorite to apply across the entire journey.
          </p>
        </div>
      </header>

      {/* Control Station */}
      <section className="artwork-lab-controls" aria-label="Theme and display controls">
        <div className="lab-control-group">
          <span className="lab-control-label">
            <Sparkles size={14} aria-hidden="true" /> 1. Select Color Theme
          </span>
          <div className="lab-pill-row">
            {(["dawn", "twilight", "olive"] as const).map((t) => {
              const Icon = themeMeta[t].icon;
              const active = theme === t;
              return (
                <button
                  key={t}
                  type="button"
                  className={`lab-pill-btn ${active ? "is-active" : ""}`}
                  onClick={() => handleThemeChange(t)}
                >
                  <span
                    className="lab-swatch"
                    style={{ background: themeMeta[t].swatch }}
                    aria-hidden="true"
                  />
                  <span className="lab-pill-text">
                    <strong>{themeMeta[t].label}</strong>
                    <small>{themeMeta[t].sub}</small>
                  </span>
                  {active && <Check size={16} className="lab-check" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lab-control-row">
          <div className="lab-control-group">
            <span className="lab-control-label">
              <Layers size={14} aria-hidden="true" /> 2. Narrative Style
            </span>
            <div className="lab-sub-pills">
              <button
                type="button"
                className={`lab-mini-pill ${variant === "vista" && viewMode !== "compare" ? "is-active" : ""}`}
                onClick={() => {
                  setViewMode("cards");
                  handleVariantChange("vista");
                }}
              >
                Vista Landscape
              </button>
              <button
                type="button"
                className={`lab-mini-pill ${variant === "sacred" && viewMode !== "compare" ? "is-active" : ""}`}
                onClick={() => {
                  setViewMode("cards");
                  handleVariantChange("sacred");
                }}
              >
                Sacred Focus
              </button>
              <button
                type="button"
                className={`lab-mini-pill ${viewMode === "compare" ? "is-active" : ""}`}
                onClick={() => setViewMode("compare")}
              >
                Side-by-Side Comparison
              </button>
            </div>
          </div>

          <div className="lab-control-group">
            <span className="lab-control-label">
              <Eye size={14} aria-hidden="true" /> 3. Layout Format
            </span>
            <div className="lab-sub-pills">
              <button
                type="button"
                className={`lab-mini-pill ${viewMode === "cards" ? "is-active" : ""}`}
                onClick={() => setViewMode("cards")}
              >
                Card Grid (3-Col)
              </button>
              <button
                type="button"
                className={`lab-mini-pill ${viewMode === "panoramic" ? "is-active" : ""}`}
                onClick={() => setViewMode("panoramic")}
              >
                Panoramic View
              </button>
            </div>
          </div>

          <div className="lab-apply-box">
            <button
              type="button"
              className="button button-coral lab-apply-button"
              onClick={handleApplyAll}
            >
              <CheckCircle2 size={16} /> Apply Theme to Bible Journey
            </button>
            {appliedNotice && (
              <span className="lab-applied-toast" role="status">
                ✓ {themeMeta[theme].label} theme applied to Bible Journey!
              </span>
            )}
          </div>
        </div>

        {/* Quick jump anchor bar */}
        <div className="lab-quick-jump">
          <span className="lab-quick-jump-label">Jump to period:</span>
          <div className="lab-quick-jump-links">
            {bibleJourney.map((period, index) => (
              <a
                key={period.id}
                href={`#period-lab-${period.id}`}
                className="lab-jump-chip"
              >
                {String(index + 1).padStart(2, "0")} {period.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="artwork-lab-gallery" aria-label="12 Journey Period Artworks">
        {viewMode === "compare" ? (
          /* SIDE BY SIDE COMPARISON VIEW */
          <div className="artwork-lab-compare-list">
            {bibleJourney.map((period, index) => (
              <article
                className="lab-compare-card"
                key={period.id}
                id={`period-lab-${period.id}`}
              >
                <header className="lab-period-header">
                  <span className="lab-period-num">
                    Period {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2>{period.title}</h2>
                  <p className="lab-period-teaser">{period.teaser}</p>
                </header>
                <div className="lab-compare-grid">
                  <div className="lab-variant-slot">
                    <span className="lab-variant-tag">Option A · Vista Landscape</span>
                    <JourneyPeriodArtwork
                      periodId={period.id}
                      theme={theme}
                      variant="vista"
                      index={index}
                    />
                  </div>
                  <div className="lab-variant-slot">
                    <span className="lab-variant-tag">Option B · Sacred Focus</span>
                    <JourneyPeriodArtwork
                      periodId={period.id}
                      theme={theme}
                      variant="sacred"
                      index={index}
                    />
                  </div>
                </div>
                <div className="lab-card-meta">
                  <p>
                    <strong>Biblical Atmosphere:</strong> {period.artPrompt}
                  </p>
                  <a
                    className="journey-artwork-link"
                    href={`#/journey/${period.id}`}
                  >
                    View in Journey <ArrowRight size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* STANDARD GRID OR PANORAMIC VIEW */
          <div
            className={`artwork-lab-grid ${viewMode === "panoramic" ? "artwork-lab-grid--panoramic" : "artwork-lab-grid--cards"}`}
          >
            {bibleJourney.map((period, index) => {
              const activeVariant = perPeriodVariant[period.id] ?? variant;
              return (
                <article
                  className="lab-item-card"
                  key={period.id}
                  id={`period-lab-${period.id}`}
                >
                  <div className="lab-art-wrapper">
                    <JourneyPeriodArtwork
                      periodId={period.id}
                      theme={theme}
                      variant={activeVariant}
                      index={index}
                    />
                  </div>
                  <div className="lab-item-copy">
                    <div className="lab-item-top">
                      <span className="lab-period-num">
                        Period {String(index + 1).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        className="lab-toggle-variant-btn"
                        onClick={() => togglePeriodVariant(period.id)}
                        title="Toggle between Vista and Sacred Focus"
                      >
                        Style: <strong>{activeVariant === "vista" ? "Vista" : "Sacred"}</strong> (toggle)
                      </button>
                    </div>
                    <h3>{period.title}</h3>
                    <p className="lab-period-teaser">{period.teaser}</p>
                    <p className="lab-art-prompt-text">{period.artPrompt}</p>
                    <a
                      className="text-link lab-journey-link"
                      href={`#/journey/${period.id}`}
                    >
                      Explore period <ArrowRight size={14} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer Actions */}
      <footer className="artwork-lab-footer">
        <div className="lab-footer-box">
          <h2>Ready to experience the journey?</h2>
          <p>
            You can always come back to this page via <code>#/journey-preview</code> anytime to test
            more varieties and adjust your preferences.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="button button-coral"
              onClick={handleApplyAll}
            >
              <CheckCircle2 size={16} /> Apply {themeMeta[theme].label} Theme
            </button>
            <a className="button button-outline" href="#/journey">
              Open Bible Journey <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
