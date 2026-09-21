/*
 * Manages the list of local profiles (just id + display name, no
 * financial data) so several people can use this app on one browser
 * without seeing each other's numbers. Not a login / password system
 * -- anyone with access to this browser can pick any profile. It only
 * keeps each person's numbers out of the way by default.
 */
const Profiles = {
  LIST_KEY: "ssv_profiles_v1",

  list() {
    try {
      const raw = localStorage.getItem(this.LIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  _save(list) {
    try {
      localStorage.setItem(this.LIST_KEY, JSON.stringify(list));
    } catch (e) {
      /* ignore */
    }
  },

  create(name) {
    const profile = { id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), name };
    const list = this.list();
    list.push(profile);
    this._save(list);
    return profile;
  },

  remove(profileId) {
    const list = this.list().filter((p) => p.id !== profileId);
    this._save(list);
    Storage.wipeProfile(profileId);
  }
};
