type Birthday = { id: string; day: number; month: number };
type StoredBirthday = { id?: string; day?: number; month?: number; birthDate?: string };

const defaults: readonly Birthday[] = [...document.querySelectorAll<HTMLElement>("[data-member]")].flatMap((card) => {
  const id = card.dataset.member;
  const date = card.querySelector("time")?.dateTime;
  if (!id || !date) return [];
  const [month, day] = date.split("-").map(Number);
  return [{ id, day, month }];
});
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
const sort = document.querySelector<HTMLSelectElement>(".sort-select");
const alphabetical = new Intl.Collator("pt-BR");
let currentOrder = "";
const filters = document.querySelector<HTMLElement>(".agenda-filters");
const filterButtons = [...document.querySelectorAll<HTMLButtonElement>(".agenda-filter")];
const filterResult = document.querySelector<HTMLElement>(".filter-result");
let activeFilter = "all";

if (filters) filters.hidden = false;
for (const button of filterButtons) {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter ?? "all";
    for (const option of filterButtons) {
      option.setAttribute("aria-pressed", String(option === button));
    }
    render();
  });
}

if (sort) {
  sort.closest("label")?.removeAttribute("hidden");
  sort.addEventListener("change", render);
}

function render() {
  const now = new Date();
  const schedule = cards.map((entry) => ({
    ...entry,
    birthday: timeUntilBirthday(entry.month, entry.day, now),
  }));
  const next = Math.min(...schedule.flatMap(({ birthday }) => birthday.digits ? [birthday.midnight] : []));
  schedule.sort((a, b) => sort?.value === "alphabetical" ? alphabetical.compare(a.name, b.name) : a.birthday.midnight - b.birthday.midnight);
  const order = schedule.map(({ id }) => id).join(",");
  if (list && order !== currentOrder) {
    const founder = schedule.find(({ id }) => id === "arthur");
    if (founder) list.append(founder.card);
    for (const { id, card } of schedule) {
      if (id !== "arthur") list.append(card);
    }
    currentOrder = order;
  }
  let visible = 0;
  for (const { birthday, card, timer, digits, status, badge, progress } of schedule) {
    const withinThirtyDays = birthday.midnight - now.getTime() <= 30 * 86400000;
    const featured = card.classList.contains("leadership") || card.classList.contains("founder") || card.dataset.affiliation === "DEX";
    const matches = activeFilter === "all" || (activeFilter === "soon" && withinThirtyDays) ||
      (activeFilter === "featured" && featured);
    card.hidden = !matches;
    if (matches) visible += 1;
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
  if (filterResult) {
    filterResult.hidden = activeFilter === "all";
    const message = visible === 0 ? "Nenhum aniversário nos próximos 30 dias." :
      `${visible} ${visible === 1 ? "perfil" : "perfis"} na seleção.`;
    if (filterResult.textContent !== message) filterResult.textContent = message;
  }
}

render();
setInterval(render, 1000);
document.addEventListener("visibilitychange", render);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const reveal = document.querySelectorAll<HTMLElement>("[data-reveal]");

if (typeof IntersectionObserver === "function") {
  const directions = new WeakMap<Element, number>();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        directions.set(entry.target, entry.boundingClientRect.top < 0 ? -1 : 1);
      } else if (!reducedMotion.matches) {
        const distance = (directions.get(entry.target) ?? 1) * 21;
        entry.target.animate([
          { opacity: .48, transform: `translateY(${distance}px) scale(.985)` },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ], { duration: 480, easing: "cubic-bezier(.19, 1, .22, 1)", fill: "backwards" });
      }
    }
  }, { threshold: 0.14 });
  reveal.forEach((element) => observer.observe(element));
}

const hero = document.querySelector<HTMLElement>(".hero");
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

const signal = document.querySelector<HTMLButtonElement>(".signal");
const reception = document.querySelector(".reception");
if (signal && reception) {
  signal.hidden = false;
  signal.addEventListener("click", () => {
    const active = signal.getAttribute("aria-expanded") !== "true";
    signal.setAttribute("aria-expanded", String(active));
    reception.toggleAttribute("hidden", !active);
  });
}

const profile = document.querySelector<HTMLDialogElement>(".member-dialog");
const profileName = profile?.querySelector("#member-name");
const profileDate = profile?.querySelector<HTMLTimeElement>(".member-date time");
const profileRole = profile?.querySelector(".member-role");
const profilePortrait = profile?.querySelector<HTMLElement>(".member-portrait");
if (profile && profileName && profileDate && profileRole && profilePortrait && typeof profile.showModal === "function") {
  for (const { card, name } of cards) {
    const button = document.createElement("button");
    button.className = "open-profile";
    button.type = "button";
    button.textContent = "Ver perfil";
    button.setAttribute("aria-label", `Ver perfil de ${name}`);
    button.setAttribute("aria-haspopup", "dialog");
    card.querySelector(".birthday-heading")?.append(button);
    button.addEventListener("click", () => {
      profileName.textContent = card.dataset.fullName || name;
      const date = card.querySelector("time");
      profileDate.textContent = date?.textContent ?? "";
      profileDate.dateTime = date?.dateTime ?? "";
      const founder = card.classList.contains("founder");
      profileRole.textContent = card.dataset.profileRole ?? (founder ? "Criador do site · CEO da operação" : "Perfil do membro");
      profile.classList.toggle("leadership-profile", card.classList.contains("leadership"));
      profilePortrait.classList.toggle("founder-portrait", founder);
      for (const property of ["--portrait-position", "--portrait-hue"]) {
        profilePortrait.style.setProperty(property, card.style.getPropertyValue(property));
      }
      profile.showModal();
    });
  }
  profile.addEventListener("click", (event) => {
    if (event.target === profile) profile.close();
  });
}
