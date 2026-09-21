/*
 * Thin wrapper around localStorage. Everything entered by the user stays in
 * this browser only -- nothing here ever makes a network request. Different
 * people get separate data automatically as long as they use their own
 * device/browser, since localStorage is per-browser already.
 * Wrapped in try/catch because localStorage can throw (private browsing,
 * blocked site data) and the app should still run without it.
 */
const Storage = {
  DEBTS_KEY: "ssv_debts_v1",
  INCOME_KEY: "ssv_income_v1",
  FIXED_COSTS_KEY: "ssv_fixed_costs_v1",
  SETTINGS_KEY: "ssv_settings_v1",

  loadDebts() {
    try {
      const raw = localStorage.getItem(this.DEBTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveDebts(debts) {
    try {
      localStorage.setItem(this.DEBTS_KEY, JSON.stringify(debts));
    } catch (e) {
      /* ignore -- data just won't persist across reloads */
    }
  },

  loadIncome() {
    try {
      const raw = localStorage.getItem(this.INCOME_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveIncome(income) {
    try {
      localStorage.setItem(this.INCOME_KEY, JSON.stringify(income));
    } catch (e) {
      /* ignore */
    }
  },

  loadFixedCosts() {
    try {
      const raw = localStorage.getItem(this.FIXED_COSTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveFixedCosts(fixedCosts) {
    try {
      localStorage.setItem(this.FIXED_COSTS_KEY, JSON.stringify(fixedCosts));
    } catch (e) {
      /* ignore */
    }
  },

  loadSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      /* ignore */
    }
  }
};
