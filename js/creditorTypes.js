/*
 * Creditor types for categorizing each debt (shown as a dropdown next
 * to it). Purely informational -- doesn't affect the payoff math.
 */
const CREDITOR_TYPES = [
  { id: "miete", label: "Vermieter" },
  { id: "krankenkasse", label: "Krankenkasse" },
  { id: "ahv", label: "AHV / IV" },
  { id: "steuern", label: "Steueramt" },
  { id: "kredit", label: "Kreditkarte / Kredit" },
  { id: "privat", label: "Privatperson / Sonstige" }
];

const DEFAULT_CREDITOR_TYPE = "privat";
