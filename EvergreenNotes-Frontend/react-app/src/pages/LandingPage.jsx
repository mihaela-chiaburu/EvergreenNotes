import { Link } from "react-router-dom"
import logo from "../assets/images/logo.png"
import exploreIcon from "../assets/images/application (1).png"
import sproutIcon from "../assets/images/sprout.png"
import decor1 from "../assets/images/decor1.png"
import decor2 from "../assets/images/decor2.png"
import decor3 from "../assets/images/decor3.png"
import decor4 from "../assets/images/decor4.png"
import decor5 from "../assets/images/decor5.png"
import decor6 from "../assets/images/decor6.png"
import decor7 from "../assets/images/decor7.png"
import decor8 from "../assets/images/decor8.png"
import leafIcon from "../assets/images/leaf-from-figma.png"
import graphPreview from "../assets/images/grafu.png"
import topicNature from "../assets/images/popular1.png"
import topicPhilosophy from "../assets/images/popular2.png"
import topicArt from "../assets/images/popular3.png"
import featureTagging from "../assets/images/price-tag-white.png"
import featureGraph from "../assets/images/data-analytics-white.png"
import featureRepetition from "../assets/images/repeat-white.png"
import featureLearning from "../assets/images/reading-book-white.png"
import featureDiscovery from "../assets/images/sprout-white.png"
import featureExtension from "../assets/images/extension-white.png"
import "../styles/pages/landing.css"

function LandingPage() {
  return (
    <>
      <div className="space-sky" aria-hidden="true">
        <div className="space-sky__stars"></div>

        <div className="space-sky__halo space-sky__halo--1"></div>
        <div className="space-sky__beam space-sky__beam--1"></div>

        <div className="space-sky__halo space-sky__halo--2"></div>
        <div className="space-sky__beam space-sky__beam--2"></div>

        <div className="space-sky__halo space-sky__halo--3"></div>
        <div className="space-sky__beam space-sky__beam--3"></div>
      </div>

      <div className="side-decor" aria-hidden="true">
        <img className="side-decor__item side-decor__item--left side-decor__item--1" src={decor1} alt="" />
        <img className="side-decor__item side-decor__item--left side-decor__item--2" src={decor2} alt="" />
        <img className="side-decor__item side-decor__item--left side-decor__item--3" src={decor3} alt="" />
        <img className="side-decor__item side-decor__item--left side-decor__item--4" src={decor4} alt="" />
        <img className="side-decor__item side-decor__item--right side-decor__item--5" src={decor5} alt="" />
        <img className="side-decor__item side-decor__item--right side-decor__item--6" src={decor6} alt="" />
        <img className="side-decor__item side-decor__item--right side-decor__item--7" src={decor7} alt="" />
        <img className="side-decor__item side-decor__item--right side-decor__item--8" src={decor8} alt="" />
      </div>

      <nav className="navbar">
        <Link className="navbar__item navbar__item--brand" to="/">
          <img className="navbar__brand-logo" src={logo} alt="evergreen logo" />
          <p className="navbar__brand-name">EvergreenNotes</p>
        </Link>
        <Link className="navbar__item navbar__item--explore" to="/explore">
          <img className="navbar__icon" src={exploreIcon} alt="explore icon" />
          <p className="navbar__label">Explore</p>
        </Link>
        <Link className="navbar__item navbar__item--new-seed" to="/garden">
          <img className="navbar__icon" src={sproutIcon} alt="sprout icon" />
          <p className="navbar__label">New Seed</p>
        </Link>
        <Link className="navbar__item navbar__item--login" to="/garden">
          <p className="navbar__label">Log In</p>
        </Link>
      </nav>

      <main className="landing-page">
        <section className="hero">
          <div className="hero__content">
            <p className="hero__brand">EvergreenNotes</p>
            <p className="hero__title">Grow ideas that never fade</p>
            <p className="hero__subtitle">Build your digital garden with evolving notes</p>
          </div>
          <div className="hero-actions">
            <Link className="hero-actions__item hero-actions__item--primary" to="/garden">
              <img className="hero-actions__icon" src={sproutIcon} alt="sprout icon" />
              <p className="hero-actions__label">Start Your Garden</p>
            </Link>
            <Link className="hero-actions__item hero-actions__item--secondary" to="/explore">
              <img className="hero-actions__icon" src={exploreIcon} alt="explore icon" />
              <p className="hero-actions__label">Explore gardens</p>
            </Link>
          </div>
        </section>

        <section className="how-it-works">
          <p className="how-it-works__title">How it works</p>
          <div className="how-it-works__steps">
            <article className="how-it-works__step how-it-works__step--seed">
              <img className="how-it-works__icon" src={leafIcon} alt="leaf icon" />
              <p className="how-it-works__step-title">Plant a seed</p>
              <p className="how-it-works__step-description">Start with a simple note, a seed of an idea.</p>
            </article>
            <article className="how-it-works__step how-it-works__step--growth">
              <img className="how-it-works__icon" src={leafIcon} alt="sprout icon" />
              <p className="how-it-works__step-title">Watch it grow</p>
              <p className="how-it-works__step-description">As you add more notes, your garden flourishes.</p>
            </article>
            <article className="how-it-works__step how-it-works__step--insights">
              <img className="how-it-works__icon" src={leafIcon} alt="tree icon" />
              <p className="how-it-works__step-title">Harvest insights</p>
              <p className="how-it-works__step-description">Discover connections and insights as your garden evolves.</p>
            </article>
          </div>
        </section>

        <section className="growth-preview">
          <div className="growth-preview__content">
            <p className="growth-preview__title">See your thoughts grow</p>
            <p className="growth-preview__point">Visualize connections</p>
            <p className="growth-preview__point">Track evolution</p>
            <p className="growth-preview__point">Focus on what matters</p>
          </div>
          <div className="growth-preview__image-wrapper">
            <img className="growth-preview__image" src={graphPreview} alt="graph image" />
          </div>
        </section>

        <section className="popular-topics">
          <p className="popular-topics__title">Popular Topics</p>
          <div className="popular-topics__list">
            <article className="popular-topics__item popular-topics__item--nature">
              <img className="popular-topics__image" src={topicNature} alt="nature topic" />
              <p className="popular-topics__name">Nature</p>
            </article>
            <article className="popular-topics__item popular-topics__item--philosophy">
              <img className="popular-topics__image" src={topicPhilosophy} alt="philosophy topic" />
              <p className="popular-topics__name">Philosophy</p>
            </article>
            <article className="popular-topics__item popular-topics__item--art">
              <img className="popular-topics__image" src={topicArt} alt="art topic" />
              <p className="popular-topics__name">Art</p>
            </article>
          </div>
        </section>

        <section className="features">
          <p className="features__title">Features</p>
          <div className="features__grid">
            <article className="features__item features__item--tagging">
              <img className="features__icon" src={featureTagging} alt="tag icon" />
              <p className="features__label">Smart tagging</p>
            </article>
            <article className="features__item features__item--graph">
              <img className="features__icon" src={featureGraph} alt="graph icon" />
              <p className="features__label">Knowledge Graph</p>
            </article>
            <article className="features__item features__item--repetition">
              <img className="features__icon" src={featureRepetition} alt="repeat icon" />
              <p className="features__label">Spaced repetition</p>
            </article>
            <article className="features__item features__item--learning">
              <img className="features__icon" src={featureLearning} alt="reading book icon" />
              <p className="features__label">Learning in public</p>
            </article>
            <article className="features__item features__item--discovery">
              <img className="features__icon" src={featureDiscovery} alt="sprout icon" />
              <p className="features__label">Discover gardens</p>
            </article>
            <article className="features__item features__item--extension">
              <img className="features__icon" src={featureExtension} alt="extension icon" />
              <p className="features__label">Web Extension</p>
            </article>
          </div>
        </section>

        <section className="cta">
          <p className="cta__description">Built for those who want to reduce content consumption and improve memorization.</p>
          <p className="cta__title">Your ideas deserve to grow</p>
          <Link className="cta__action" to="/garden">
            <img className="cta__icon" src={sproutIcon} alt="sprout icon" />
            <p className="cta__label">Plant your seed</p>
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <p className="site-footer__text">&copy; 2026 EvergreenNotes. All rights reserved.</p>
      </footer>
    </>
  )
}

export default LandingPage
