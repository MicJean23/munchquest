// MunchQuest restaurant website — Vue 3 (global build, loaded from vendor/vue.global.prod.js).
// The page markup in index.html is the Vue template. Everything on screen comes from the data below.

const { createApp } = Vue;

// Static lists and helpers that do not need to be reactive.
const HOME_BOROUGHS = ['Brooklyn', 'Manhattan', 'Queens', 'Bronx', 'Staten Island'];
const PAGE_SIZE = 9;
const PAGES = ['home', 'restaurants', 'top', 'about'];

const CUISINE_PICTURES = [
  [/korean/, 'korean'],
  [/japanese|ramen|sushi/, 'japanese'],
  [/barbecue|grill|inasal/, 'grill'],
  [/fruit|ice cream/, 'fruit-dessert'],
  [/dessert|halo|sweet/, 'halo-halo'],
  [/filipino|kapampangan/, 'filipino'],
  [/pizza|italian|pasta/, 'pizza'],
  [/american|hamburger|burger|steak/, 'burger'],
  [/veget|salad|healthy/, 'salad'],
  [/cafe|café|coffee|bakery|brunch/, 'cafe']
];

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function emptyFilters() {
  return { search: '', borough: '', cuisine: '', grade: '', maxScore: '', group: false };
}

function emptyForm() {
  return {
    id: '', name: '', borough: '', cuisine: '', imageUrl: '',
    building: '', street: '', zipcode: '',
    grade: '', score: '', inspectionDate: ''
  };
}

createApp({
  data() {
    return {
      // navigation
      current: 'home',

      // lists from /api/meta
      boroughs: [],
      cuisines: [],
      isDemo: false,
      homeBoroughs: HOME_BOROUGHS,

      // restaurant directory
      filters: emptyFilters(),
      items: [],
      groups: [],
      page: 1,
      total: 0,
      loading: false,
      loaded: false,
      error: '',
      requestId: 0,
      brokenImages: {},

      // rankings
      report: 'best',
      rankMode: 'best',
      rankings: [],
      rankLoaded: false,
      rankRequestId: 0,

      // add / edit dialog
      form: emptyForm(),
      formError: '',
      saving: false,
      today: '',

      // delete dialog
      pendingDelete: null,
      deleteName: '',
      deleteError: '',
      deleting: false,

      // toast message
      toastMessage: '',
      toastVisible: false,
      toastTimer: null
    };
  },

  computed: {
    pageCount() {
      return Math.max(1, Math.ceil(this.total / PAGE_SIZE));
    },
    countText() {
      if (this.loading) return 'Loading restaurants…';
      if (this.error) return 'Unable to load restaurants';
      if (!this.loaded) return '';
      if (!this.total) return 'No matching restaurants';
      const first = (this.page - 1) * PAGE_SIZE + 1;
      const last = Math.min(this.page * PAGE_SIZE, this.total);
      return `Showing ${first}–${last} of ${this.total.toLocaleString()} restaurants`;
    },
    reportNote() {
      return this.report === 'best'
        ? 'Ordered by average inspection score, lowest first, across all recorded numeric inspections. Lower averages appear first.'
        : 'Shows restaurants whose inspection scores add up to more than 90, ordered by total descending. A larger total is not a better quality rating.';
    }
  },

  mounted() {
    window.addEventListener('hashchange', this.navigate);
    this.loadMeta().catch(e => this.showToast(e.message));
    this.navigate();
  },

  beforeUnmount() {
    window.removeEventListener('hashchange', this.navigate);
  },

  methods: {
    // ---------- navigation ----------
    navigate() {
      const wanted = location.hash.slice(1);
      this.current = PAGES.includes(wanted) ? wanted : 'home';
      if (this.current === 'restaurants') this.load();
      if (this.current === 'top') this.loadRankings();
      window.scrollTo(0, 0);
    },

    pickBorough(borough) {
      // Home page borough links: start a fresh search for that borough.
      this.filters = { ...emptyFilters(), borough };
      this.page = 1;
      if (location.hash === '#restaurants') this.load();
    },

    // ---------- toast ----------
    showToast(message) {
      this.toastMessage = message;
      this.toastVisible = true;
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 4500);
    },

    // ---------- meta (boroughs, cuisines, demo banner) ----------
    async loadMeta() {
      const data = await api('/api/meta');
      this.isDemo = data.mode === 'demo';
      this.boroughs = data.boroughs;
      this.cuisines = data.cuisines;
      // A cuisine that no longer exists cannot stay selected.
      if (this.filters.borough && !this.boroughs.includes(this.filters.borough)) this.filters.borough = '';
      if (this.filters.cuisine && !this.cuisines.includes(this.filters.cuisine)) this.filters.cuisine = '';
    },

    // ---------- restaurant directory ----------
    queryParams() {
      const p = new URLSearchParams();
      for (const key of ['search', 'borough', 'cuisine', 'grade', 'maxScore']) {
        const value = this.filters[key];
        // 0 is a real value for the score filter, so only skip blanks.
        if (value !== '' && value !== null && value !== undefined) p.append(key, String(value));
      }
      return p;
    },

    async load() {
      const token = ++this.requestId;
      this.loading = true;
      const p = this.queryParams();
      p.set('page', this.page);

      try {
        const data = await api('/api/restaurants?' + p);
        if (token !== this.requestId) return;

        this.total = data.total;

        if (this.page > 1 && !data.items.length) {
          this.page = Math.max(1, Math.ceil(this.total / PAGE_SIZE));
          return this.load();
        }

        this.items = data.items;
        this.error = '';
        this.loaded = true;

        if (this.filters.group) {
          const groups = await api('/api/groups?' + this.queryParams());
          if (token !== this.requestId) return;
          this.groups = groups;
        }
      } catch (e) {
        if (token !== this.requestId) return;
        this.error = e.message;
      } finally {
        if (token === this.requestId) this.loading = false;
      }
    },

    applyFilters() {
      this.page = 1;
      this.load();
    },

    clearFilters() {
      this.filters = emptyFilters();
      this.page = 1;
      this.load();
    },

    toggleGroup(event) {
      this.filters.group = event.target.checked;
      this.load();
    },

    pickGroup(group) {
      this.filters.borough = group._id || '';
      this.page = 1;
      this.load();
    },

    goToPage(number) {
      this.page = number;
      this.load();
    },

    // ---------- card helpers ----------
    latest(grades) {
      return [...(grades || [])].sort(
        (a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
      )[0];
    },

    imageKey(record) {
      return record._id + '|' + (record.imageUrl || '');
    },

    imageBroke(record) {
      this.brokenImages[this.imageKey(record)] = true;
    },

    imageSrc(record) {
      if (this.brokenImages[this.imageKey(record)]) return 'images/restaurant.jpg';
      try {
        const url = new URL(record.imageUrl);
        if (url.protocol === 'https:') return url.href;
      } catch {}
      const cuisine = (record.cuisine || '').toLowerCase();
      const match = CUISINE_PICTURES.find(([pattern]) => pattern.test(cuisine));
      return 'images/' + (match ? match[1] : 'cafe') + '.jpg';
    },

    imageAlt(record) {
      if (this.brokenImages[this.imageKey(record)]) return 'Illustrative restaurant interior';
      return record.imageUrl
        ? 'Image provided for ' + record.name
        : 'Illustrative food or restaurant photograph';
    },

    imageCaption(record) {
      if (this.brokenImages[this.imageKey(record)]) return 'Illustrative photo';
      return record.imageUrl ? 'Provided restaurant image' : 'Illustrative photo';
    },

    addressText(record) {
      const address = record.address || {};
      return [address.building, address.street, address.zipcode].filter(Boolean).join(' ') || 'Address not provided';
    },

    scoreText(record) {
      const inspection = this.latest(record.grades);
      return inspection ? 'Latest score: ' + (inspection.score ?? '—') : 'No inspection recorded';
    },

    dateText(record) {
      const inspection = this.latest(record.grades);
      if (!inspection?.date || Number.isNaN(Date.parse(inspection.date))) return '';
      return new Date(inspection.date).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    },

    // ---------- rankings ----------
    async loadRankings() {
      const token = ++this.rankRequestId;
      const mode = this.report;
      this.rankings = [];
      this.rankLoaded = false;

      try {
        const data = await api('/api/rankings?mode=' + mode);
        if (token !== this.rankRequestId) return;
        this.rankMode = mode;
        this.rankings = data;
        this.rankLoaded = true;
      } catch (e) {
        this.showToast(e.message);
      }
    },

    rankScore(row) {
      return this.rankMode === 'best' ? row.averageScore.toFixed(1) : row.totalScore;
    },

    // ---------- add / edit ----------
    openEditor(record) {
      this.form = emptyForm();
      if (record) {
        this.form.id = record._id;
        for (const key of ['name', 'borough', 'cuisine', 'imageUrl']) this.form[key] = record[key] || '';
        for (const key of ['building', 'street', 'zipcode']) this.form[key] = record.address?.[key] || '';
      }
      this.formError = '';
      this.today = new Date().toISOString().slice(0, 10);
      this.$refs.editor.showModal();
    },

    closeEditor() {
      this.$refs.editor.close();
    },

    async saveRestaurant() {
      const { id, ...data } = this.form;
      this.saving = true;
      this.formError = '';

      try {
        await api('/api/restaurants' + (id ? '/' + id : ''), {
          method: id ? 'PUT' : 'POST',
          body: JSON.stringify(data)
        });
        this.$refs.editor.close();
        this.showToast(id ? 'Restaurant updated.' : 'Restaurant added.');
        await this.loadMeta();
        await this.load();
      } catch (e) {
        this.formError = e.message;
      } finally {
        this.saving = false;
      }
    },

    // ---------- delete ----------
    askDelete(record) {
      this.pendingDelete = record;
      this.deleteName = record.name;
      this.deleteError = '';
      this.$refs.deleteDialog.showModal();
    },

    closeDelete() {
      this.$refs.deleteDialog.close();
    },

    async confirmDelete() {
      if (!this.pendingDelete) return;
      this.deleting = true;

      try {
        await api('/api/restaurants/' + this.pendingDelete._id, { method: 'DELETE' });
        this.$refs.deleteDialog.close();
        this.pendingDelete = null;
        this.showToast('Restaurant deleted.');
        await this.loadMeta();
        await this.load();
      } catch (e) {
        this.deleteError = e.message;
      } finally {
        this.deleting = false;
      }
    }
  }
}).mount('#app');
