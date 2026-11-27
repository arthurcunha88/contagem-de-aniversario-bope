type Birthday = { id: string; day: number; month: number };
type StoredBirthday = { id?: string; day?: number; month?: number; birthDate?: string };

const defaults: readonly Birthday[] = [
  { id: "andre", day: 5, month: 6 },
  { id: "arthur", day: 12, month: 8 },
  { id: "duda", day: 20, month: 11 },
];
const storageKey = "npcpbope:birthday-records:v1";

try {
  const stored: StoredBirthday[] | null = JSON.parse(localStorage.getItem(storageKey) ?? "null");
  const records = defaults.map(({ id, day, month }) =>
    (Array.isArray(stored) && stored.find((member) => member?.id === id && (
      (member.day === day && member.month === month) ||
      (typeof member.birthDate === "string" && member.birthDate.slice(5) ===
        [month, day].map((value) => String(value).padStart(2, "0")).join("-"))
    ))) || { id, day, month },
  );
  localStorage.setItem(storageKey, JSON.stringify(records));
} catch {
  // The countdown still works when browser storage is unavailable.
}

const brasilia = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function timeUntilBirthday(month: number, day: number, now: Date) {
  const current = Object.fromEntries(
    brasilia.formatToParts(now).map(({ type, value }) => [type, Number(value)]),
  );
  if (current.month === month && current.day === day) {
    return { midnight: now.getTime(), progress: 100, digits: null };
  }

  const passed = current.month > month || (current.month === month && current.day > day);
  const targetYear = current.year + Number(passed);
  // Brasília midnight is 03:00 UTC under the current rules.
  const midnight = Date.UTC(targetYear, month - 1, day, 3);
  const seconds = Math.ceil((midnight - now.getTime()) / 1000);
  const previous = Date.UTC(targetYear - 1, month - 1, day, 3);
  const progress = 100 * (now.getTime() - previous) / (midnight - previous);
  const digits = [
    Math.floor(seconds / 86400),
    Math.floor(seconds / 3600) % 24,
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ];
  return { midnight, progress, digits };
}

const cards = defaults.flatMap(({ id, month, day }) => {
  const card = document.querySelector<HTMLElement>(`[data-member="${id}"]`);
  const timer = card?.querySelector<HTMLElement>(".timer");
  const status = card?.querySelector<HTMLElement>(".status");
  if (!card || !timer || !status) return [];
  const badge = document.createElement("span");
  badge.className = "next-birthday";
  badge.textContent = "Próximo aniversário";
  badge.hidden = true;
  card.querySelector(".person")?.prepend(badge);

  const progress = document.createElement("progress");
  progress.className = "year-progress";
  progress.max = 100;
  progress.setAttribute("aria-label", "Progresso do ciclo até o aniversário");
  card.append(progress);
  return [{ month, day, card, timer, digits: [...timer.querySelectorAll("b")], status, badge, progress }];
});

function render() {
  const now = new Date();
  const schedule = cards.map((entry) => ({
    ...entry,
    birthday: timeUntilBirthday(entry.month, entry.day, now),
  }));
  const next = Math.min(...schedule.map(({ birthday }) => birthday.midnight));
  for (const { birthday, card, timer, digits, status, badge, progress } of schedule) {
    const remaining = birthday.digits;
    const celebrating = remaining === null;
    const upcoming = !celebrating && birthday.midnight === next;
    badge.hidden = !upcoming;
    card.classList.toggle("upcoming", upcoming);
    const percent = Math.floor(birthday.progress);
    if (progress.value !== percent) progress.value = percent;
    card.classList.toggle("today", celebrating);
    if (celebrating !== timer.hidden) {
      timer.hidden = celebrating;
      status.hidden = !celebrating;
      status.textContent = celebrating ? "Missão do dia: apagar as velas. Feliz aniversário!" : "";
    }
    remaining?.forEach((number, index) => {
      const digit = digits[index];
      const value = String(number).padStart(2, "0");
      if (digit.textContent === value) return;
      digit.textContent = value;
    });
  }
}

render();
setInterval(render, 1000);
document.addEventListener("visibilitychange", render);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const reveal = document.querySelectorAll<HTMLElement>(".section-head, .card");

if (!reducedMotion.matches && typeof IntersectionObserver === "function") {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("in-view");
      activeObserver.unobserve(entry.target);
    }
  }, { threshold: 0.14 });
  reveal.forEach((element) => observer.observe(element));
}
