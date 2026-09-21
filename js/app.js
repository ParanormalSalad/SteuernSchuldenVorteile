(function () {
  // populated by startApp() once a profile is chosen -- nothing below
  // this point touches Storage before that happens
  let debts, income, fixedCosts, settings, nextDebtId, nextIncomeId, nextFixedCostId;

  // tracks the value we last set extra-payment to automatically, so we can
  // tell "still following the computed maximum" apart from "user typed
  // their own amount" without a separate flag
  let lastAutoExtra = null;

  const countrySelect = document.getElementById("country-select");
  const subdivisionSelect = document.getElementById("subdivision-select");
  const subdivisionLabel = document.getElementById("subdivision-label");
  const regionStatus = document.getElementById("region-status");
  const resourcesContent = document.getElementById("resources-content");
  const debtTableBody = document.getElementById("debt-table-body");
  const incomeTableBody = document.getElementById("income-table-body");
  const fixedCostsTableBody = document.getElementById("fixed-costs-table-body");
  const budgetSummaryEl = document.getElementById("budget-summary");
  const extraPaymentInput = document.getElementById("extra-payment");
  const extraPaymentSuggestion = document.getElementById("extra-payment-suggestion");
  const resultsEl = document.getElementById("results");

  function startApp(profileId) {
    Storage.setProfile(profileId);
    debts = Storage.loadDebts();
    income = Storage.loadIncome();
    fixedCosts = Storage.loadFixedCosts();
    settings = Object.assign({ country: "CH", subdivision: "SG" }, Storage.loadSettings());
    nextDebtId = debts.reduce((max, d) => Math.max(max, d.id), 0) + 1;
    nextIncomeId = income.reduce((max, d) => Math.max(max, d.id), 0) + 1;
    nextFixedCostId = fixedCosts.reduce((max, d) => Math.max(max, d.id), 0) + 1;
    init();
  }

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
    document.getElementById("add-income-btn").addEventListener("click", addIncomeRow);
    document.getElementById("add-fixed-cost-btn").addEventListener("click", addFixedCostRow);
    document.getElementById("calculate-btn").addEventListener("click", calculate);

    if (extraPaymentInput.value === "0" && settings.extraPayment) {
      extraPaymentInput.value = settings.extraPayment;
    }
    extraPaymentInput.addEventListener("change", () => {
      settings.extraPayment = extraPaymentInput.value;
      Storage.saveSettings(settings);
      calculate();
    });

    // start every list with one blank, ready-to-type row instead of an
    // empty table with nothing to click into
    if (debts.length === 0) addDebtRow();
    else renderDebtTable();
    if (income.length === 0) addIncomeRow();
    else renderIncomeTable();
    if (fixedCosts.length === 0) addFixedCostRow();
    else renderFixedCostsTable();

    renderBudgetSummary();
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

  // ---- Debts ----

  function addDebtRow() {
    debts.push({ id: nextDebtId++, name: "", balance: "", apr: "", creditorType: DEFAULT_CREDITOR_TYPE });
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
    renderBudgetSummary();
  }

  function renderDebtTable() {
    debtTableBody.innerHTML = "";
    if (debts.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "empty-state";
      td.textContent = "Noch keine Schulden erfasst. Klicke auf «Schuld hinzufügen».";
      tr.appendChild(td);
      debtTableBody.appendChild(tr);
      return;
    }

    debts.forEach((debt) => {
      const tr = document.createElement("tr");
      tr.appendChild(makeInputCell(debt, "name", "text", "z.B. Kreditkarte", persistDebts));
      tr.appendChild(makeCreditorTypeCell(debt));
      tr.appendChild(makeInputCell(debt, "balance", "number", "0", persistDebts));
      tr.appendChild(makeInputCell(debt, "apr", "number", "0", persistDebts));
      tr.appendChild(makeRemoveCell(() => removeDebtRow(debt.id)));
      debtTableBody.appendChild(tr);
    });
  }

  function makeCreditorTypeCell(debt) {
    const td = document.createElement("td");
    const select = document.createElement("select");
    CREDITOR_TYPES.forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type.id;
      opt.textContent = type.label;
      select.appendChild(opt);
    });
    select.value = debt.creditorType || DEFAULT_CREDITOR_TYPE;
    select.addEventListener("change", () => {
      debt.creditorType = select.value;
      persistDebts();
    });
    td.appendChild(select);
    return td;
  }

  // ---- Income & fixed costs (share the same {id, name, amount} shape) ----

  function addIncomeRow() {
    income.push({ id: nextIncomeId++, name: "", amount: "" });
    persistIncome();
    renderIncomeTable();
  }

  function removeIncomeRow(id) {
    income = income.filter((d) => d.id !== id);
    persistIncome();
    renderIncomeTable();
  }

  function persistIncome() {
    Storage.saveIncome(income);
    renderBudgetSummary();
  }

  function renderIncomeTable() {
    renderAmountTable(incomeTableBody, income, "Noch kein Einkommen erfasst. Klicke auf «Einkommen hinzufügen».", "z.B. Lohn, AHV-Rente", persistIncome, removeIncomeRow);
  }

  function addFixedCostRow() {
    fixedCosts.push({ id: nextFixedCostId++, name: "", amount: "" });
    persistFixedCosts();
    renderFixedCostsTable();
  }

  function removeFixedCostRow(id) {
    fixedCosts = fixedCosts.filter((d) => d.id !== id);
    persistFixedCosts();
    renderFixedCostsTable();
  }

  function persistFixedCosts() {
    Storage.saveFixedCosts(fixedCosts);
    renderBudgetSummary();
  }

  function renderFixedCostsTable() {
    renderAmountTable(fixedCostsTableBody, fixedCosts, "Noch keine Fixkosten erfasst. Klicke auf «Fixkosten hinzufügen».", "z.B. Miete, Krankenkasse, Strom", persistFixedCosts, removeFixedCostRow);
  }

  function renderAmountTable(tbody, items, emptyText, placeholder, onChange, onRemove) {
    tbody.innerHTML = "";
    if (items.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.className = "empty-state";
      td.textContent = emptyText;
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.appendChild(makeInputCell(item, "name", "text", placeholder, onChange));
      tr.appendChild(makeInputCell(item, "amount", "number", "0", onChange));
      tr.appendChild(makeRemoveCell(() => onRemove(item.id)));
      tbody.appendChild(tr);
    });
  }

  function makeInputCell(item, field, type, placeholder, onChange) {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = type;
    if (type === "number") {
      input.min = "0";
      input.step = field === "apr" ? "0.1" : "10";
    }
    input.placeholder = placeholder;
    input.value = item[field];
    input.addEventListener("input", () => {
      item[field] = input.value;
      onChange();
    });
    td.appendChild(input);
    return td;
  }

  function makeRemoveCell(onRemove) {
    const td = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "remove-row-btn";
    btn.textContent = "✕";
    btn.title = "Entfernen";
    btn.addEventListener("click", onRemove);
    td.appendChild(btn);
    return td;
  }

  // ---- Budget summary ----

  function sumAmounts(items) {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }

  function computeAvailableForDebt() {
    return sumAmounts(income) - sumAmounts(fixedCosts);
  }

  function renderBudgetSummary() {
    const totalIncome = sumAmounts(income);
    const totalFixedCosts = sumAmounts(fixedCosts);
    const available = computeAvailableForDebt();
    const maxExtra = Math.max(0, Math.round(available));

    budgetSummaryEl.innerHTML = `
      <div class="budget-line"><span>Einkommen</span><span>${formatChf(totalIncome)}</span></div>
      <div class="budget-line"><span>Fixkosten</span><span>&minus; ${formatChf(totalFixedCosts)}</span></div>
      <div class="budget-line total ${available < 0 ? "negative" : ""}">
        <span>${available < 0 ? "Fehlbetrag" : "Betrag, der jeden Monat für deine Schulden verfügbar ist"}</span>
        <span>${formatChf(available)}</span>
      </div>
      ${available < 0 ? '<p class="urgency-reason">Deine Fixkosten übersteigen dein Einkommen. Wende dich möglichst bald an eine Schuldenberatung (siehe unten) – ggf. gibt es Anspruch auf staatliche Unterstützung.</p>' : ""}
    `;

    const hasDebt = debts.some((d) => d.name && Number(d.balance) > 0);

    // keep the extra-payment field following the computed maximum
    // automatically, unless the person typed their own amount in --
    // that's what makes the plan below update itself live
    const current = extraPaymentInput.value.trim();
    const followingMax = current === "" || current === "0" || Number(current) === lastAutoExtra;
    if (followingMax && maxExtra !== Number(current)) {
      extraPaymentInput.value = maxExtra;
      lastAutoExtra = maxExtra;
      settings.extraPayment = String(maxExtra);
      Storage.saveSettings(settings);
    }

    if (available > 0 && hasDebt) {
      const jumpBtn = document.createElement("button");
      jumpBtn.type = "button";
      jumpBtn.className = "primary-btn";
      jumpBtn.textContent = `Zu meinem Zahlungsplan springen (${formatChf(maxExtra)} / Monat) ↓`;
      jumpBtn.addEventListener("click", () => {
        resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      budgetSummaryEl.appendChild(jumpBtn);
    }

    extraPaymentSuggestion.innerHTML = "";
    if (income.length > 0 || fixedCosts.length > 0) {
      const span = document.createElement("span");
      span.textContent = followingMax
        ? `Zusatzbetrag folgt automatisch dem Maximum (${formatChf(maxExtra)}).`
        : `Maximum aus Einkommen und Fixkosten: ${formatChf(maxExtra)}. `;
      extraPaymentSuggestion.appendChild(span);
      if (!followingMax) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Wieder auf Maximum setzen";
        btn.addEventListener("click", () => {
          extraPaymentInput.value = maxExtra;
          lastAutoExtra = maxExtra;
          settings.extraPayment = String(maxExtra);
          Storage.saveSettings(settings);
          calculate();
        });
        extraPaymentSuggestion.appendChild(btn);
      }
    }

    if (hasDebt) calculate();
  }

  // ---- Calculation ----

  function calculate() {
    const validDebts = debts
      .filter((d) => d.name && Number(d.balance) > 0)
      .map((d) => ({
        id: d.id,
        name: d.name,
        balance: Number(d.balance),
        apr: Number(d.apr) || 0,
        creditorType: d.creditorType || DEFAULT_CREDITOR_TYPE
      }));

    resultsEl.innerHTML = "";

    if (validDebts.length === 0) {
      resultsEl.innerHTML = '<p class="empty-state">Bitte mindestens eine Schuld mit Bezeichnung und Restschuld eingeben.</p>';
      return;
    }

    const extra = Number(extraPaymentInput.value) || 0;
    const result = DebtPlanner.simulate(validDebts, extra);

    if (!result.feasible) {
      const warn = document.createElement("div");
      warn.className = "warning-box";
      warn.textContent =
        "Mit diesen Angaben ist die Schuld auch nach 50 Jahren nicht abbezahlt – die Zinsen wachsen schneller, als bezahlt wird. Erhöhe den monatlichen Zusatzbetrag oder wende dich an eine Schuldenberatung (siehe unten).";
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

    const planTitle = document.createElement("h3");
    planTitle.textContent = "Zahlungsplan: wie viel wohin, pro Monat";
    resultsEl.appendChild(planTitle);
    renderPaymentPlan(DebtPlanner.derivePaymentPlan(result.order, extra));

    const orderTitle = document.createElement("h3");
    orderTitle.textContent = "Ergebnis pro Schuld";
    resultsEl.appendChild(orderTitle);

    const list = document.createElement("ol");
    list.className = "payoff-order-list";
    const byPayoff = [...result.order].sort((a, b) => a.payoffMonth - b.payoffMonth);
    byPayoff.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = `${entry.name} – schuldenfrei nach ${entry.payoffMonth} Monaten (Zinsen: ${formatChf(entry.interestPaid)})`;
      list.appendChild(li);
    });
    resultsEl.appendChild(list);

    renderUrgencyComparison(validDebts);
  }

  /*
   * Purely informational: ranks the entered debts by how urgent they
   * typically are to deal with (e.g. AHV/Krankenkasse/Miete tend to
   * escalate fast), independent of the equal payment split above. Lets
   * someone see "this one is more urgent than its balance suggests"
   * even though every debt gets paid the same amount each month.
   */
  function renderUrgencyComparison(validDebts) {
    const title = document.createElement("h3");
    title.textContent = "Dringlichkeit im Vergleich";
    resultsEl.appendChild(title);

    const note = document.createElement("p");
    note.className = "strategy-note";
    note.textContent = "Nur eine grobe Einschätzung zur Orientierung, keine Rechtsberatung – ändert nichts an der Zahlung oben, alle Schulden werden weiterhin gleich bedient.";
    resultsEl.appendChild(note);

    const ranked = [...validDebts].sort((a, b) => {
      const ua = (CREDITOR_TYPE_BY_ID[a.creditorType] || CREDITOR_TYPE_BY_ID[DEFAULT_CREDITOR_TYPE]).urgency;
      const ub = (CREDITOR_TYPE_BY_ID[b.creditorType] || CREDITOR_TYPE_BY_ID[DEFAULT_CREDITOR_TYPE]).urgency;
      return ub - ua;
    });

    const list = document.createElement("div");
    list.className = "urgency-list";
    ranked.forEach((debt) => {
      const type = CREDITOR_TYPE_BY_ID[debt.creditorType] || CREDITOR_TYPE_BY_ID[DEFAULT_CREDITOR_TYPE];
      const item = document.createElement("div");
      item.className = "urgency-item";
      item.innerHTML = `
        <div class="urgency-item-head"><span>${debt.name}</span><span class="urgency-badge urgency-${type.urgency}">${urgencyLabel(type.urgency)}</span></div>
        <p class="urgency-reason">${type.label}: ${type.reason}</p>
      `;
      list.appendChild(item);
    });
    resultsEl.appendChild(list);
  }

  function renderPaymentPlan(phases) {
    const container = document.createElement("div");
    container.className = "payment-plan";

    phases.forEach((phase, index) => {
      const card = document.createElement("div");
      card.className = "phase-card";

      const heading = document.createElement("h4");
      const monthLabel = phase.fromMonth === phase.toMonth ? `Monat ${phase.fromMonth}` : `Monate ${phase.fromMonth}–${phase.toMonth}`;
      heading.textContent = index === 0 ? `Ab jetzt (${monthLabel})` : `${monthLabel}`;
      card.appendChild(heading);

      const subtitle = document.createElement("p");
      subtitle.className = "phase-subtitle";
      subtitle.textContent = `Alle offenen Schulden erhalten gleich viel, bis «${phase.targetName}» als erste davon fertig ist.`;
      card.appendChild(subtitle);

      const list = document.createElement("ul");
      list.className = "phase-payments";
      let total = 0;
      phase.payments.forEach((p) => {
        total += p.amount;
        const li = document.createElement("li");
        const isFirstDone = p.name === phase.targetName;
        li.innerHTML = `<span>${p.name}${isFirstDone ? " (zuerst fertig)" : ""}</span><span>${formatChf(p.amount)} / Monat</span>`;
        list.appendChild(li);
      });
      card.appendChild(list);

      const totalLine = document.createElement("p");
      totalLine.className = "phase-total";
      totalLine.textContent = `Gesamt: ${formatChf(total)} / Monat`;
      card.appendChild(totalLine);

      container.appendChild(card);
    });

    resultsEl.appendChild(container);
  }

  function formatChf(v) {
    return "CHF " + Math.round(v).toLocaleString("de-CH");
  }

  // ---- Profile picker (gates everything above) ----

  const LAST_PROFILE_KEY = "ssv_last_profile_id";
  const profilePickerEl = document.getElementById("profile-picker");
  const profileListEl = document.getElementById("profile-list");
  const newProfileNameInput = document.getElementById("new-profile-name");
  const appContentEl = document.getElementById("app-content");
  const currentProfileNameEl = document.getElementById("current-profile-name");

  function getLastProfileId() {
    try {
      return localStorage.getItem(LAST_PROFILE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setLastProfileId(id) {
    try {
      localStorage.setItem(LAST_PROFILE_KEY, id || "");
    } catch (e) {
      /* ignore */
    }
  }

  function renderProfilePicker() {
    const profiles = Profiles.list();
    profileListEl.innerHTML = "";
    if (profiles.length === 0) {
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent = "Noch keine Profile vorhanden. Leg unten das erste an.";
      profileListEl.appendChild(p);
      return;
    }
    profiles.forEach((profile) => {
      const row = document.createElement("div");
      row.className = "profile-row";

      const selectBtn = document.createElement("button");
      selectBtn.type = "button";
      selectBtn.className = "profile-select-btn";
      selectBtn.textContent = profile.name;
      selectBtn.addEventListener("click", () => selectProfile(profile.id));
      row.appendChild(selectBtn);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "remove-row-btn";
      delBtn.title = "Profil und alle Daten löschen";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", () => {
        if (confirm(`Profil «${profile.name}» und alle gespeicherten Daten unwiderruflich löschen?`)) {
          Profiles.remove(profile.id);
          if (getLastProfileId() === profile.id) setLastProfileId("");
          renderProfilePicker();
        }
      });
      row.appendChild(delBtn);

      profileListEl.appendChild(row);
    });
  }

  function selectProfile(id) {
    const profile = Profiles.list().find((p) => p.id === id);
    if (!profile) return;
    setLastProfileId(id);
    profilePickerEl.hidden = true;
    appContentEl.hidden = false;
    currentProfileNameEl.textContent = profile.name;
    startApp(id);
  }

  document.getElementById("create-profile-btn").addEventListener("click", () => {
    const name = newProfileNameInput.value.trim();
    if (!name) {
      newProfileNameInput.focus();
      return;
    }
    const profile = Profiles.create(name);
    newProfileNameInput.value = "";
    selectProfile(profile.id);
  });
  newProfileNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("create-profile-btn").click();
  });

  document.getElementById("switch-profile-btn").addEventListener("click", () => {
    // a fresh reload guarantees no leftover event listeners / in-memory
    // state from the previous profile leak into the next one
    setLastProfileId("");
    location.reload();
  });

  renderProfilePicker();
  const lastProfileId = getLastProfileId();
  const lastProfile = Profiles.list().find((p) => p.id === lastProfileId);
  if (lastProfile) {
    selectProfile(lastProfile.id);
  }
})();
