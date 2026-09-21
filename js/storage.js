/*
 * Thin wrapper around localStorage, namespaced per profile so several
 * people can use the app on the same browser without seeing each
 * other's numbers. Storage.setProfile(id) must be called once before
 * any load/save call. Everything still stays in this browser only --
 * nothing here ever makes a network request.
 * Wrapped in try/catch because localStorage can throw (private browsing,
 * blocked site data) and the app should still run without it.
 */
const Storage = {
  profileId: null,

  DEBTS_BASE: "ssv_debts_v1",
  INCOME_BASE: "ssv_income_v1",
  FIXED_COSTS_BASE: "ssv_fixed_costs_v1",
  SETTINGS_BASE: "ssv_settings_v1",

  setProfile(profileId) {
    this.profileId = profileId;
  },

  _key(base) {
    return `${base}::${this.profileId}`;
  },

  loadDebts() {
    try {
      const raw = localStorage.getItem(this._key(this.DEBTS_BASE));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveDebts(debts) {
    try {
      localStorage.setItem(this._key(this.DEBTS_BASE), JSON.stringify(debts));
    } catch (e) {
      /* ignore -- data just won't persist across reloads */
    }
  },

  loadIncome() {
    try {
      const raw = localStorage.getItem(this._key(this.INCOME_BASE));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveIncome(income) {
    try {
      localStorage.setItem(this._key(this.INCOME_BASE), JSON.stringify(income));
    } catch (e) {
      /* ignore */
    }
  },

  loadFixedCosts() {
    try {
      const raw = localStorage.getItem(this._key(this.FIXED_COSTS_BASE));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveFixedCosts(fixedCosts) {
    try {
      localStorage.setItem(this._key(this.FIXED_COSTS_BASE), JSON.stringify(fixedCosts));
    } catch (e) {
      /* ignore */
    }
  },

  loadSettings() {
    try {
      const raw = localStorage.getItem(this._key(this.SETTINGS_BASE));
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(this._key(this.SETTINGS_BASE), JSON.stringify(settings));
    } catch (e) {
      /* ignore */
    }
  },

  wipeProfile(profileId) {
    try {
      [this.DEBTS_BASE, this.INCOME_BASE, this.FIXED_COSTS_BASE, this.SETTINGS_BASE].forEach((base) => {
        localStorage.removeItem(`${base}::${profileId}`);
      });
    } catch (e) {
      /* ignore */
    }
  }
};
