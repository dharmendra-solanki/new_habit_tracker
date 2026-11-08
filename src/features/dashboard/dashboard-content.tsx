"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flame,
  Heart,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { apiRequest, getErrorMessage } from "@/lib/api-client";

type View = "overview" | "habits" | "weekly" | "insights" | "stats";
type Habit = {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: string;
  targetDays: number;
  color: string;
  icon: string;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
};
type Log = {
  id: string;
  habitId: string;
  completedDate: string;
  notes: string;
};
type HeatmapDay = { date: string; count: number };
type HabitStat = {
  habitId: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  completions30d: number;
  currentStreak: number;
  longestStreak: number;
};
type DashboardData = {
  habits: Habit[];
  logs: Log[];
  heatmap: HeatmapDay[];
  stats: HabitStat[];
};
type HabitFormState = {
  name: string;
  description: string;
  category: string;
  frequency: string;
  targetDays: number;
  color: string;
  icon: string;
};

const initialForm: HabitFormState = {
  name: "",
  description: "",
  category: "HEALTH",
  frequency: "DAILY",
  targetDays: 7,
  color: "#7c66ad",
  icon: "🌱",
};

const categoryLabels: Record<string, string> = {
  HEALTH: "Wellbeing",
  FITNESS: "Movement",
  LEARNING: "Learning",
  MINDFULNESS: "Mindfulness",
  PRODUCTIVITY: "Focus",
  SOCIAL: "Connection",
  FINANCE: "Money",
  CREATIVE: "Creative",
  OTHER: "Personal",
};

const categoryOptions = Object.entries(categoryLabels);
const frequencyOptions = [
  { value: "DAILY", label: "Every day" },
  { value: "WEEKLY", label: "Every week" },
  { value: "MONTHLY", label: "Every month" },
];

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, count: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + count);
  return next;
}

function mondayOf(date: Date) {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  const offset = (next.getUTCDay() + 6) % 7;
  next.setUTCDate(next.getUTCDate() - offset);
  return next;
}

function prettyDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    ...options,
  }).format(date);
}

function dayLabel(date: Date, weekday: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("en", { weekday }).format(date);
}

export function DashboardContent({ view }: { view: View }) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    habits: [],
    logs: [],
    heatmap: [],
    stats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cursor, setCursor] = useState(() => mondayOf(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const end = dateKey(new Date());
      const start = dateKey(addDays(new Date(), -89));
      const [habitData, logData, heatmapData, statsData] = await Promise.all([
        apiRequest<{ habits: Habit[] }>("/api/habits?includeArchived=true"),
        apiRequest<{ logs: Log[] }>(
          `/api/logs/range?start=${start}&end=${end}`,
        ),
        apiRequest<{ days: HeatmapDay[] }>("/api/logs/heatmap"),
        apiRequest<{ perHabit: HabitStat[] }>("/api/logs/stats"),
      ]);
      setData({
        habits: habitData.habits,
        logs: logData.logs,
        heatmap: heatmapData.days,
        stats: statsData.perHabit,
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeHabits = useMemo(
    () => data.habits.filter((habit) => !habit.isArchived),
    [data.habits],
  );
  const completedDates = useMemo(
    () => new Set(data.logs.map((log) => `${log.habitId}:${log.completedDate.slice(0, 10)}`)),
    [data.logs],
  );
  const today = dateKey(new Date());
  const completedToday = activeHabits.filter((habit) =>
    completedDates.has(`${habit.id}:${today}`),
  ).length;
  const progressPercent = activeHabits.length
    ? Math.round((completedToday / activeHabits.length) * 100)
    : 0;
  const completedThisWeek = data.logs.filter((log) => {
    const key = log.completedDate.slice(0, 10);
    return key >= dateKey(mondayOf(new Date())) && key <= today;
  }).length;
  const streakDays = Math.max(0, ...data.stats.map((stat) => stat.currentStreak));
  const bestStreak = Math.max(0, ...data.stats.map((stat) => stat.longestStreak));

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  async function toggleCompletion(habit: Habit, day = today) {
    const isComplete = completedDates.has(`${habit.id}:${day}`);
    try {
      if (isComplete) {
        await apiRequest(`/api/logs/${habit.id}?date=${day}`, {
          method: "DELETE",
        });
        showNotice("A little more room for tomorrow.");
      } else {
        await apiRequest(`/api/logs/${habit.id}`, {
          method: "POST",
          body: JSON.stringify({ date: day }),
        });
        showNotice("A little win worth celebrating. ✨");
      }
      await loadData();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    }
  }

  function startCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function startEdit(habit: Habit) {
    setEditing(habit);
    setFormOpen(true);
  }

  async function saveHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      category: String(formData.get("category") ?? "OTHER"),
      frequency: String(formData.get("frequency") ?? "DAILY"),
      targetDays: Number(formData.get("targetDays") ?? 7),
      color: String(formData.get("color") ?? "#7c66ad"),
      icon: String(formData.get("icon") ?? "🌱"),
    };
    try {
      await apiRequest<{ habit: Habit }>(
        editing ? `/api/habits/${editing.id}` : "/api/habits",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setFormOpen(false);
      setEditing(null);
      showNotice(editing ? "Habit gently updated." : "A new habit, how lovely.");
      await loadData();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    }
  }

  async function archiveHabit(habit: Habit) {
    try {
      await apiRequest(`/api/habits/${habit.id}/archive`, {
        method: "POST",
        body: JSON.stringify({ isArchived: !habit.isArchived }),
      });
      showNotice(habit.isArchived ? "Habit brought back to your space." : "Habit tucked away for now.");
      await loadData();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    }
  }

  async function deleteHabit(habit: Habit) {
    if (!window.confirm(`Permanently delete “${habit.name}” and its history?`)) {
      return;
    }
    try {
      await apiRequest(`/api/habits/${habit.id}`, { method: "DELETE" });
      showNotice("Habit and its history were removed.");
      await loadData();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    }
  }

  const firstName = user?.name.split(" ")[0] ?? "friend";

  return (
    <>
      {error && (
        <div className="dashboard-alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X size={15} /></button>
        </div>
      )}
      {notice && <div className="toast-message" role="status">{notice}</div>}
      {view === "overview" && (
        <OverviewView
          firstName={firstName}
          habits={activeHabits}
          logs={data.logs}
          stats={data.stats}
          heatmap={data.heatmap}
          completedDates={completedDates}
          completedToday={completedToday}
          progressPercent={progressPercent}
          completedThisWeek={completedThisWeek}
          loading={loading}
          onToggle={toggleCompletion}
          onCreate={startCreate}
        />
      )}
      {view === "habits" && (
        <HabitsView
          habits={data.habits}
          stats={data.stats}
          completedDates={completedDates}
          loading={loading}
          onToggle={toggleCompletion}
          onCreate={startCreate}
          onEdit={startEdit}
          onArchive={archiveHabit}
          onDelete={deleteHabit}
        />
      )}
      {view === "weekly" && (
        <WeeklyView
          habits={activeHabits}
          logs={data.logs}
          cursor={cursor}
          setCursor={setCursor}
          completedDates={completedDates}
          onToggle={toggleCompletion}
        />
      )}
      {view === "insights" && <InsightsView habits={activeHabits} />}
      {view === "stats" && (
        <StatsView
          habits={activeHabits}
          stats={data.stats}
          heatmap={data.heatmap}
          logs={data.logs}
          bestStreak={bestStreak}
          streakDays={streakDays}
        />
      )}
      {formOpen && (
        <HabitDialog
          habit={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={saveHabit}
        />
      )}
    </>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow"><span className="eyebrow-dot" /> {eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function OverviewView({
  firstName,
  habits,
  logs,
  stats,
  heatmap,
  completedDates,
  completedToday,
  progressPercent,
  completedThisWeek,
  loading,
  onToggle,
  onCreate,
}: {
  firstName: string;
  habits: Habit[];
  logs: Log[];
  stats: HabitStat[];
  heatmap: HeatmapDay[];
  completedDates: Set<string>;
  completedToday: number;
  progressPercent: number;
  completedThisWeek: number;
  loading: boolean;
  onToggle: (habit: Habit, day?: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="page-stack">
      <section className="welcome-panel">
        <div className="welcome-decoration">✳</div>
        <div className="welcome-copy">
          <span className="welcome-overline">{prettyDate(new Date(), { weekday: "long", year: "numeric" }).toUpperCase()}</span>
          <h1>Good morning, {firstName}<span className="sun-mark">☀</span></h1>
          <p>Every day is another chance to show up for yourself.</p>
          <div className="welcome-meta"><span className="welcome-dot" /> You’re right where you need to be.</div>
        </div>
        <div className="welcome-progress">
          <div className="welcome-ring" style={{ "--progress": `${progressPercent}%` } as React.CSSProperties}>
            <div className="welcome-ring-inner"><strong>{progressPercent}<small>%</small></strong><span>today</span></div>
          </div>
          <div><strong>{completedToday} of {habits.length}</strong><span>little things done</span></div>
        </div>
      </section>

      <div className="metrics-grid">
        <MetricCard icon={<Target size={17} />} label="This week" value={`${completedThisWeek}`} suffix="check-ins" detail="Little wins, adding up." tone="lavender" />
        <MetricCard icon={<Flame size={17} />} label="Current best" value={`${Math.max(0, ...stats.map((stat) => stat.currentStreak))}`} suffix="day streak" detail="Consistency looks good on you." tone="peach" />
        <MetricCard icon={<Trophy size={17} />} label="Personal best" value={`${Math.max(0, ...stats.map((stat) => stat.longestStreak))}`} suffix="days" detail="Your longest streak so far." tone="mint" />
      </div>

      <div className="content-grid overview-grid">
        <section className="surface-card today-card">
          <div className="card-heading">
            <div><span className="eyebrow"><span className="eyebrow-dot" /> A fresh start</span><h2>Today’s little things</h2></div>
            <span className="date-chip">{prettyDate(new Date(), { weekday: "short", month: "short", day: "numeric" })}</span>
          </div>
          {loading ? <InlineLoader /> : habits.length === 0 ? (
            <EmptyState icon="🌱" title="Start with one small thing" text="Add a habit that makes your day feel a little more like yours." action="Create a habit" onAction={onCreate} />
          ) : (
            <div className="today-habit-list">
              {habits.slice(0, 5).map((habit) => {
                const done = completedDates.has(`${habit.id}:${dateKey(new Date())}`);
                const stat = stats.find((item) => item.habitId === habit.id);
                return (
                  <button type="button" className={`today-habit-row ${done ? "habit-complete" : ""}`} key={habit.id} onClick={() => onToggle(habit)}>
                    <span className="habit-icon-tile" style={{ "--habit-color": habit.color } as React.CSSProperties}>{habit.icon}</span>
                    <span className="today-habit-name"><strong>{habit.name}</strong><small>{categoryLabels[habit.category] ?? "Personal"} · {frequencyLabel(habit.frequency)}</small></span>
                    <span className="today-habit-streak">{stat?.currentStreak ? <><Flame size={14} /> {stat.currentStreak}</> : <span className="streak-soft">A new start</span>}</span>
                    <span className={`check-toggle ${done ? "checked" : ""}`}>{done && <Check size={15} />}</span>
                  </button>
                );
              })}
              {habits.length > 5 && <a className="text-link" href="/dashboard/habits">See all {habits.length} habits <ArrowRight size={14} /></a>}
            </div>
          )}
        </section>

        <section className="surface-card week-card">
          <div className="card-heading">
            <div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR RHYTHM</span><h2>This week, so far</h2></div>
            <a className="icon-link" href="/dashboard/weekly" aria-label="See weekly view"><ArrowUpRight size={18} /></a>
          </div>
          <WeekMiniChart logs={logs} habits={habits} />
          <div className="chart-caption"><span><i className="caption-dot" /> Check-ins</span><span>{completedThisWeek} total this week</span></div>
        </section>
      </div>

      <HeatmapCard data={heatmap} />
      <div className="inspiration-strip"><div className="inspiration-icon"><Heart size={18} /></div><p>You don’t need to see the whole staircase.<br /><strong>Just take the first small step.</strong></p><span>✳</span></div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  suffix,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
  detail: string;
  tone: string;
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-top"><span className="metric-icon">{icon}</span><span>{label}</span><ArrowUpRight size={15} className="metric-arrow" /></div>
      <div className="metric-value">{value}<small>{suffix}</small></div>
      <p>{detail}</p>
    </article>
  );
}

function WeekMiniChart({ logs, habits }: { logs: Log[]; habits: Habit[] }) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => addDays(mondayOf(now), index));
  const counts = days.map((day) => {
    const key = dateKey(day);
    return logs.filter((log) => log.completedDate.slice(0, 10) === key).length;
  });
  const max = Math.max(1, habits.length, ...counts);
  return (
    <div className="mini-chart">
      {days.map((day, index) => (
        <div className={`mini-chart-column ${dateKey(day) === dateKey(now) ? "today-column" : ""}`} key={dateKey(day)} title={`${dayLabel(day)}: ${counts[index]} ${counts[index] === 1 ? "check-in" : "check-ins"}`}>
          <span className="mini-chart-value">{counts[index] || ""}</span>
          <div className="mini-chart-track"><span style={{ height: `${counts[index] === 0 ? 0 : Math.max(7, (counts[index] / max) * 100)}%` }} /></div>
          <small className={dateKey(day) === dateKey(now) ? "today-label" : ""}>{dayLabel(day)}</small>
        </div>
      ))}
    </div>
  );
}

function HeatmapCard({ data }: { data: HeatmapDay[] }) {
  const max = Math.max(1, ...data.map((day) => day.count));
  return (
    <section className="surface-card heatmap-card">
      <div className="card-heading">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> ONE DAY AT A TIME</span><h2>Your consistency garden</h2></div>
        <span className="heatmap-total">{data.reduce((sum, day) => sum + day.count, 0)} check-ins</span>
      </div>
      <p className="card-description">Each little square is a day you showed up for yourself.</p>
      <div className="heatmap-scroll">
        <div className="heatmap-grid">
          {data.map((day) => {
            const level = day.count === 0 ? 0 : Math.min(4, Math.ceil((day.count / max) * 4));
            return <span key={day.date} className={`heatmap-cell heat-${level}`} title={`${day.date}: ${day.count} check-ins`} />;
          })}
        </div>
      </div>
      <div className="heatmap-legend"><span>Just starting</span><i className="heat-0" /><i className="heat-1" /><i className="heat-2" /><i className="heat-3" /><i className="heat-4" /><span>In full bloom</span></div>
    </section>
  );
}

function HabitsView({
  habits,
  stats,
  completedDates,
  loading,
  onToggle,
  onCreate,
  onEdit,
  onArchive,
  onDelete,
}: {
  habits: Habit[];
  stats: HabitStat[];
  completedDates: Set<string>;
  loading: boolean;
  onToggle: (habit: Habit, day?: string) => void;
  onCreate: () => void;
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const filtered = habits.filter((habit) => habit.isArchived === showArchived);
  return (
    <div className="page-stack">
      <PageIntro eyebrow="YOUR PERSONAL GARDEN" title="Little habits, big shifts." description="Tend to the small routines that help you feel more like yourself." action={<button className="button button-dark" onClick={onCreate}><Plus size={16} /> Add a habit</button>} />
      <div className="habit-toolbar">
        <div className="view-tabs"><button className={!showArchived ? "view-tab-active" : ""} onClick={() => setShowArchived(false)}>Growing <span>{habits.filter((habit) => !habit.isArchived).length}</span></button><button className={showArchived ? "view-tab-active" : ""} onClick={() => setShowArchived(true)}>Resting <span>{habits.filter((habit) => habit.isArchived).length}</span></button></div>
        <span className="toolbar-note"><Sparkles size={14} /> No rush. One is enough.</span>
      </div>
      {loading ? <InlineLoader /> : filtered.length === 0 ? (
        <section className="surface-card"><EmptyState icon={showArchived ? "🌙" : "🌱"} title={showArchived ? "Nothing resting right now" : "Your garden is ready"} text={showArchived ? "Habits you pause will show up here." : "Start with one small routine you’d like to make space for."} action={showArchived ? undefined : "Add your first habit"} onAction={onCreate} /></section>
      ) : (
        <div className="habits-grid">
          {filtered.map((habit) => {
            const stat = stats.find((item) => item.habitId === habit.id);
            const done = completedDates.has(`${habit.id}:${dateKey(new Date())}`);
            return (
              <article className={`habit-card ${habit.isArchived ? "archived-card" : ""}`} key={habit.id}>
                <div className="habit-card-top"><span className="habit-icon-large" style={{ "--habit-color": habit.color } as React.CSSProperties}>{habit.icon}</span><div className="habit-card-actions"><button title="Edit habit" onClick={() => onEdit(habit)}><span className="sr-only">Edit</span>···</button><div className="habit-actions-menu"><button onClick={() => onEdit(habit)}>Edit habit</button><button onClick={() => onArchive(habit)}>{habit.isArchived ? "Bring back" : "Let it rest"}</button><button className="danger-action" onClick={() => onDelete(habit)}>Delete</button></div></div></div>
                <span className="habit-category-pill">{categoryLabels[habit.category] ?? "Personal"}</span>
                <h2>{habit.name}</h2>
                <p className="habit-card-description">{habit.description || "A small promise to yourself, one day at a time."}</p>
                <div className="habit-card-meta"><span>{frequencyLabel(habit.frequency)}</span><span>·</span><span>Goal {habit.targetDays} days / week</span></div>
                <div className="habit-card-bottom"><div className="habit-streak"><Flame size={15} /><strong>{stat?.currentStreak ?? 0}</strong><span>day streak</span></div>{!habit.isArchived && <button className={`habit-done-button ${done ? "done" : ""}`} onClick={() => onToggle(habit)}>{done ? <><Check size={14} /> Done</> : "Check in"}</button>}</div>
                {habit.isArchived && <div className="archived-label">Taking a little rest</div>}
              </article>
            );
          })}
        </div>
      )}
      <div className="soft-reminder"><span>✳</span> Habits aren’t about being perfect. They’re about finding your way back.</div>
    </div>
  );
}

function WeeklyView({
  habits,
  logs,
  cursor,
  setCursor,
  completedDates,
  onToggle,
}: {
  habits: Habit[];
  logs: Log[];
  cursor: Date;
  setCursor: (date: Date) => void;
  completedDates: Set<string>;
  onToggle: (habit: Habit, day?: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(cursor, index));
  const today = dateKey(new Date());
  const rangeLabel = `${prettyDate(days[0], { month: "short" })} – ${prettyDate(days[6], { month: "short", day: "numeric", year: "numeric" })}`;
  const done = logs.filter((log) => {
    const key = log.completedDate.slice(0, 10);
    return key >= dateKey(days[0]) && key <= dateKey(days[6]);
  }).length;
  const rate = habits.length ? Math.round((done / (habits.length * 7)) * 100) : 0;

  return (
    <div className="page-stack">
      <PageIntro eyebrow="A WEEK IN YOUR OWN RHYTHM" title="Look how far you’ve come." description="A gentle look at all the little ways you showed up this week." />
      <section className="surface-card week-overview-card">
        <div className="week-controls">
          <div className="week-date-title"><CalendarIcon /> <strong>{rangeLabel}</strong></div>
          <div className="week-nav"><button onClick={() => setCursor(addDays(cursor, -7))} aria-label="Previous week"><ChevronLeft size={17} /></button><button onClick={() => setCursor(mondayOf(new Date()))} className="week-today-button">This week</button><button onClick={() => setCursor(addDays(cursor, 7))} aria-label="Next week" disabled={dateKey(addDays(cursor, 7)) > today}><ChevronRight size={17} /></button></div>
        </div>
        <div className="week-stats-strip"><div><strong>{rate}%</strong><span>your rhythm</span></div><div><strong>{done}</strong><span>little check-ins</span></div><div><strong>{habits.length}</strong><span>habits in bloom</span></div><div className="week-kind-note"><Heart size={15} /> Every step counts.</div></div>
        {habits.length === 0 ? <EmptyState icon="🌱" title="A fresh page" text="Add a habit and your weekly rhythm will begin to take shape." /> : (
          <div className="week-table-wrap">
            <table className="week-table">
              <thead><tr><th>YOUR HABITS</th>{days.map((day) => <th key={dateKey(day)} className={dateKey(day) === today ? "day-is-today" : ""}><span>{dayLabel(day).toUpperCase()}</span><strong>{new Intl.DateTimeFormat("en", { day: "numeric" }).format(day)}</strong></th>)}</tr></thead>
              <tbody>{habits.map((habit) => <tr key={habit.id}><td><span className="week-table-habit-icon">{habit.icon}</span><span>{habit.name}</span></td>{days.map((day) => {const key = dateKey(day); const complete = completedDates.has(`${habit.id}:${key}`); const future = key > today; return <td key={key} className={key === today ? "day-is-today" : ""}><button className={`week-check ${complete ? "week-check-done" : ""}`} disabled={future} onClick={() => onToggle(habit, key)} aria-label={`${complete ? "Unmark" : "Mark"} ${habit.name} ${key}`}>{complete ? <Check size={14} /> : <Circle size={15} />}</button></td>;})}</tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
      <div className="inspiration-strip"><div className="inspiration-icon"><Sparkles size={17} /></div><p>Consistency isn’t about doing it every day.<br /><strong>It’s about coming back when you can.</strong></p><span>✳</span></div>
    </div>
  );
}

function InsightsView({ habits }: { habits: Habit[] }) {
  const [report, setReport] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [suggestions, setSuggestions] = useState<{
    name: string;
    description: string;
    category: string;
    frequency: string;
    icon: string;
    reason: string;
  }[]>([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function generate<T>(key: string, path: string, body?: unknown) {
    setLoading(key);
    setError("");
    try {
      return await apiRequest<T>(path, {
        method: body === undefined ? "GET" : "POST",
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      return null;
    } finally {
      setLoading("");
    }
  }

  async function weeklyReport() {
    const result = await generate<{ content: string }>(
      "weekly",
      "/api/ai/weekly-report",
      {},
    );
    if (result) setReport(result.content);
  }

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await generate<{ content: string }>("/chat", "/api/ai/chat", { question });
    if (result) setAnswer(result.content);
  }

  async function getSuggestions() {
    const result = await generate<{ suggestions: typeof suggestions }>(
      "suggestions",
      "/api/ai/suggest-habits",
      { goals: "Build a calmer, more consistent daily routine." },
    );
    if (result) setSuggestions(result.suggestions);
  }

  async function getMorningMessage() {
    const result = await generate<{ content: string }>("morning", "/api/ai/morning");
    if (result) setAnswer(result.content);
  }

  return (
    <div className="page-stack">
      <PageIntro eyebrow="A KINDER KIND OF CLARITY" title="Little insights, just for you." description="Notice your patterns. Celebrate what’s working. Find a softer way forward." />
      {error && <div className="dashboard-alert" role="alert"><span>{error}</span><button onClick={() => setError("")}><X size={15} /></button></div>}
      <section className="insights-hero">
        <div className="insights-hero-copy"><span className="eyebrow"><span className="eyebrow-dot" /> A NOTE FROM YOUR HABIT COACH</span><h2>A little reflection can go a long way.</h2><p>Your week is full of clues about what helps you thrive. Let’s find a few together.</p><button className="button button-dark" onClick={weeklyReport} disabled={loading !== ""}>{loading === "weekly" ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}{report ? "A fresh weekly reflection" : "Reflect on my week"}<ArrowRight size={15} /></button></div>
        <div className="insights-art"><div className="insight-sun">☀</div><div className="insight-plant"><span>✳</span><span>⌁</span><span>✿</span><i /></div><div className="insight-ground" /></div>
      </section>
      {report && <section className="surface-card generated-note"><div className="generated-heading"><span className="insight-round-icon"><Sparkles size={17} /></span><div><strong>Your week, in reflection</strong><small>A moment to notice how far you’ve come.</small></div><button className="quiet-refresh" onClick={weeklyReport} disabled={loading !== ""}><RefreshCw size={15} className={loading === "weekly" ? "spin" : ""} /> Try again</button></div><p>{report}</p></section>}
      <div className="insight-tool-grid">
        <section className="surface-card insight-tool-card"><span className="insight-round-icon mint-icon"><Sparkles size={17} /></span><span className="eyebrow">A THOUGHTFUL START</span><h3>New habits, made for you.</h3><p>Get three gentle ideas based on the kind of life you’d like to build.</p><button className="text-link" onClick={getSuggestions} disabled={loading !== ""}>{loading === "suggestions" ? "Thinking…" : "Find a few ideas"} <ArrowRight size={14} /></button></section>
        <section className="surface-card insight-tool-card"><span className="insight-round-icon peach-icon"><Heart size={17} /></span><span className="eyebrow">WHEN YOU NEED A RESET</span><h3>A small way back.</h3><p>Choose a habit and get a kind, practical three-day restart plan.</p><select aria-label="Select a habit for a reset plan" id="recovery-habit" defaultValue=""><option value="" disabled>Choose a habit</option>{habits.map((habit) => <option value={habit.id} key={habit.id}>{habit.name}</option>)}</select><button className="text-link" onClick={async () => { const element = document.getElementById("recovery-habit") as HTMLSelectElement | null; if (!element?.value) { setError("Choose a habit first."); return; } const result = await generate<{ content: string }>("recovery", "/api/ai/recovery-plan", { habitId: element.value }); if (result) setAnswer(result.content); }} disabled={loading !== ""}>{loading === "recovery" ? "Making a plan…" : "Build my reset plan"} <ArrowRight size={14} /></button></section>
      </div>
      {suggestions.length > 0 && <section className="surface-card suggestions-result"><div className="card-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> THREE SMALL POSSIBILITIES</span><h2>Ideas for your next chapter</h2></div><button className="quiet-refresh" onClick={getSuggestions}><RefreshCw size={15} /> Refresh</button></div><div className="suggestion-list">{suggestions.map((suggestion) => <article key={suggestion.name} className="suggestion-row"><span>{suggestion.icon}</span><div><strong>{suggestion.name}</strong><p>{suggestion.description}</p><small>{suggestion.reason}</small></div><span className="suggestion-tag">{categoryLabels[suggestion.category] ?? "Personal"}</span></article>)}</div></section>}
      <section className="surface-card chat-card"><div className="chat-card-heading"><span className="insight-round-icon violet-icon"><Sparkles size={17} /></span><div><span className="eyebrow">A SPACE TO WONDER</span><h2>Ask about your habits.</h2><p>A curious question can be the beginning of something good.</p></div></div><form onSubmit={askQuestion} className="chat-question-form"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What would you like to understand?" maxLength={500} required /><button className="button button-dark" disabled={loading !== ""}>{loading === "/chat" ? <LoaderCircle size={15} className="spin" /> : <ArrowRight size={16} />} Ask gently</button></form>{answer && <div className="chat-answer"><Sparkles size={15} /><p>{answer}</p></div>}<div className="sample-questions"><span>Maybe ask:</span><button onClick={() => setQuestion("Which day am I most consistent?")}>Which day am I most consistent?</button><button onClick={() => setQuestion("What helps me keep showing up?")}>What helps me keep showing up?</button></div></section>
      <p className="ai-privacy-note"><Sparkles size={13} /> Your habit patterns are sent securely to the AI coach to generate these reflections.</p>
    </div>
  );
}

function StatsView({
  habits,
  stats,
  heatmap,
  logs,
  bestStreak,
  streakDays,
}: {
  habits: Habit[];
  stats: HabitStat[];
  heatmap: HeatmapDay[];
  logs: Log[];
  bestStreak: number;
  streakDays: number;
}) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthCount = logs.filter((log) => log.completedDate.slice(0, 7) === thisMonth).length;
  const lastMonthCount = logs.filter((log) => {
    const date = new Date();
    date.setUTCMonth(date.getUTCMonth() - 1);
    return log.completedDate.slice(0, 7) === date.toISOString().slice(0, 7);
  }).length;
  const max = Math.max(1, ...stats.map((stat) => stat.completions30d));
  return (
    <div className="page-stack">
      <PageIntro eyebrow="LOOK AT YOU GROW" title="Progress worth noticing." description="Not a scorecard. Just a little proof of all the times you showed up." />
      <div className="stats-summary-grid"><MetricCard icon={<CheckCircle2 size={17} />} label="This month" value={`${monthCount}`} suffix="check-ins" detail="Little wins that added up." tone="lavender" /><MetricCard icon={<TrendingUp size={17} />} label="Last month" value={`${lastMonthCount}`} suffix="check-ins" detail="Every season has its pace." tone="mint" /><MetricCard icon={<Flame size={17} />} label="Best current streak" value={`${streakDays}`} suffix="days" detail="Keep doing what feels good." tone="peach" /><MetricCard icon={<Trophy size={17} />} label="Your longest streak" value={`${bestStreak}`} suffix="days" detail="A lovely thing to remember." tone="butter" /></div>
      <div className="content-grid stats-content-grid">
        <section className="surface-card stats-chart-card"><div className="card-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR HABITS, IN BLOOM</span><h2>A month of little wins</h2></div><span className="date-chip">LAST 30 DAYS</span></div><div className="habit-bars">{stats.map((stat) => <div className="habit-bar-row" key={stat.habitId}><span className="habit-bar-icon">{stat.icon}</span><span className="habit-bar-name">{stat.name}</span><div className="habit-bar-track"><span style={{ width: `${Math.max(2, (stat.completions30d / max) * 100)}%`, background: stat.color }} /></div><strong>{stat.completions30d}<small>/30</small></strong></div>)}</div>{stats.length === 0 && <EmptyState icon="🌱" title="The story starts here" text="Add a habit to see your progress take shape." />}</section>
        <section className="surface-card category-card"><div className="card-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR COLLECTION</span><h2>What you’re tending</h2></div><span className="category-total">{habits.length}</span></div><div className="category-list">{Object.entries(habits.reduce<Record<string, number>>((accumulator, habit) => {accumulator[habit.category] = (accumulator[habit.category] ?? 0) + 1; return accumulator;}, {})).map(([category, count]) => <div className="category-row" key={category}><span className="category-bullet" /><span>{categoryLabels[category] ?? category}</span><strong>{count}</strong></div>)}</div><div className="category-footer"><span>✳</span> Every part of you deserves care.</div></section>
      </div>
      <HeatmapCard data={heatmap} />
      <div className="soft-reminder">Progress isn’t always a straight line. Yours is still beautiful.</div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
  onAction,
}: {
  icon: string;
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{text}</p>{action && <button className="button button-dark button-small" onClick={onAction}><Plus size={14} />{action}</button>}</div>;
}

function InlineLoader() {
  return <div className="inline-loader"><LoaderCircle size={20} className="spin" /><span>Gathering your little wins…</span></div>;
}

function HabitDialog({
  habit,
  onClose,
  onSubmit,
}: {
  habit: Habit | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const initial = habit
    ? {
        name: habit.name,
        description: habit.description,
        category: habit.category,
        frequency: habit.frequency,
        targetDays: habit.targetDays,
        color: habit.color,
        icon: habit.icon,
      }
    : initialForm;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="habit-dialog" role="dialog" aria-modal="true" aria-labelledby="habit-dialog-title">
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        <span className="eyebrow"><span className="eyebrow-dot" /> A LITTLE PROMISE TO YOURSELF</span>
        <h2 id="habit-dialog-title">{habit ? "Tend to this habit." : "Plant a little seed."}</h2>
        <p>Start small. You can always grow from here.</p>
        <form className="habit-form" onSubmit={onSubmit}>
          <label className="form-field"><span>What would you like to do?</span><input name="name" defaultValue={initial.name} placeholder="e.g. Take a morning walk" maxLength={100} required autoFocus /></label>
          <label className="form-field"><span>A little more about it <small>Optional</small></span><textarea name="description" defaultValue={initial.description} placeholder="What makes this habit meaningful to you?" maxLength={1000} rows={2} /></label>
          <div className="form-row">
            <label className="form-field"><span>Part of your life</span><select name="category" defaultValue={initial.category}>{categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="form-field"><span>How often?</span><select name="frequency" defaultValue={initial.frequency}>{frequencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>
          <div className="form-row form-row-small">
            <label className="form-field"><span>Days per week</span><select name="targetDays" defaultValue={initial.targetDays}>{Array.from({ length: 7 }, (_, index) => index + 1).map((day) => <option value={day} key={day}>{day} {day === 1 ? "day" : "days"}</option>)}</select></label>
            <label className="form-field"><span>Little symbol</span><input name="icon" defaultValue={initial.icon} maxLength={16} /></label>
            <label className="form-field color-field"><span>Color</span><input name="color" type="color" defaultValue={initial.color} /></label>
          </div>
          <div className="dialog-actions"><button className="button button-quiet" type="button" onClick={onClose}>Maybe later</button><button className="button button-dark" type="submit">{habit ? "Save this change" : "Plant this habit"} <ArrowRight size={15} /></button></div>
        </form>
      </section>
    </div>
  );
}

function CalendarIcon() {
  return <span className="calendar-icon"><span /><i /></span>;
}

function frequencyLabel(value: string) {
  return frequencyOptions.find((option) => option.value === value)?.label ?? "Every day";
}
