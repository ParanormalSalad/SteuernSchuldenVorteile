/*
 * Creditor types for categorizing each debt (shown as a dropdown next
 * to it), plus a rough urgency ranking for the "Dringlichkeit im
 * Vergleich" info panel. urgency is a plain rank (higher = more
 * urgent) based on typical Swiss collection practice and what's at
 * stake -- not the interest rate, and it never changes the payoff
 * math (every debt still gets an equal share every month). This is
 * general orientation, not legal advice: real urgency always depends
 * on the individual situation (existing Zahlungsbefehl, Verlustschein,
 * payment agreements, etc.) -- when housing or insurance coverage is
 * at risk, a Schuldenberatung should be involved.
 */
const CREDITOR_TYPES = [
  {
    id: "miete",
    label: "Vermieter",
    urgency: 5,
    reason: "Zahlungsrückstand kann zur fristlosen Kündigung der Wohnung führen."
  },
  {
    id: "krankenkasse",
    label: "Krankenkasse",
    urgency: 5,
    reason: "Unbezahlte Prämien werden meist rasch in Betreibung gesetzt; Grundversicherung darf zwar nicht gekündigt werden, aber Leistungen können bei Verlustschein sistiert werden."
  },
  {
    id: "ahv",
    label: "AHV / IV",
    urgency: 4,
    reason: "Ausgleichskassen betreiben Beitragsschulden meist sehr schnell und konsequent, bis hin zur Lohnpfändung."
  },
  {
    id: "steuern",
    label: "Steueramt",
    urgency: 4,
    reason: "Steuerämter können ebenfalls zügig betreiben; unbezahlte Steuern verursachen zudem Verzugszinsen."
  },
  {
    id: "kredit",
    label: "Kreditkarte / Kredit",
    urgency: 2,
    reason: "Meist teuer wegen hoher Zinsen, aber rechtlich in der Regel weniger dringlich als Miete, Krankenkasse, AHV oder Steuern."
  },
  {
    id: "privat",
    label: "Privatperson / Sonstige",
    urgency: 1,
    reason: "Dringlichkeit hängt stark vom Einzelfall ab; im Zweifel niedrig priorisiert, ausser eine Betreibung läuft bereits."
  }
];

const CREDITOR_TYPE_BY_ID = Object.fromEntries(CREDITOR_TYPES.map((c) => [c.id, c]));
const DEFAULT_CREDITOR_TYPE = "privat";

function urgencyLabel(urgency) {
  if (urgency >= 5) return "Sehr dringlich";
  if (urgency >= 4) return "Dringlich";
  if (urgency >= 2) return "Weniger dringlich";
  return "Am wenigsten dringlich";
}
