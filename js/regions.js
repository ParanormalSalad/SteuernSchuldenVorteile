/*
 * Central place for country / Kanton / Bundesland data.
 * "available: true" on a subdivision means real regional content exists for it
 * (resources, later: tax rules, benefits rules). Everything else is a placeholder
 * so the picker already shows the full list and new regions can be filled in
 * one object at a time without touching the UI code.
 */
const REGIONS = {
  CH: {
    name: "Schweiz",
    subdivisionLabel: "Kanton",
    subdivisions: {
      AG: { name: "Aargau" },
      AI: { name: "Appenzell Innerrhoden" },
      AR: { name: "Appenzell Ausserrhoden" },
      BE: { name: "Bern" },
      BL: { name: "Basel-Landschaft" },
      BS: { name: "Basel-Stadt" },
      FR: { name: "Freiburg" },
      GE: { name: "Genf" },
      GL: { name: "Glarus" },
      GR: { name: "Graubünden" },
      JU: { name: "Jura" },
      LU: { name: "Luzern" },
      NE: { name: "Neuenburg" },
      NW: { name: "Nidwalden" },
      OW: { name: "Obwalden" },
      SG: {
        name: "St. Gallen",
        available: true,
        resources: [
          {
            title: "Budget- und Schuldenberatung der Frauenzentrale St. Gallen",
            note: "Kostenlose, unabhängige Schuldenberatung für den ganzen Kanton.",
            address: "Bleichestrasse 11, 9000 St. Gallen",
            phone: "071 222 22 33",
            email: "schuldenberatung@fzsg.ch",
            url: "https://fzsg.ch/services/budget-und-schuldenberatung/"
          },
          {
            title: "Caritas St. Gallen-Appenzell – Sozial- und Schuldenberatung",
            note: "Regionalstelle St. Gallen, kostenlose Beratung bei Schulden und in finanziellen Notlagen.",
            address: "Langgasse 13, 9008 St. Gallen",
            phone: "071 577 50 10",
            email: "stgallen@caritas-stgallen.ch",
            url: "https://www.caritas-stgallen.ch/"
          },
          {
            title: "hallo.sg.ch – offizielle Anlaufstelle des Kantons",
            note: "Kantonale Informationsseite zu Schulden, Budget und Beratungsangeboten.",
            url: "https://www.hallo.sg.ch/de/arbeit-finanzen/schulden-budget.html"
          },
          {
            title: "SVA St. Gallen – Ergänzungsleistungen (EL) zu AHV/IV",
            note: "Zuständige Stelle für Ergänzungsleistungen, Merkblätter und Berechnungstool.",
            url: "https://www.svasg.ch/produkte/el/"
          },
          {
            title: "Informationsstelle AHV/IV – kantonale EL-Stellen Schweiz",
            note: "Übersicht der zuständigen Stellen für Ergänzungsleistungen in jedem Kanton.",
            url: "https://www.ahv-iv.ch/de/Kontakte/Kantonale-Stellen-f%C3%BCr-Erg%C3%A4nzungsleistungen-%C3%9Cberbr%C3%BCckungsleistungen"
          }
        ]
      },
      SH: { name: "Schaffhausen" },
      SO: { name: "Solothurn" },
      SZ: { name: "Schwyz" },
      TG: { name: "Thurgau" },
      TI: { name: "Tessin" },
      UR: { name: "Uri" },
      VD: { name: "Waadt" },
      VS: { name: "Wallis" },
      ZG: { name: "Zug" },
      ZH: { name: "Zürich" }
    }
  },
  DE: {
    name: "Deutschland",
    subdivisionLabel: "Bundesland",
    subdivisions: {
      BW: { name: "Baden-Württemberg" },
      BY: { name: "Bayern" },
      BE: { name: "Berlin" },
      BB: { name: "Brandenburg" },
      HB: { name: "Bremen" },
      HH: { name: "Hamburg" },
      HE: { name: "Hessen" },
      MV: { name: "Mecklenburg-Vorpommern" },
      NI: { name: "Niedersachsen" },
      NW: { name: "Nordrhein-Westfalen" },
      RP: { name: "Rheinland-Pfalz" },
      SL: { name: "Saarland" },
      SN: { name: "Sachsen" },
      ST: { name: "Sachsen-Anhalt" },
      SH: { name: "Schleswig-Holstein" },
      TH: { name: "Thüringen" }
    }
  },
  AT: {
    name: "Österreich",
    subdivisionLabel: "Bundesland",
    subdivisions: {
      B: { name: "Burgenland" },
      K: { name: "Kärnten" },
      N: { name: "Niederösterreich" },
      O: { name: "Oberösterreich" },
      S: { name: "Salzburg" },
      ST: { name: "Steiermark" },
      T: { name: "Tirol" },
      V: { name: "Vorarlberg" },
      W: { name: "Wien" }
    }
  }
};
