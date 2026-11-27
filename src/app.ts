type Birthday = { id: string; day: number; month: number };
type StoredBirthday = { id?: string; day?: number; month?: number; birthDate?: string };

const defaults: readonly Birthday[] = [
  { id: "arthur", day: 12, month: 8 },
  { id: "duda", day: 20, month: 11 },
];
const storageKey = "npcpbope:birthday-records:v1";

try {
  const stored: StoredBirthday[] | null = JSON.parse(localStorage.getItem(storageKey) ?? "null");
  const compatible = Array.isArray(stored) && defaults.every(({ id, day, month }) =>
    stored.some((member) => member?.id === id && (
      (member.day === day && member.month === month) ||
      (typeof member.birthDate === "string" && member.birthDate.slice(5) ===
        [month, day].map((value) => String(value).padStart(2, "0")).join("-"))
    )),
  );
  if (!compatible) {
    localStorage.setItem(storageKey, JSON.stringify(defaults));
  }
} catch {
  // The countdown still works when browser storage is unavailable.
}

const brasilia = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function timeUntilBirthday(month: number, day: number, now: Date): number[] | null {
  const current = Object.fromEntries(
    brasilia.formatToParts(now).map(({ type, value }) => [type, Number(value)]),
  );
  if (current.month === month && current.day === day) return null;

  const passed = current.month > month || (current.month === month && current.day > day);
  const targetYear = current.year + Number(passed);
  // Brasília midnight for the August and November dates is 03:00 UTC.
  const midnight = Date.UTC(targetYear, month - 1, day, 3);
  const seconds = Math.ceil((midnight - now.getTime()) / 1000);
  return [
    Math.floor(seconds / 86400),
    Math.floor(seconds / 3600) % 24,
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ];
}

const cards = defaults.flatMap(({ id, month, day }) => {
  const card = document.querySelector<HTMLElement>(`[data-member="${id}"]`);
  const timer = card?.querySelector<HTMLElement>(".timer");
  const status = card?.querySelector<HTMLElement>(".status");
  if (!card || !timer || !status) return [];
  return [{ month, day, card, timer, digits: [...timer.querySelectorAll("b")], status }];
});

function render() {
  const now = new Date();
  for (const { month, day, card, timer, digits, status } of cards) {
    const remaining = timeUntilBirthday(month, day, now);
    const celebrating = remaining === null;
    card.classList.toggle("today", celebrating);
    if (celebrating !== timer.hidden) {
      timer.hidden = celebrating;
      status.textContent = celebrating ? "Feliz aniversário!" : "Contagem regressiva";
    }
    remaining?.forEach((number, index) => {
      const digit = digits[index];
      const value = String(number).padStart(2, "0");
      if (digit.textContent === value) return;
      digit.classList.remove("tick");
      digit.textContent = value;
      requestAnimationFrame(() => digit.classList.add("tick"));
    });
  }
}

render();
setInterval(render, 1000);
document.addEventListener("visibilitychange", render);
