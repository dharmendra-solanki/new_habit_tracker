import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Flame,
  Focus,
  Sparkles,
  Target,
} from "lucide-react";

const benefits = [
  {
    icon: CheckCircle2,
    title: "Make the everyday count",
    description:
      "A quiet place for the small promises you make to yourself. Check in, keep going, and let consistency do its thing.",
  },
  {
    icon: Flame,
    title: "Find your own rhythm",
    description:
      "Streaks and progress that celebrate showing up, without turning a missed day into a reason to quit.",
  },
  {
    icon: Sparkles,
    title: "Get insight that feels personal",
    description:
      "Thoughtful AI reflections use your own habit patterns to help you notice what is working and what could feel easier.",
  },
];

const previewHabits = [
  { icon: "🌿", name: "Morning pages", meta: "Mindfulness · Daily", done: true },
  { icon: "📚", name: "Read a little", meta: "Learning · Daily", done: true },
  { icon: "🚶", name: "Get outside", meta: "Movement · Daily", done: false },
];

export default function HomePage() {
  return (
    <main className="landing-page min-h-screen overflow-hidden">
      <header className="landing-nav mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="brand-lockup" aria-label="Little by Little home">
          <span className="brand-mark"><Focus size={19} strokeWidth={2.2} /></span>
          <span>little by little</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="nav-login">Log in</Link>
          <Link href="/register" className="button button-dark button-small">
            Get started <ArrowRight size={15} />
          </Link>
        </nav>
      </header>

      <section className="hero-section mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 md:pb-28 md:pt-20 lg:grid-cols-[1.05fr_.95fr]">
        <div className="hero-copy relative z-10">
          <div className="eyebrow"><span className="eyebrow-dot" /> A softer way to grow</div>
          <h1>Become who you want to be, <span>one small habit at a time.</span></h1>
          <p className="hero-description">
            Build a life that feels a little more like yours. Keep track of the
            little things, celebrate your progress, and find your rhythm along
            the way.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/register" className="button button-dark">
              Start your journey <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" className="button button-quiet">
              See how it works <ArrowDownRight size={16} />
            </a>
          </div>
          <div className="hero-note">
            <span className="avatar-stack"><i>J</i><i>M</i><i>A</i></span>
            <span>A little progress, every day.</span>
            <span className="note-sparkle">✳</span>
          </div>
        </div>

        <div className="hero-art" aria-label="Habit tracker dashboard preview">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="preview-window">
            <div className="preview-topbar">
              <div className="preview-brand"><span className="mini-mark"><Focus size={12} /></span> little by little</div>
              <div className="preview-avatar">A</div>
            </div>
            <div className="preview-content">
              <div className="preview-date">MONDAY, MAY 12 <span>✦</span></div>
              <h2>Good morning, Alex <span>☀️</span></h2>
              <p className="preview-subtitle">A new week is a fresh start.</p>
              <div className="preview-progress-card">
                <div className="progress-ring"><span>67<small>%</small></span></div>
                <div className="progress-copy"><strong>You’re finding your rhythm</strong><span>2 of 3 habits complete</span></div>
                <div className="progress-spark"><ArrowUpRight size={16} /></div>
              </div>
              <div className="preview-list-heading"><strong>Today’s habits</strong><span>MON · 12</span></div>
              <div className="preview-habits">
                {previewHabits.map((habit) => (
                  <div className={`preview-habit ${habit.done ? "is-done" : ""}`} key={habit.name}>
                    <span className="habit-emoji">{habit.icon}</span>
                    <span className="habit-label"><strong>{habit.name}</strong><small>{habit.meta}</small></span>
                    <span className="habit-check">{habit.done && <Check size={14} />}</span>
                  </div>
                ))}
              </div>
              <div className="preview-foot"><span><Flame size={14} /> 5 day streak</span><span className="foot-divider" /><span><Target size={14} /> Keep showing up</span></div>
            </div>
          </div>
          <div className="floating-note note-top"><span>🌱</span><div><strong>One day at a time</strong><small>That’s how it grows.</small></div></div>
          <div className="floating-note note-bottom"><span className="note-check"><Check size={15} /></span><div><strong>Another small win</strong><small>You showed up today.</small></div></div>
          <div className="hero-flower flower-one">✳</div>
          <div className="hero-flower flower-two">✳</div>
        </div>
      </section>

      <section id="how-it-works" className="benefits-section">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
          <div className="section-heading">
            <span className="eyebrow"><span className="eyebrow-dot" /> A little more intentional</span>
            <h2>Good things take time.<br /><span>Let’s make room for that.</span></h2>
            <p>No perfect routines. No all-or-nothing thinking. Just a gentle nudge to keep becoming.</p>
          </div>
          <div className="benefit-grid">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <article className="benefit-card" key={title}>
                <div className={`benefit-icon benefit-icon-${index}`}><Icon size={20} /></div>
                <span className="benefit-index">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-section mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="closing-card">
          <div className="closing-decoration">✳</div>
          <span className="eyebrow"><span className="eyebrow-dot" /> Your next chapter</span>
          <h2>You don’t have to change everything.<br /><span>Just start with one thing.</span></h2>
          <Link href="/register" className="button button-light">Begin, gently <ArrowRight size={16} /></Link>
        </div>
      </section>
      <footer className="landing-footer mx-auto flex max-w-7xl items-center justify-between px-5 py-7 sm:px-8">
        <span className="brand-lockup"><span className="brand-mark"><Focus size={16} /></span> little by little</span>
        <span>Make space for the person you’re becoming.</span>
      </footer>
    </main>
  );
}
