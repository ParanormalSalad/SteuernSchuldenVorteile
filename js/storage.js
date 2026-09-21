/*
 * Thin wrapper around localStorage. Everything entered by the user stays in
 * this browser only -- nothing here ever makes a network request.
 * Wrapped in try/catch because localStorage can throw (private browsing,
 * blocked site data) and the app should still run without it.
 */
const Storage = {
  DEBTS_KEY: "ssv_debts_v1",
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
