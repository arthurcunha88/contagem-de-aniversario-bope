                                                           
                                                                                        

const defaults                      = [...document.querySelectorAll             ("[data-member]")].flatMap((card) => {
  const id = card.dataset.member;
  const date = card.querySelector("time")?.dateTime;
  if (!id || !date) return [];
  const [month, day] = date.split("-").map(Number);
  return [{ id, day, month }];
});
const storageKey = "npcpbope:birthday-records:v1";

try {
  const stored                          = JSON.parse(localStorage.getItem(storageKey) ?? "null");
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

function timeUntilBirthday(month        , day        , now      ) {
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
  const card = document.querySelector             (`[data-member="${id}"]`);
  const timer = card?.querySelector             (".timer");
  const status = card?.querySelector             (".status");
  if (!card || !timer || !status) return [];
  const badge = document.createElement("span");
  badge.className = "next-birthday";
  badge.textContent = "Próximo aniversário";
  badge.hidden = true;
  card.querySelector(".birthday-heading")?.prepend(badge);

  const progress = document.createElement("progress");
  progress.className = "year-progress";
  progress.max = 100;
  progress.setAttribute("aria-label", "Progresso do ciclo até o aniversário");
  card.append(progress);
  const name = card.querySelector("h3")?.textContent ?? "";
  return [{ id, name, month, day, card, timer, digits: [...timer.querySelectorAll("b")], status, badge, progress }];
});

const list = document.querySelector("#birthdays");
const sortButton = document.querySelector                   (".sort-button");
const alphabetical = new Intl.Collator("pt-BR");
let orderedNames = false;
let currentOrder = "";

if (sortButton) {
  sortButton.hidden = false;
  sortButton.addEventListener("click", () => {
    orderedNames = !orderedNames;
    sortButton.setAttribute("aria-pressed", String(orderedNames));
    render();
  });
}

function render() {
  const now = new Date();
  const schedule = cards.map((entry) => ({
    ...entry,
    birthday: timeUntilBirthday(entry.month, entry.day, now),
  }));
  const next = Math.min(...schedule.flatMap(({ birthday }) => birthday.digits ? [birthday.midnight] : []));
  schedule.sort((a, b) => orderedNames ? alphabetical.compare(a.name, b.name) : a.birthday.midnight - b.birthday.midnight);
  const order = schedule.map(({ id }) => id).join(",");
  if (list && order !== currentOrder) {
    for (const { card } of schedule) list.append(card);
    currentOrder = order;
  }
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
const insigniaGrid = document.querySelector(".insignia-grid");
if (insigniaGrid) {
  const badges = Array.from({ length: 40 }, (_, index) => {
    const badge = document.createElement("span");
    badge.className = "insignia";
    badge.dataset.reveal = "";
    badge.style.backgroundPosition = `${(index % 10) * 100 / 9}% ${Math.floor(index / 10) * 100 / 3}%`;
    return badge;
  });
  insigniaGrid.append(...badges);
}
const reveal = document.querySelectorAll             ("[data-reveal]");

if (typeof IntersectionObserver === "function") {
  const directions = new WeakMap                 ();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        directions.set(entry.target, entry.boundingClientRect.top < 0 ? -1 : 1);
      } else if (!reducedMotion.matches) {
        const distance = (directions.get(entry.target) ?? 1) * 21;
        const isInsignia = entry.target.classList.contains("insignia");
        entry.target.animate([
          { opacity: .48, transform: `translateY(${distance}px) scale(.985)` },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ], { duration: 480, delay: isInsignia ? entries.indexOf(entry) % 8 * 26 : 0, easing: "cubic-bezier(.19, 1, .22, 1)", fill: "backwards" });
      }
    }
  }, { threshold: 0.14 });
  reveal.forEach((element) => observer.observe(element));
}

const hero = document.querySelector             (".hero");
let pendingFrame = false;
function updateHero() {
  if (!hero || pendingFrame) return;
  pendingFrame = true;
  requestAnimationFrame(() => {
    pendingFrame = false;
    const offset = reducedMotion.matches ? 0 : Math.min(32, Math.max(0, -hero.getBoundingClientRect().top * .24));
    hero.style.setProperty("--hero-offset", `${offset}px`);
  });
}
window.addEventListener("scroll", updateHero, { passive: true });
reducedMotion.addEventListener("change", updateHero);
updateHero();

const paletteToggle = document.querySelector                   (".palette-toggle");
const paletteLabel = document.querySelector(".palette-label");
const paletteKey = "npcpbope:palette";
function setPalette(night         ) {
  document.documentElement.dataset.palette = night ? "night" : "olive";
  paletteToggle?.setAttribute("aria-pressed", String(night));
  paletteToggle?.setAttribute("aria-label", night ? "Ativar paleta verde" : "Ativar paleta noturna");
  if (paletteLabel) paletteLabel.textContent = night ? "Modo verde" : "Modo noturno";
}
if (paletteToggle) {
  paletteToggle.hidden = false;
  try { setPalette(localStorage.getItem(paletteKey) === "night"); } catch { /* optional preference */ }
  paletteToggle.addEventListener("click", () => {
    const night = document.documentElement.dataset.palette !== "night";
    setPalette(night);
    try { localStorage.setItem(paletteKey, night ? "night" : "olive"); } catch { /* optional preference */ }
  });
}

const signal = document.querySelector                   (".signal");
const reception = document.querySelector(".reception");
if (signal && reception) {
  signal.hidden = false;
  signal.addEventListener("click", () => {
    const active = signal.getAttribute("aria-expanded") !== "true";
    signal.setAttribute("aria-expanded", String(active));
    reception.toggleAttribute("hidden", !active);
  });
}
