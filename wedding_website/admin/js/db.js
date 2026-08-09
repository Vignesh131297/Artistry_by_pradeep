/* ── Artistry Admin — localStorage Data Layer ── */
const DB = {
  P: 'abp_',

  _r(k)     { try { return JSON.parse(localStorage.getItem(this.P+k)); } catch { return null; } },
  _w(k,v)   { localStorage.setItem(this.P+k, JSON.stringify(v)); },

  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); },

  fmt(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  },

  /* ─── AUTH ─── */
  getAuth()      { return this._r('auth') || { user:'artistrybypradeep@gmail.com', pass:'Pradeep@123' }; },
  setAuth(u,p)   { this._w('auth',{user:u,pass:p}); },
  check(u,p)     { const a=this.getAuth(); return a.user===u && a.pass===p; },
  login(u,p)     { if(this.check(u,p)){localStorage.setItem(this.P+'s','1');localStorage.setItem(this.P+'u',u);return true;}return false; },
  logout()       { localStorage.removeItem(this.P+'s');localStorage.removeItem(this.P+'u'); },
  isLoggedIn()   { return localStorage.getItem(this.P+'s')==='1'; },
  currentUser()  { return localStorage.getItem(this.P+'u')||'admin'; },

  /* ─── CUSTOMERS ─── */
  customers()    { return this._r('customers')||[]; },
  saveCustomer(c){
    const list=this.customers();
    const i=list.findIndex(x=>x.id===c.id);
    if(i>=0)list[i]=c; else list.push(c);
    this._w('customers',list);
    Cloud.push('customers',list);
    return c;
  },
  delCustomer(id){
    const list=this.customers().filter(c=>c.id!==id);
    this._w('customers',list);
    Cloud.push('customers',list);
  },
  getCustomer(id){ return this.customers().find(c=>c.id===id); },

  /* ─── ORDERS ─── */
  orders()       { return this._r('orders')||[]; },
  saveOrder(o)   {
    const list=this.orders();
    const i=list.findIndex(x=>x.id===o.id);
    if(i>=0)list[i]=o; else list.push(o);
    this._w('orders',list);
    Cloud.push('orders',list);
    return o;
  },
  delOrder(id)   {
    const list=this.orders().filter(o=>o.id!==id);
    this._w('orders',list);
    Cloud.push('orders',list);
  },
  getOrder(id)   { return this.orders().find(o=>o.id===id); },

  /* ─── INVOICES ─── */
  invoices()     { return this._r('invoices')||[]; },
  nextInvNum()   { return 'INV-'+String(this.invoices().length+1).padStart(3,'0'); },
  saveInvoice(v) {
    const list=this.invoices();
    const i=list.findIndex(x=>x.id===v.id);
    if(i>=0)list[i]=v; else list.push(v);
    this._w('invoices',list);
    Cloud.push('invoices',list);
    return v;
  },
  delInvoice(id) {
    const list=this.invoices().filter(v=>v.id!==id);
    this._w('invoices',list);
    Cloud.push('invoices',list);
  },
  getInvoice(id) { return this.invoices().find(v=>v.id===id); },

  /* ─── PACKAGES ─── */
  packages() {
    return this._r('packages') || [
      { id:'pkg1', name:'Basic',     price:0, items:['Traditional Photography','Album 1 Nos','Photo Frames 1 Nos'] },
      { id:'pkg2', name:'Classic',   price:0, items:['Traditional Photography','Traditional Videography','Candid Photography','Synthetic Album 2 Nos','Photo Frames 2 Nos','Pre or Post Outdoor'] },
      { id:'pkg3', name:'Signature', price:0, items:['Traditional Photography','Traditional Videography 2 Nos','Candid Photography','Candid Cinematography','Premium Synthetic Album 2 Nos','Couple Magazine 1 Nos','Photo Frames 2 Nos','Pre or Post Outdoor','Aerial View Drone'] },
      { id:'pkg4', name:'Royal',     price:0, items:['Traditional Photography','Traditional Videography 2 Nos','Candid Photography 2 Nos','Candid Cinematography','Aerial View Drone','Premium Synthetic Album 2 Nos','Couple Magazine 1 Nos','Photo Frames 2 Nos','Pre or Post Outdoor','Live Streaming','LED Wall 6×8 ft'] }
    ];
  },
  savePackage(p) {
    const list=this.packages();
    const i=list.findIndex(x=>x.id===p.id);
    if(i>=0)list[i]=p; else list.push(p);
    this._w('packages',list);
    Cloud.push('packages',list);
  },
  delPackage(id) {
    const list=this.packages().filter(p=>p.id!==id);
    this._w('packages',list);
    Cloud.push('packages',list);
  },

  /* ─── ALBUMS ─── */
  albums()       { return this._r('albums')||[]; },
  saveAlbum(a)   {
    const list=this.albums();
    // Never persist heavy PDF blobs into localStorage / Firebase metadata
    const meta = { ...a };
    delete meta.pdfBlob;
    delete meta.pdfData;
    const i=list.findIndex(x=>x.id===meta.id);
    if(i>=0)list[i]=meta; else list.push(meta);
    this._w('albums',list);
    Cloud.push('albums',list);
    return meta;
  },
  delAlbum(id)   {
    const list=this.albums().filter(a=>a.id!==id);
    this._w('albums',list);
    Cloud.push('albums',list);
    AlbumFiles.del(id);
  },
  getAlbum(id)   { return this.albums().find(a=>a.id===id); },
  getAlbumByToken(t){ return this.albums().find(a=>a.token===t); },
  bumpViews(t)   {
    const list=this.albums();
    const i=list.findIndex(a=>a.token===t);
    if(i>=0){list[i].views=(list[i].views||0)+1;this._w('albums',list);Cloud.push('albums',list);}
  },

  /* ─── EVENTS (calendar) ─── */
  events()       { return this._r('events')||[]; },
  saveEvent(e)   {
    const list=this.events();
    const i=list.findIndex(x=>x.id===e.id);
    if(i>=0)list[i]=e; else list.push(e);
    this._w('events',list);
    Cloud.push('events',list);
    return e;
  },
  delEvent(id)   {
    const list=this.events().filter(e=>e.id!==id);
    this._w('events',list);
    Cloud.push('events',list);
  },

  /* ─── DASHBOARD STATS ─── */
  stats() {
    const orders   = this.orders();
    const invoices = this.invoices();
    const customers= this.customers();
    const now      = new Date();
    const m        = now.getMonth(), y = now.getFullYear();
    const activeOrders  = orders.filter(o=>!['completed'].includes(o.status)).length;
    const monthRevenue  = invoices
      .filter(v=>{ const d=new Date(v.createdAt); return d.getMonth()===m&&d.getFullYear()===y; })
      .reduce((s,v)=>s+(v.paid||0),0);
    const outstanding   = invoices.reduce((s,v)=>s+((v.total||0)-(v.paid||0)),0);
    return { customers: customers.length, activeOrders, monthRevenue, outstanding };
  },

  /* ─── MONTHLY REVENUE (last 6 months) ─── */
  monthlyRevenue() {
    const invs = this.invoices();
    const res  = [];
    const now  = new Date();
    for(let i=5;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const m = d.getMonth(), y = d.getFullYear();
      const rev = invs
        .filter(v=>{ const dd=new Date(v.createdAt); return dd.getMonth()===m&&dd.getFullYear()===y; })
        .reduce((s,v)=>s+(v.paid||0),0);
      res.push({ label: d.toLocaleString('en-IN',{month:'short'}), value: rev });
    }
    return res;
  }
};

/* ══════════════════════════════════════════════
   ALBUM PDF FILES — IndexedDB (keeps large PDFs
   out of localStorage / Firebase JSON sync)
   ══════════════════════════════════════════════ */
const AlbumFiles = {
  _db: null,
  _open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('abp_album_files', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('pdfs')) db.createObjectStore('pdfs');
      };
      req.onsuccess = () => { this._db = req.result; resolve(this._db); };
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    });
  },
  async put(id, blob, meta = {}) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pdfs', 'readwrite');
      tx.objectStore('pdfs').put({ blob, fileName: meta.fileName || 'album.pdf', savedAt: Date.now() }, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async get(id) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pdfs', 'readonly');
      const req = tx.objectStore('pdfs').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },
  async del(id) {
    try {
      const db = await this._open();
      return new Promise((resolve) => {
        const tx = db.transaction('pdfs', 'readwrite');
        tx.objectStore('pdfs').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) { /* ignore */ }
  }
};

/* ══════════════════════════════════════════════
   CLOUD SYNC — Firebase Realtime Database
   Data saves to cloud on every change.
   On login, latest data pulled from cloud.
   ══════════════════════════════════════════════ */
const Cloud = {
  get on() {
    return typeof FB_DB_URL !== 'undefined' && FB_DB_URL && FB_DB_URL.length > 10;
  },

  /* Push one collection to Firebase (background, silent) */
  push(key, data) {
    if (!this.on) return;
    fetch(FB_DB_URL + '/abp/' + key + '.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  },

  /* Pull all collections from Firebase */
  async pull() {
    if (!this.on) return null;
    try {
      const r = await fetch(FB_DB_URL + '/abp.json');
      if (!r.ok) return null;
      const d = await r.json();
      return d;
    } catch(e) { return null; }
  },

  /* Pull from Firebase and update localStorage */
  async syncToLocal() {
    const data = await this.pull();
    if (!data) return false;
    const keys = ['customers','orders','invoices','packages','albums','events'];
    keys.forEach(k => {
      if (data[k] != null) {
        const arr = Array.isArray(data[k]) ? data[k] : Object.values(data[k]);
        DB._w(k, arr);
      }
    });
    return true;
  },

  /* Push ALL local data to Firebase (full backup) */
  pushAll() {
    if (!this.on) return;
    const payload = {
      customers: DB.customers(),
      orders:    DB.orders(),
      invoices:  DB.invoices(),
      packages:  DB.packages(),
      albums:    DB.albums(),
      events:    DB.events()
    };
    fetch(FB_DB_URL + '/abp.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }
};
