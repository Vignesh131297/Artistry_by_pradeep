/* ── Artistry Admin — localStorage Data Layer ── */
const DB = {
  P: 'abp_', // prefix

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
    this._w('customers',list); return c;
  },
  delCustomer(id){ this._w('customers',this.customers().filter(c=>c.id!==id)); },
  getCustomer(id){ return this.customers().find(c=>c.id===id); },

  /* ─── ORDERS ─── */
  orders()       { return this._r('orders')||[]; },
  saveOrder(o)   {
    const list=this.orders();
    const i=list.findIndex(x=>x.id===o.id);
    if(i>=0)list[i]=o; else list.push(o);
    this._w('orders',list); return o;
  },
  delOrder(id)   { this._w('orders',this.orders().filter(o=>o.id!==id)); },
  getOrder(id)   { return this.orders().find(o=>o.id===id); },

  /* ─── INVOICES ─── */
  invoices()     { return this._r('invoices')||[]; },
  nextInvNum()   { return 'INV-'+String(this.invoices().length+1).padStart(3,'0'); },
  saveInvoice(v) {
    const list=this.invoices();
    const i=list.findIndex(x=>x.id===v.id);
    if(i>=0)list[i]=v; else list.push(v);
    this._w('invoices',list); return v;
  },
  delInvoice(id) { this._w('invoices',this.invoices().filter(v=>v.id!==id)); },
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
  },
  delPackage(id) { this._w('packages',this.packages().filter(p=>p.id!==id)); },

  /* ─── ALBUMS ─── */
  albums()       { return this._r('albums')||[]; },
  saveAlbum(a)   {
    const list=this.albums();
    const i=list.findIndex(x=>x.id===a.id);
    if(i>=0)list[i]=a; else list.push(a);
    this._w('albums',list); return a;
  },
  delAlbum(id)   { this._w('albums',this.albums().filter(a=>a.id!==id)); },
  getAlbumByToken(t){ return this.albums().find(a=>a.token===t); },
  bumpViews(t)   {
    const list=this.albums();
    const i=list.findIndex(a=>a.token===t);
    if(i>=0){list[i].views=(list[i].views||0)+1;this._w('albums',list);}
  },

  /* ─── EVENTS (calendar) ─── */
  events()       { return this._r('events')||[]; },
  saveEvent(e)   {
    const list=this.events();
    const i=list.findIndex(x=>x.id===e.id);
    if(i>=0)list[i]=e; else list.push(e);
    this._w('events',list); return e;
  },
  delEvent(id)   { this._w('events',this.events().filter(e=>e.id!==id)); },

  /* ─── DASHBOARD STATS ─── */
  stats() {
    const orders   = this.orders();
    const invoices = this.invoices();
    const customers= this.customers();
    const now      = new Date();
    const m        = now.getMonth(), y = now.getFullYear();

    const activeOrders   = orders.filter(o=>!['completed'].includes(o.status)).length;
    const monthRevenue   = invoices
      .filter(v=>{ const d=new Date(v.createdAt); return d.getMonth()===m&&d.getFullYear()===y; })
      .reduce((s,v)=>s+(v.paid||0),0);
    const outstanding    = invoices.reduce((s,v)=>s+((v.total||0)-(v.paid||0)),0);

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
