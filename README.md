# Finanzassistent

Ein kleines Web-Programm, das (Schritt f&uuml;r Schritt) zu einem pers&ouml;nlichen
Finanzassistenten f&uuml;r Schulden, Steuern und staatliche Finanzhilfen werden soll &mdash;
mit Regionsauswahl f&uuml;r die Schweiz (Kanton), Deutschland und &Ouml;sterreich (Bundesland).

**Wichtig:** Das ist keine offizielle Steuer-, Rechts- oder Schuldenberatung. Es liefert
Sch&auml;tzungen und Orientierung; bei wichtigen Entscheidungen immer eine offizielle Stelle
kontaktieren (siehe Abschnitt "Hilfe in deiner Region" in der App).

**Privatsph&auml;re:** Es gibt keinen Server und keine Datenbank. Alle Eingaben (Schulden,
Betr&auml;ge usw.) werden nur im Browser der Person gespeichert, die die Seite ge&ouml;ffnet hat
(`localStorage`). Es wird nichts irgendwohin verschickt.

## Aktueller Stand

| Modul | Status |
|---|---|
| Einkommen & Fixkosten (errechnet, was monatlich f&uuml;r Schulden &uuml;brig bleibt, live) | ✅ funktioniert |
| Schuldenplaner (alle Schulden gleichzeitig, Extra-Betrag gleichm&auml;ssig aufgeteilt) | ✅ funktioniert, regionsunabh&auml;ngig |
| Finanzhilfen-Finder (z.B. Erg&auml;nzungsleistungen, Pr&auml;mienverbilligung) | 🔜 als N&auml;chstes geplant |
| Steuer-Helfer (Sch&auml;tzung/Checkliste f&uuml;r die Steuererkl&auml;rung) | 🔜 sp&auml;ter geplant |
| Regionen mit echten Daten hinterlegt | Kanton St. Gallen (Schweiz) |

Der Schuldenplaner geht bewusst **ohne Mindestzahlungen** aus: unbezahlte Rechnungen und
Betreibungen haben meist keine vertragliche Mindestrate wie eine Kreditkarte, man zahlt schlicht
noch nichts darauf. Stattdessen wird der komplette monatlich verf&uuml;gbare Betrag (Einkommen
minus Fixkosten, automatisch berechnet) **gleich auf alle offenen Schulden aufgeteilt** und zahlt
sie parallel ab, statt eine nach der anderen. Sobald eine Schuld fertig ist, wird ihr Anteil auf
die restlichen umverteilt.

Die Regionsauswahl (Land + Kanton/Bundesland) ist schon f&uuml;r alle Kantone der Schweiz sowie
alle Bundesl&auml;nder Deutschlands und &Ouml;sterreichs vorbereitet ("Bald verf&uuml;gbar"), damit sich
neue Regionen sp&auml;ter einfach erg&auml;nzen lassen, ohne die Oberfl&auml;che neu bauen zu m&uuml;ssen.

**Nach einem Update nichts Neues sichtbar?** In `index.html` h&auml;ngt an jeder CSS-/JS-Datei ein
`?v=5`. Diese Zahl wird bei jeder inhaltlichen &Auml;nderung erh&ouml;ht, damit Browser die neue Version
laden statt eine alte, zwischengespeicherte. Falls trotzdem noch die alte Version angezeigt wird:
einmal hart neu laden (`Strg+Umschalt+R` bzw. `Cmd+Umschalt+R`) oder den Tab schliessen und den
Link neu &ouml;ffnen.

## Wie du es &ouml;ffnest (keine Installation n&ouml;tig)

**Am einfachsten:** Datei `index.html` im Ordner doppelklicken &mdash; sie &ouml;ffnet sich im
Standard-Browser. Das reicht f&uuml;r's Ausprobieren.

**Empfohlen (zuverl&auml;ssiger, z.B. f&uuml;r Speichern der Daten):** einen kleinen lokalen
Webserver starten. Daf&uuml;r braucht es kein npm/Node &mdash; nur Python, das auf den meisten
Rechnern schon installiert ist:

```bash
cd SteuernSchuldenVorteile
python3 -m http.server 8000
```

Dann im Browser `http://localhost:8000` &ouml;ffnen. Mit `Strg+C` (bzw. `Cmd+C`) im Terminal
wieder stoppen.

## Damit deine Mutter es &uuml;ber einen Link nutzen kann (GitHub Pages, kostenlos)

1. Diesen Branch/Stand auf den Hauptbranch (`main`) bringen (z.B. den Pull Request mergen, den
   Claude f&uuml;r diese &Auml;nderung erstellt/erstellen kann).
2. Im GitHub-Repository: **Settings → Pages**.
3. Bei "Source" **"Deploy from a branch"** w&auml;hlen, Branch `main`, Ordner `/ (root)`.
4. Speichern. Nach ein bis zwei Minuten ist die Seite unter
   `https://<dein-github-name>.github.io/<repo-name>/` erreichbar &mdash; diesen Link kannst du
   deiner Mutter schicken oder als Lesezeichen einrichten.

Da alle Daten nur lokal im jeweiligen Browser gespeichert werden, ist es kein Problem, wenn die
Seite &ouml;ffentlich erreichbar ist &mdash; niemand ausser ihr sieht ihre Eintr&auml;ge.

## Projektstruktur

```
index.html            Seitenstruktur (HTML)
css/style.css          Aussehen (hell/dunkel, mobilfreundlich)
js/regions.js          Alle L&auml;nder/Kantone/Bundesl&auml;nder + regionale Infos (St. Gallen ausgef&uuml;llt)
js/creditorTypes.js    Gl&auml;ubiger-Typen zur Kategorisierung (Vermieter, Krankenkasse, AHV/IV, ...)
js/storage.js          Speichern/Laden im Browser (localStorage)
js/debtPlanner.js      Die eigentliche Berechnung des Abzahlungsplans
js/chart.js            Einfaches Diagramm (Restschuld &uuml;ber Zeit), ohne externe Bibliothek
js/app.js              Verbindet alles: F&uuml;llt die Seite, reagiert auf Klicks/Eingaben
```

Kein Build-Schritt, kein `npm install`, keine Frameworks &mdash; nur normales HTML/CSS/JavaScript,
das direkt im Browser l&auml;uft. Das hei&szlig;t auch: du kannst jede Datei einzeln &ouml;ffnen und lesen,
ohne etwas kompilieren zu m&uuml;ssen.

## N&auml;chste Schritte (Vorschlag, in dieser Reihenfolge)

1. **Finanzhilfen-Finder f&uuml;r St. Gallen**: ein Fragebogen (Einkommen, Verm&ouml;gen, Miete,
   Familienstand, Alter) → Liste m&ouml;glicher Anspr&uuml;che: Erg&auml;nzungsleistungen (EL) zu AHV/IV,
   individuelle Pr&auml;mienverbilligung (IPV) bei der Krankenkasse, Sozialhilfe, Alimentenbevorschussung
   usw., jeweils mit Link zur zust&auml;ndigen Stelle. Datenquelle: offizielle Merkbl&auml;tter der
   SVA St. Gallen und des Kantons.
2. **Weitere Kantone**: in `js/regions.js` bei einem Kanton einfach `available: true` setzen und
   ein `resources`-Array wie bei St. Gallen erg&auml;nzen.
3. **Steuer-Helfer**: zuerst nur eine Checkliste/Sch&auml;tzung (kein offizielles Ausf&uuml;llen der
   Steuererkl&auml;rung, daf&uuml;r gibt es zertifizierte Software wie eTax SG).
4. **Deutschland/&Ouml;sterreich**: analog zur Schweiz, aber mit eigenen Regeln pro Bundesland.

## Wie du &auml;nderst, was angezeigt wird

- **Texte &auml;ndern:** direkt in `index.html` suchen und anpassen.
- **Neue Region mit Inhalt f&uuml;llen:** in `js/regions.js` beim gew&uuml;nschten Kanton/Bundesland
  `available: true` setzen und ein `resources`-Array nach dem Vorbild von St. Gallen erg&auml;nzen.
- **Rechenlogik &auml;ndern:** in `js/debtPlanner.js`, Funktion `simulate`.

Am einfachsten geht das Weiterentwickeln, indem du Claude Code (dieses Tool) auf diesem
Branch weiter benutzt und einfach beschreibst, was als N&auml;chstes dazukommen soll &mdash; du musst
den Code nicht selbst schreiben.
