(function () {
  let debts = Storage.loadDebts();
  const settings = Object.assign({ country: "CH", subdivision: "SG" }, Storage.loadSettings());

  const countrySelect = document.getElementById("country-select");
  const subdivisionSelect = document.getElementById("subdivision-select");
  const subdivisionLabel = document.getElementById("subdivision-label");
  const regionStatus = document.getElementById("region-status");
  const resourcesContent = document.getElementById("resources-content");
  const debtTableBody = document.getElementById("debt-table-body");
  const extraPaymentInput = document.getElementById("extra-payment");
  const resultsEl = document.getElementById("results");

  let nextDebtId = debts.reduce((max, d) => Math.max(max, d.id), 0) + 1;

  function init() {
    Object.keys(REGIONS).forEach((code) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = REGIONS[code].name;
      countrySelect.appendChild(opt);
    });
    countrySelect.value = settings.country;
    populateSubdivisions();

    countrySelect.addEventListener("change", () => {
      settings.country = countrySelect.value;
      settings.subdivision = Object.keys(REGIONS[settings.country].subdivisions)[0];
      Storage.saveSettings(settings);
      populateSubdivisions();
      renderResources();
    });
    subdivisionSelect.addEventListener("change", () => {
      settings.subdivision = subdivisionSelect.value;
      Storage.saveSettings(settings);
      renderResources();
    });

    document.getElementById("add-debt-btn").addEventListener("click", addDebtRow);
    document.getElementById("calculate-btn").addEventListener("click", calculate);

    if (extraPaymentInput.value === "0" && settings.extraPayment) {
      extraPaymentInput.value = settings.extraPayment;
    }
    extraPaymentInput.addEventListener("change", () => {
      settings.extraPayment = extraPaymentInput.value;
      Storage.saveSettings(settings);
    });
    if (settings.strategy) {
      const radio = document.querySelector(`input[name="strategy"][value="${settings.strategy}"]`);
      if (radio) radio.checked = true;
    }
    document.querySelectorAll('input[name="strategy"]').forEach((r) => {
      r.addEventListener("change", () => {
        settings.strategy = document.querySelector('input[name="strategy"]:checked').value;
        Storage.saveSettings(settings);
      });
    });

    renderDebtTable();
    renderResources();
  }

  function populateSubdivisions() {
    const region = REGIONS[settings.country];
    subdivisionLabel.textContent = region.subdivisionLabel;
    subdivisionSelect.innerHTML = "";
    Object.entries(region.subdivisions).forEach(([code, sub]) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = sub.name;
      subdivisionSelect.appendChild(opt);
    });
    if (region.subdivisions[settings.subdivision]) {
      subdivisionSelect.value = settings.subdivision;
    } else {
      settings.subdivision = subdivisionSelect.value;
    }
    regionStatus.textContent =
      "Der Schuldenplaner funktioniert unabhängig von der Region. Finanzhilfen-Finder und Steuer-Helfer sind bisher nur für St. Gallen (Schweiz) vorbereitet und folgen als Nächstes.";
  }

  function renderResources() {
    const region = REGIONS[settings.country];
    const sub = region.subdivisions[settings.subdivision];
    resourcesContent.innerHTML = "";

    if (!sub || !sub.available) {
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent = `Für ${sub ? sub.name : ""} sind noch keine regionalen Informationen hinterlegt. Bisher ist nur der Kanton St. Gallen (Schweiz) ausgefüllt.`;
      resourcesContent.appendChild(p);
      return;
    }

    sub.resources.forEach((r) => {
      const div = document.createElement("div");
      div.className = "resource-item";
      const h3 = document.createElement("h3");
      h3.textContent = r.title;
      div.appendChild(h3);
      if (r.note) div.appendChild(makeP(r.note));
      if (r.address) div.appendChild(makeP(r.address));
      if (r.phone) div.appendChild(makeP("Telefon: " + r.phone));
      if (r.email) div.appendChild(makeP("E-Mail: " + r.email));
      if (r.url) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = r.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = r.url;
        p.appendChild(a);
        div.appendChild(p);
      }
      resourcesContent.appendChild(div);
    });
  }

  function makeP(text) {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  }

  function addDebtRow() {
    debts.push({ id: nextDebtId++, name: "", balance: "", apr: "", minPayment: "" });
    persistDebts();
    renderDebtTable();
  }

  function removeDebtRow(id) {
    debts = debts.filter((d) => d.id !== id);
    persistDebts();
    renderDebtTable();
  }

  function persistDebts() {
    Storage.saveDebts(debts);
  }

  function renderDebtTable() {
    debtTableBody.innerHTML = "";
    if (debts.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "empty-state";
      td.textContent = "Noch keine Schulden erfasst. Füge unten die erste Schuld hinzu.";
      tr.appendChild(td);
      debtTableBody.appendChild(tr);
      return;
    }

    debts.forEach((debt) => {
      const tr = document.createElement("tr");
      tr.appendChild(makeInputCell(debt, "name", "text", "z.B. Kreditkarte"));
      tr.appendChild(makeInputCell(debt, "balance", "number", "0"));
      tr.appendChild(makeInputCell(debt, "apr", "number", "0"));
      tr.appendChild(makeInputCell(debt, "minPayment", "number", "0"));

      const actionTd = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "remove-row-btn";
      btn.textContent = "✕";
      btn.title = "Entfernen";
      btn.addEventListener("click", () => removeDebtRow(debt.id));
      actionTd.appendChild(btn);
      tr.appendChild(actionTd);

      debtTableBody.appendChild(tr);
    });
  }

  function makeInputCell(debt, field, type, placeholder) {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = type;
    if (type === "number") {
      input.min = "0";
      input.step = field === "apr" ? "0.1" : "10";
    }
    input.placeholder = placeholder;
    input.value = debt[field];
    input.addEventListener("input", () => {
      debt[field] = input.value;
      persistDebts();
    });
    td.appendChild(input);
    return td;
  }

  function calculate() {
    const validDebts = debts
      .filter((d) => d.name && Number(d.balance) > 0)
      .map((d) => ({ id: d.id, name: d.name, balance: Number(d.balance), apr: Number(d.apr) || 0, minPayment: Number(d.minPayment) || 0 }));

    resultsEl.innerHTML = "";

    if (validDebts.length === 0) {
      resultsEl.innerHTML = '<p class="empty-state">Bitte mindestens eine Schuld mit Bezeichnung und Restschuld eingeben.</p>';
      return;
    }

    const extra = Number(extraPaymentInput.value) || 0;
    const strategy = document.querySelector('input[name="strategy"]:checked').value;
    const result = DebtPlanner.simulate(validDebts, extra, strategy);

    if (!result.feasible) {
      const warn = document.createElement("div");
      warn.className = "warning-box";
      warn.textContent =
        "Mit diesen Angaben ist die Schuld auch nach 50 Jahren nicht abbezahlt – die Zinsen wächst schneller, als bezahlt wird. Erhöhe den monatlichen Zusatzbetrag oder wende dich an eine Schuldenberatung (siehe unten).";
      resultsEl.appendChild(warn);
      return;
    }

    const years = (result.totalMonths / 12).toFixed(1);
    const summary = document.createElement("div");
    summary.className = "summary-cards";
    summary.innerHTML = `
      <div class="summary-card"><div class="value">${result.totalMonths} Monate</div><div class="label">bis schuldenfrei (${years} Jahre)</div></div>
      <div class="summary-card"><div class="value">${formatChf(result.totalInterestPaid)}</div><div class="label">bezahlte Zinsen insgesamt</div></div>
      <div class="summary-card"><div class="value">${validDebts.length}</div><div class="label">Schulden erfasst</div></div>
    `;
    resultsEl.appendChild(summary);

    const canvas = document.createElement("canvas");
    canvas.id = "balance-chart";
    resultsEl.appendChild(canvas);
    Chart.drawBalanceHistory(canvas, result.balanceHistory);

    const orderTitle = document.createElement("h3");
    orderTitle.textContent = "Abzahlungsreihenfolge";
    resultsEl.appendChild(orderTitle);

    const list = document.createElement("ol");
    list.className = "payoff-order-list";
    result.order.forEach((entry) => {
      const li = document.createElement("li");
      const monthsToPayoff = entry.payoffMonth;
      li.textContent = `${entry.name} – schuldenfrei nach ${monthsToPayoff} Monaten (Zinsen: ${formatChf(entry.interestPaid)})`;
      list.appendChild(li);
    });
    resultsEl.appendChild(list);
  }

  function formatChf(v) {
    return "CHF " + Math.round(v).toLocaleString("de-CH");
  }

  init();
})();
