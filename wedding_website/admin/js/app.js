/* ── Artistry Admin — SPA App Logic ── */

/* ════════════════════════════════════════
   CORE / ROUTER
   ════════════════════════════════════════ */
const App = {
  pages: { dashboard:'Dashboard', customers:'Customers', orders:'Orders',
           calendar:'Calendar', invoices:'Invoices', packages:'Packages',
           albums:'Albums', settings:'Settings' },

  init() {
    if (!DB.isLoggedIn()) { window.location.href='index.html'; return; }
    const u = DB.currentUser();
    const displayName = u.includes('@') ? u.split('@')[0] : u;
    document.getElementById('sUser').textContent = u;
    document.getElementById('sAvatar').textContent = displayName[0].toUpperCase();
    document.getElementById('todayBadge').textContent =
      new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
    this.refreshBadge();
    this.route(location.hash.slice(1)||'dashboard');
    window.addEventListener('hashchange',()=>{ this.route(location.hash.slice(1)||'dashboard'); this.refreshBadge(); });
    // Pull latest data from Firebase cloud on every login
    if (Cloud.on) {
      Cloud.syncToLocal().then(ok => {
        if (ok) {
          this.route(location.hash.slice(1)||'dashboard');
          this.refreshBadge();
          this.toast('Data synced from cloud','ok');
        }
      });
    }
    document.querySelectorAll('.nav-item[data-page]').forEach(el=>{
      el.addEventListener('click',()=>{ location.hash=el.dataset.page; this.closeSidebar(); });
    });
  },

  route(page) {
    if (!this.pages[page]) page='dashboard';
    document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
    document.getElementById('pageTitle').textContent = this.pages[page];
    document.getElementById('content').innerHTML = Modules[page]();
    if (typeof Modules[page+'Init']==='function') Modules[page+'Init']();
  },

  logout() {
    const c = DB.customers().length;
    const o = DB.orders().length;
    const inv = DB.invoices().length;
    const msg = `You are logging out.\n\nYour data is safely saved:\n✔ ${c} Customers\n✔ ${o} Orders\n✔ ${inv} Invoices\n\nAll records will be here when you log back in.`;
    if (!confirm(msg)) return;
    DB.logout();
    window.location.href = 'index.html';
  },

  refreshBadge() {
    const b = document.getElementById('dataBadge');
    if (!b) return;
    const c = DB.customers().length, o = DB.orders().length, inv = DB.invoices().length;
    if (c+o+inv === 0) { b.style.display='none'; return; }
    b.textContent = `${c} customers · ${o} orders · ${inv} invoices`;
    b.style.display = 'inline';
  },

  toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); },
  closeSidebar()  { document.getElementById('sidebar').classList.remove('open'); },

  /* ── MODAL ── */
  modal(title, bodyHtml, size='') {
    const box = document.getElementById('modalBox');
    box.className = 'modal'+(size?' '+size:'');
    box.innerHTML = `
      <div class="modal-head">
        <div class="modal-title">${title}</div>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" id="modalBodyInner">${bodyHtml}</div>`;
    document.getElementById('modalOverlay').classList.add('open');
  },
  closeModal() { document.getElementById('modalOverlay').classList.remove('open'); },
  closeModalOnBg(e) { if(e.target.id==='modalOverlay') this.closeModal(); },

  /* ── TOAST ── */
  toast(msg, type='') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast'+(type?' '+type:'');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(()=>t.remove(), 3200);
  }
};

/* ════════════════════════════════════════
   SHARED HELPERS
   ════════════════════════════════════════ */
const H = {
  esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
  badge(s){ return `<span class="badge badge-${s}">${s}</span>`; },
  money(v){ return '₹'+Number(v||0).toLocaleString('en-IN'); },
  date(d){ return d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'; },
  customerSelect(sel=''){
    return DB.customers().map(c=>`<option value="${c.id}"${sel===c.id?' selected':''}>${H.esc(c.name)}</option>`).join('');
  },
  packageSelect(sel=''){
    return `<option value="">None</option>`+
      DB.packages().map(p=>`<option value="${p.id}"${sel===p.id?' selected':''}>${H.esc(p.name)}</option>`).join('');
  },
  orderSelect(cid='',sel=''){
    const orders = cid ? DB.orders().filter(o=>o.customerId===cid) : DB.orders();
    return `<option value="">None</option>`+
      orders.map(o=>`<option value="${o.id}"${sel===o.id?' selected':''}>Booking #${o.id.slice(-4).toUpperCase()} — ${H.esc(o.customerName||'')}</option>`).join('');
  },
  statusOptions(cur, opts){
    return opts.map(s=>`<option value="${s}"${s===cur?' selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('');
  },
  svgIcon(name){
    const icons = {
      edit:`<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
      del:`<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
      eye:`<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
      copy:`<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
      print:`<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
      wa:`<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
      plus:`<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
    };
    return icons[name]||'';
  }
};

/* ════════════════════════════════════════
   MODULES
   ════════════════════════════════════════ */
const Modules = {

  /* ─────────────── DASHBOARD ─────────────── */
  dashboard() {
    const s   = DB.stats();
    const rev = DB.monthlyRevenue();
    const maxR= Math.max(...rev.map(r=>r.value),1);
    const orders   = DB.orders().slice(-5).reverse();
    const today    = new Date().toISOString().slice(0,10);
    const events   = DB.events().filter(e=>e.date>=today).slice(0,6);

    return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Customers</div>
        <div class="stat-value">${s.customers}</div>
        <div class="stat-sub">All time</div>
        <div class="stat-icon"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Bookings</div>
        <div class="stat-value">${s.activeOrders}</div>
        <div class="stat-sub">In progress</div>
        <div class="stat-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">This Month Revenue</div>
        <div class="stat-value">${H.money(s.monthRevenue)}</div>
        <div class="stat-sub">Collected</div>
        <div class="stat-icon"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Outstanding</div>
        <div class="stat-value">${H.money(s.outstanding)}</div>
        <div class="stat-sub">Pending collection</div>
        <div class="stat-icon"><svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
      </div>
    </div>

    <div class="dash-two" style="margin-bottom:1.5rem">
      <div class="chart-card">
        <div class="chart-title">Monthly Revenue</div>
        <div class="bar-chart">
          ${rev.map(r=>`
          <div class="bar-col">
            <div class="bar-val">${r.value?H.money(r.value):''}</div>
            <div class="bar" style="height:${Math.max(4,Math.round(r.value/maxR*100))}%"></div>
            <div class="bar-lbl">${r.label}</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="detail-card" style="max-height:250px;overflow-y:auto">
        <div class="detail-head"><div class="detail-head-title">Upcoming Events</div></div>
        ${events.length ? events.map(e=>{
          const d=new Date(e.date);
          return `<div class="ev-item">
            <div class="ev-badge">
              <div class="ev-day">${d.getDate()}</div>
              <div class="ev-mon">${d.toLocaleString('en-IN',{month:'short'})}</div>
            </div>
            <div class="ev-info">
              <div class="ev-title">${H.esc(e.title)}</div>
              <div class="ev-sub">${H.esc(e.location||e.type||'')}</div>
            </div>
          </div>`;
        }).join('') : '<div class="empty" style="padding:1.5rem"><div class="empty-sub">No upcoming events</div></div>'}
      </div>
    </div>

    <div>
      <div class="sec-head">
        <div class="sec-title">Recent Bookings</div>
        <button class="btn btn-ghost btn-sm" onclick="location.hash='orders'">View All</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Event Date</th><th>Package</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            ${orders.length ? orders.map(o=>`
            <tr>
              <td>${H.esc(o.customerName||'—')}</td>
              <td>${H.date(o.eventDate)}</td>
              <td>${H.esc(o.packageName||'—')}</td>
              <td>${H.money(o.total)}</td>
              <td>${H.badge(o.status||'enquiry')}</td>
            </tr>`).join('') : `<tr><td colspan="5"><div class="empty"><div class="empty-sub">No bookings yet</div></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
  },

  /* ─────────────── CUSTOMERS ─────────────── */
  customers() {
    return `
    <div class="sec-head">
      <div class="sec-title">All Customers</div>
      <button class="btn btn-primary" onclick="Customers.openAdd()">
        ${H.svgIcon('plus')} Add Customer
      </button>
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <input class="search-box" id="custSearch" placeholder="Search by name, phone or email…" oninput="Customers.filter(this.value)"/>
      </div>
      <table>
        <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>City</th><th>Orders</th><th>Added</th><th></th></tr></thead>
        <tbody id="custTbody">${Customers.rows()}</tbody>
      </table>
    </div>`;
  },

  /* ─────────────── ORDERS ─────────────── */
  orders() {
    return `
    <div class="sec-head">
      <div class="sec-title">Bookings & Orders</div>
      <button class="btn btn-primary" onclick="Orders.openAdd()">
        ${H.svgIcon('plus')} New Booking
      </button>
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="filter-tabs" id="orderTabs">
          ${['all','enquiry','confirmed','editing','delivered'].map(s=>`<button class="ftab${s==='all'?' active':''}" data-s="${s}" onclick="Orders.tab(this,'${s}')">${s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}</button>`).join('')}
        </div>
      </div>
      <table>
        <thead><tr><th>Customer</th><th>Event Date</th><th>Location</th><th>Package</th><th>Total</th><th>Advance</th><th>Status</th><th></th></tr></thead>
        <tbody id="orderTbody">${Orders.rows('all')}</tbody>
      </table>
    </div>`;
  },

  /* ─────────────── CALENDAR ─────────────── */
  calendar() {
    return `
    <div class="sec-head">
      <div class="sec-title">Event Calendar</div>
      <button class="btn btn-primary" onclick="Cal.openAdd()">
        ${H.svgIcon('plus')} Add Event
      </button>
    </div>
    <div class="cal-grid" id="calGrid">${Cal.render()}</div>`;
  },

  /* ─────────────── INVOICES ─────────────── */
  invoices() {
    return `
    <div class="sec-head">
      <div class="sec-title">Invoices & Quotations</div>
      <button class="btn btn-primary" onclick="Inv.openCreate()">
        ${H.svgIcon('plus')} Create Invoice
      </button>
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="filter-tabs">
          ${['all','draft','sent','partial','paid','overdue'].map(s=>`<button class="ftab${s==='all'?' active':''}" onclick="Inv.tab(this,'${s}')">${s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}</button>`).join('')}
        </div>
      </div>
      <table>
        <thead><tr><th>Invoice #</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead>
        <tbody id="invTbody">${Inv.rows('all')}</tbody>
      </table>
    </div>`;
  },

  /* ─────────────── PACKAGES ─────────────── */
  packages() {
    return `
    <div class="sec-head">
      <div class="sec-title">Services & Packages</div>
      <button class="btn btn-primary" onclick="Pkgs.openAdd()">
        ${H.svgIcon('plus')} New Package
      </button>
    </div>
    <div class="pkg-grid" id="pkgGrid">${Pkgs.cards()}</div>`;
  },

  /* ─────────────── ALBUMS ─────────────── */
  albums() {
    return `
    <div class="sec-head">
      <div class="sec-title">Album Delivery</div>
      <button class="btn btn-primary" onclick="Albums.openAdd()">
        ${H.svgIcon('plus')} Add Album
      </button>
    </div>
    <div class="album-grid" id="albumGrid">${Albums.cards()}</div>`;
  },

  /* ─────────────── SETTINGS ─────────────── */
  settings() {
    const a = DB.getAuth();
    return `
    <div style="max-width:480px">
      <div class="detail-card">
        <div class="detail-head"><div class="detail-head-title">Change Login Credentials</div></div>
        <div class="detail-body">
          <div class="form-grid" style="gap:.9rem">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input class="form-control" id="setUser" value="${H.esc(a.user)}"/>
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input class="form-control" type="password" id="setPass" placeholder="Leave blank to keep current"/>
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input class="form-control" type="password" id="setPass2"/>
            </div>
            <button class="btn btn-primary" onclick="Settings.save()">Save Changes</button>
          </div>
        </div>
      </div>
      <div class="detail-card" style="margin-top:1.2rem">
        <div class="detail-head"><div class="detail-head-title">Data Management</div></div>
        <div class="detail-body">
          <p style="font-size:.78rem;color:var(--gray);margin-bottom:1rem">Export or clear all stored data.</p>
          <div style="display:flex;gap:.7rem;flex-wrap:wrap">
            <button class="btn btn-outline" onclick="Settings.exportData()">Export Data (JSON)</button>
            <button class="btn btn-danger" onclick="Settings.clearData()">Clear All Data</button>
          </div>
        </div>
      </div>
    </div>`;
  }
};

/* ════════════════════════════════════════
   CUSTOMERS MODULE
   ════════════════════════════════════════ */
const Customers = {
  rows(q='') {
    let list = DB.customers();
    if (q) { q=q.toLowerCase(); list=list.filter(c=>c.name.toLowerCase().includes(q)||c.phone.includes(q)||(c.email||'').toLowerCase().includes(q)); }
    if (!list.length) return `<tr><td colspan="7"><div class="empty"><div class="empty-title">No customers yet</div><div class="empty-sub">Add your first client to get started</div></div></td></tr>`;
    const orders = DB.orders();
    return list.map(c=>{
      const cnt = orders.filter(o=>o.customerId===c.id).length;
      return `<tr>
        <td><strong>${H.esc(c.name)}</strong></td>
        <td><a href="tel:${H.esc(c.phone)}" style="color:inherit;text-decoration:none" title="Call">${H.esc(c.phone)}</a></td>
        <td>${H.esc(c.email||'—')}</td>
        <td>${H.esc(c.city||'—')}</td>
        <td>${cnt}</td>
        <td>${H.date(c.createdAt)}</td>
        <td><div class="action-btns">
          <a class="btn-icon" href="tel:${H.esc(c.phone)}" title="Call ${H.esc(c.name)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>
          <button class="btn-icon" onclick="Customers.openEdit('${c.id}')" title="Edit">${H.svgIcon('edit')}</button>
          <button class="btn-icon" onclick="Customers.del('${c.id}')" title="Delete">${H.svgIcon('del')}</button>
        </div></td>
      </tr>`;
    }).join('');
  },

  filter(q) { document.getElementById('custTbody').innerHTML=this.rows(q); },

  openAdd() {
    App.modal('Add Customer', `
      <div class="form-grid fg2">
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="cName" required/></div>
        <div class="form-group"><label class="form-label">Phone *</label><input class="form-control" id="cPhone" maxlength="10"/></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="cEmail" type="email"/></div>
        <div class="form-group"><label class="form-label">City</label><input class="form-control" id="cCity"/></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">Address</label><input class="form-control" id="cAddr"/></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">Notes</label><textarea class="form-control" id="cNotes"></textarea></div>
      </div>
      <div class="modal-foot" style="padding:0;margin-top:1.2rem">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Customers.save()">Save Customer</button>
      </div>`);
  },

  openEdit(id) {
    const c = DB.getCustomer(id);
    if (!c) return;
    App.modal('Edit Customer', `
      <input type="hidden" id="cId" value="${c.id}"/>
      <div class="form-grid fg2">
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="cName" value="${H.esc(c.name)}" required/></div>
        <div class="form-group"><label class="form-label">Phone *</label><input class="form-control" id="cPhone" value="${H.esc(c.phone)}" maxlength="10"/></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="cEmail" type="email" value="${H.esc(c.email||'')}"/></div>
        <div class="form-group"><label class="form-label">City</label><input class="form-control" id="cCity" value="${H.esc(c.city||'')}"/></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">Address</label><input class="form-control" id="cAddr" value="${H.esc(c.address||'')}"/></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">Notes</label><textarea class="form-control" id="cNotes">${H.esc(c.notes||'')}</textarea></div>
      </div>
      <div class="modal-foot" style="padding:0;margin-top:1.2rem">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Customers.save()">Update Customer</button>
      </div>`);
  },

  save() {
    const name = document.getElementById('cName').value.trim();
    if (!name) { App.toast('Name is required','err'); return; }
    const idEl = document.getElementById('cId');
    const c = {
      id: idEl?idEl.value:DB.uid(),
      name, phone: document.getElementById('cPhone').value.trim(),
      email: document.getElementById('cEmail').value.trim(),
      city: document.getElementById('cCity').value.trim(),
      address: document.getElementById('cAddr').value.trim(),
      notes: document.getElementById('cNotes').value.trim(),
      createdAt: idEl ? DB.getCustomer(idEl.value)?.createdAt : new Date().toISOString()
    };
    DB.saveCustomer(c);
    App.closeModal();
    App.toast(idEl?'Customer updated':'Customer added','ok');
    App.refreshBadge();
    document.getElementById('custTbody').innerHTML=this.rows();
  },

  del(id) {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    DB.delCustomer(id);
    App.toast('Customer deleted');
    App.refreshBadge();
    document.getElementById('custTbody').innerHTML=this.rows();
  }
};

/* ════════════════════════════════════════
   ORDERS MODULE
   ════════════════════════════════════════ */
const Orders = {
  rows(status='all') {
    let list = DB.orders();
    if (status!=='all') list=list.filter(o=>o.status===status);
    list = list.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    if (!list.length) return `<tr><td colspan="8"><div class="empty"><div class="empty-title">No bookings found</div></div></td></tr>`;
    return list.map(o=>`
      <tr>
        <td><strong>${H.esc(o.customerName||'—')}</strong></td>
        <td>${H.date(o.eventDate)}</td>
        <td>${H.esc(o.location||'—')}</td>
        <td>${H.esc(o.packageName||'—')}</td>
        <td>${H.money(o.total)}</td>
        <td>${H.money(o.advance)}</td>
        <td>${H.badge(o.status||'enquiry')}</td>
        <td><div class="action-btns">
          <button class="btn-icon btn-pdf" onclick="Orders.shareQuote('${o.id}')" title="Generate PDF Quote"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></button>
          <button class="btn-icon" onclick="Orders.openEdit('${o.id}')" title="Edit">${H.svgIcon('edit')}</button>
          <button class="btn-icon" onclick="Orders.del('${o.id}')" title="Delete">${H.svgIcon('del')}</button>
        </div></td>
      </tr>`).join('');
  },

  tab(el, s) {
    document.querySelectorAll('#orderTabs .ftab').forEach(b=>b.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('orderTbody').innerHTML=this.rows(s);
  },

  openAdd() {
    const custs = DB.customers();
    App.modal('New Booking', `
      <div class="form-grid fg2">
        <div class="form-group"><label class="form-label">Customer *</label>
          <select class="form-control" id="oCust" onchange="Orders.fillCustomer(this.value)">
            <option value="">Select Customer</option>${H.customerSelect()}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="oStatus">
            ${H.statusOptions('enquiry',['enquiry','confirmed','editing','delivered'])}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Event Date</label><input class="form-control" id="oDate" type="date"/></div>
        <div class="form-group"><label class="form-label">Event Type</label>
          <select class="form-control" id="oType">
            <option>Wedding</option><option>Pre-Wedding</option><option>Engagement</option><option>Baby Shower</option><option>Birthday</option><option>Other</option>
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">Location / Venue</label><input class="form-control" id="oLoc"/></div>
        <div class="form-group"><label class="form-label">Package</label>
          <select class="form-control" id="oPkg" onchange="Orders.fillPackage(this.value)">${H.packageSelect()}</select>
        </div>
        <div class="form-group"><label class="form-label">Total Amount (₹)</label><input class="form-control" id="oTotal" type="number" min="0"/></div>
        <div class="form-group"><label class="form-label">Advance Paid (₹)</label><input class="form-control" id="oAdv" type="number" min="0"/></div>
        <div class="form-group"><label class="form-label">Expenses (₹)</label><input class="form-control" id="oExp" type="number" min="0"/></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">Notes</label><textarea class="form-control" id="oNotes"></textarea></div>
      </div>
      <div class="modal-foot" style="padding:0;margin-top:1.2rem">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Orders.save()">Save Booking</button>
      </div>`, 'modal-lg');
  },

  fillCustomer(id) { /* auto-fill if needed */ },

  fillPackage(id) {
    const pkg = DB.packages().find(p=>p.id===id);
    if (pkg&&pkg.price) document.getElementById('oTotal').value=pkg.price;
  },

  openEdit(id) {
    const o = DB.getOrder(id);
    if (!o) return;
    App.modal('Edit Booking', `
      <input type="hidden" id="oId" value="${o.id}"/>
      <div class="form-grid fg2">
        <div class="form-group"><label class="form-label">Customer *</label>
          <select class="form-control" id="oCust">${H.customerSelect(o.customerId)}</select>
        </div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="oStatus">
            ${H.statusOptions(o.status||'enquiry',['enquiry','confirmed','editing','delivered'])}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Event Date</label><input class="form-control" id="oDate" type="date" value="${o.eventDate||''}"/></div>
        <div class="form-group"><label class="form-label">Event Type</label>
          <select class="form-control" id="oType">
            ${['Wedding','Pre-Wedding','Engagement','Baby Shower','Birthday','Other'].map(t=>`<option${t===o.eventType?' selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">Location / Venue</label><input class="form-control" id="oLoc" value="${H.esc(o.location||'')}"/></div>
        <div class="form-group"><label class="form-label">Package</label>
          <select class="form-control" id="oPkg">${H.packageSelect(o.packageId)}</select>
        </div>
        <div class="form-group"><label class="form-label">Total Amount (₹)</label><input class="form-control" id="oTotal" type="number" value="${o.total||0}"/></div>
        <div class="form-group"><label class="form-label">Advance Paid (₹)</label><input class="form-control" id="oAdv" type="number" value="${o.advance||0}"/></div>
        <div class="form-group"><label class="form-label">Expenses (₹)</label><input class="form-control" id="oExp" type="number" value="${o.expenses||0}"/></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">Notes</label><textarea class="form-control" id="oNotes">${H.esc(o.notes||'')}</textarea></div>
      </div>
      <div class="modal-foot" style="padding:0;margin-top:1.2rem">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Orders.save()">Update Booking</button>
      </div>`, 'modal-lg');
  },

  save() {
    const custId = document.getElementById('oCust').value;
    if (!custId) { App.toast('Select a customer','err'); return; }
    const cust = DB.getCustomer(custId);
    const pkgId = document.getElementById('oPkg').value;
    const pkg   = pkgId ? DB.packages().find(p=>p.id===pkgId) : null;
    const idEl  = document.getElementById('oId');
    const existing = idEl ? DB.getOrder(idEl.value) : null;
    const o = {
      id: idEl?idEl.value:DB.uid(),
      customerId:custId, customerName:cust?cust.name:'',
      status: document.getElementById('oStatus').value,
      eventDate: document.getElementById('oDate').value,
      eventType: document.getElementById('oType').value,
      location:  document.getElementById('oLoc').value.trim(),
      packageId: pkgId, packageName: pkg?pkg.name:'',
      total:    Number(document.getElementById('oTotal').value)||0,
      advance:  Number(document.getElementById('oAdv').value)||0,
      expenses: Number(document.getElementById('oExp').value)||0,
      notes:    document.getElementById('oNotes').value.trim(),
      createdAt: existing?existing.createdAt:new Date().toISOString()
    };
    DB.saveOrder(o);
    if (o.eventDate && !existing) {
      DB.saveEvent({ id:DB.uid(), orderId:o.id, customerId:custId, title:o.eventType+' — '+cust.name, date:o.eventDate, type:'shoot', location:o.location });
    }
    App.closeModal();
    App.toast(idEl?'Booking updated':'Booking created','ok');
    App.refreshBadge();
    document.getElementById('orderTbody').innerHTML=this.rows('all');
    document.querySelectorAll('#orderTabs .ftab').forEach(b=>b.classList.toggle('active',b.dataset.s==='all'));
  },

  del(id) {
    if (!confirm('Delete this booking?')) return;
    DB.delOrder(id);
    App.toast('Booking deleted');
    App.refreshBadge();
    document.getElementById('orderTbody').innerHTML=this.rows('all');
  },

  whatsappText(id) {
    const o = DB.getOrder(id);
    if (!o) return;
    const cust = DB.getCustomer(o.customerId) || { name: o.customerName, phone:'' };
    if (!cust.phone) { App.toast('No phone number for this customer','err'); return; }
    window.open('https://wa.me/91'+String(cust.phone).replace(/\D/g,''), '_blank');
  },

  shareQuote(id) {
    const o = DB.getOrder(id);
    if (!o) return;
    const cust = DB.getCustomer(o.customerId) || { name: o.customerName, phone:'', city:'', address:'' };
    const pkg  = o.packageId ? DB.packages().find(p=>p.id===o.packageId) : null;
    const events = DB.events().filter(e=>e.orderId===id);
    const quoteNum = 'QUOTE' + new Date(o.createdAt).toISOString().slice(0,10).replace(/-/g,'') + id.slice(-3).toUpperCase();
    const dateStr  = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'});
    const totalWords = this._numToWords(o.total||0);
    const balance = (o.total||0) - (o.advance||0);

    const evRows = events.length
      ? events.map((e,i)=>`<tr><td>${i+1}</td><td>${e.title||e.type||''}</td><td>${e.date ? new Date(e.date).toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+(e.time||'') : '—'}</td><td>${e.location||o.location||'—'}</td></tr>`).join('')
      : `<tr><td>1</td><td>${o.eventType||'Wedding'}</td><td>${o.eventDate?new Date(o.eventDate).toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'}):''}</td><td>${o.location||'—'}</td></tr>`;

    const pkgRows = pkg && pkg.items && pkg.items.length
      ? pkg.items.map((item,i)=>`<tr><td>${i+1}</td><td><strong>${item}</strong></td><td>1</td><td>INCLUDED</td></tr>`).join('')
      : `<tr><td colspan="4" style="text-align:center;padding:1rem">No package selected</td></tr>`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${quoteNum}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#222;background:#fff;padding:30px}
  .page{max-width:780px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:3px solid #e05424}
  .brand{display:flex;align-items:center;gap:12px}
  .brand-logo{width:90px;height:90px;border-radius:50%;object-fit:contain}
  .brand-name{font-size:18px;font-weight:700;color:#111}
  .brand-name span{color:#e05424}
  .brand-info{font-size:10px;color:#555;margin-top:4px;line-height:1.6}
  .billing-summary{text-align:right}
  .billing-summary h2{font-size:13px;font-weight:700;color:#e05424;letter-spacing:.1em;text-transform:uppercase}
  .billing-summary .qnum{font-size:11px;color:#555;margin-top:4px}
  .billing-summary .qdate{font-size:11px;color:#555}
  .billing-summary .terms{font-size:10px;background:#e05424;color:#fff;padding:2px 8px;border-radius:2px;display:inline-block;margin-top:4px}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
  .info-box{border:1px solid #e0e0e0;padding:12px}
  .info-box-title{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:#e05424;font-weight:600;margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px}
  .info-box p{font-size:11px;color:#333;line-height:1.7}
  .info-box strong{font-size:13px;color:#111}
  .section{margin:16px 0}
  .section-title{font-size:11px;font-weight:700;color:#111;margin-bottom:4px}
  .section-sub{font-size:10px;color:#888;margin-bottom:8px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#1a1a2e;color:#fff}
  thead th{padding:8px 10px;font-size:10px;font-weight:600;text-align:left;letter-spacing:.05em}
  tbody tr:nth-child(even){background:#f9f7f5}
  tbody td{padding:7px 10px;font-size:11px;border-bottom:1px solid #eee}
  .total-row{display:flex;justify-content:flex-end;margin-top:8px}
  .total-box{border:2px solid #e05424;padding:10px 20px;min-width:220px}
  .total-box .words{font-size:10px;color:#555;margin-bottom:4px}
  .total-box .amount{font-size:16px;font-weight:700;color:#e05424}
  .total-box .balance{font-size:14px;font-weight:600;color:#111;margin-top:6px;border-top:1px solid #eee;padding-top:6px;line-height:1.9}
  .thankyou{margin:16px 0;padding:10px 14px;border-left:3px solid #e05424;background:#fff8f6;font-size:11px;color:#555;line-height:1.7}
  .tc-section{margin:16px 0}
  .tc-title{font-size:11px;font-weight:700;text-align:center;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;color:#111}
  .tc-section ol{padding-left:18px}
  .tc-section li{font-size:10px;color:#444;line-height:1.8}
  .bank-box{margin-top:12px;border:1px solid #e0e0e0;padding:12px}
  .bank-box p{font-size:11px;color:#333;line-height:1.8}
  .footer-print{text-align:center;margin-top:16px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:10px}
  .no-print{background:#f7f5f3;border-bottom:1px solid #e8e3e0;padding:12px 20px;margin-bottom:24px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .btn-p{padding:9px 18px;font-size:12px;font-weight:600;border:none;cursor:pointer;letter-spacing:.06em;border-radius:3px;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
  .btn-print{background:#e05424;color:#fff}.btn-print:hover{background:#c04418}
  .btn-wa-pdf{background:#25D366;color:#fff}.btn-wa-pdf:hover{background:#1da851}
  .loading-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999;align-items:center;justify-content:center;flex-direction:column;gap:14px;color:#fff;font-size:14px;font-weight:600}
  .spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,.3);border-top-color:#25D366;border-radius:50%;animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media print{.no-print{display:none!important}body{padding:0}}
</style></head><body>
<div class="loading-overlay" id="loadingOverlay">
  <div class="spinner"></div>
  <div id="loadingMsg">Generating PDF…</div>
</div>
<div class="no-print">
  <button class="btn-p btn-print" id="savePdfBtn" onclick="saveAsPdf()">&#x1F4BE; Save as PDF</button>
  <button class="btn-p btn-wa-pdf" id="sharePdfBtn" onclick="sharePdfToWA()">&#x1F4CE; Share PDF on WhatsApp</button>
</div>
<script>
const PDF_FILENAME = ${JSON.stringify(quoteNum + '.pdf')};
const WA_PHONE = ${JSON.stringify(String(cust.phone || '').replace(/\\D/g, ''))};

async function waitForLibs(){
  for(let i=0;i<60;i++){
    if(window.html2canvas && window.jspdf) return;
    await new Promise(r=>setTimeout(r,100));
  }
  throw new Error('PDF libraries failed to load. Check your internet connection and try again.');
}

async function buildPdf(){
  await waitForLibs();
  const canvas = await html2canvas(document.querySelector('.page'),{scale:2,useCORS:true,logging:false,backgroundColor:'#fff'});
  const {jsPDF} = window.jspdf;
  const pdf = new jsPDF('p','mm','a4');
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const iw = canvas.width, ih = canvas.height;
  const ratio = pw / iw;
  let yPos=0, page=0;
  while(yPos<ih){
    if(page>0) pdf.addPage();
    const sliceH = Math.min(ih-yPos, ph/ratio);
    const sc = document.createElement('canvas');
    sc.width=iw; sc.height=sliceH;
    sc.getContext('2d').drawImage(canvas,0,yPos,iw,sliceH,0,0,iw,sliceH);
    pdf.addImage(sc.toDataURL('image/jpeg',0.92),'JPEG',0,0,pw,sliceH*ratio);
    yPos+=sliceH; page++;
  }
  return pdf;
}

function isIOS(){
  return /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
}

function downloadPdfBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  if(isIOS()){
    // iOS often ignores <a download> — open PDF so user can Share/Save
    const opened = window.open(url, '_blank');
    if(!opened){
      showToast('Tap and hold the PDF, then choose Save / Share');
      window.location.href = url;
    } else {
      showToast('PDF opened — use Share / Save in the browser menu');
    }
    setTimeout(()=>URL.revokeObjectURL(url), 60000);
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{
    try{ document.body.removeChild(a); }catch(e){}
    URL.revokeObjectURL(url);
  }, 4000);
}

async function canSharePdfFile(file){
  try{
    return !!(navigator.share && navigator.canShare && navigator.canShare({files:[file]}));
  }catch(e){
    return false;
  }
}

async function saveAsPdf(){
  const overlay=document.getElementById('loadingOverlay');
  const msg_el=document.getElementById('loadingMsg');
  const btn=document.getElementById('savePdfBtn');
  overlay.style.display='flex';
  if(btn) btn.disabled=true;
  try{
    msg_el.textContent='Generating PDF…';
    const pdf = await buildPdf();
    const blob = pdf.output('blob');
    downloadPdfBlob(blob, PDF_FILENAME);
    if(!isIOS()) showToast('PDF downloaded successfully');
  }catch(err){
    alert('Could not save PDF: '+(err.message||err));
    console.error(err);
  }
  overlay.style.display='none';
  if(btn) btn.disabled=false;
}

async function sharePdfToWA(){
  const overlay=document.getElementById('loadingOverlay');
  const msg_el=document.getElementById('loadingMsg');
  const btn=document.getElementById('sharePdfBtn');
  overlay.style.display='flex'; btn.disabled=true;
  try {
    msg_el.textContent='Generating PDF…';
    const pdf = await buildPdf();
    const blob = pdf.output('blob');
    const file = new File([blob], PDF_FILENAME, {type:'application/pdf'});

    // Prefer native share sheet with PDF only (no text template)
    if(await canSharePdfFile(file)){
      overlay.style.display='none';
      try{
        await navigator.share({ files:[file], title: PDF_FILENAME });
        btn.disabled=false; return;
      }catch(shareErr){
        if(shareErr && shareErr.name==='AbortError'){ btn.disabled=false; return; }
      }
    }

    // Fallback: download PDF, then open empty WhatsApp chat
    msg_el.textContent='Preparing download…';
    downloadPdfBlob(blob, PDF_FILENAME);
    await new Promise(r=>setTimeout(r,500));
    const phone = WA_PHONE ? ('91'+WA_PHONE.replace(/^91/,'')) : '';
    window.open(phone ? ('https://wa.me/'+phone) : 'https://wa.me/', '_blank');
    showToast('PDF saved — in WhatsApp tap 📎 and attach the downloaded PDF');
  } catch(err){
    if(!err || err.name!=='AbortError'){ alert('Error: '+(err && err.message ? err.message : err)); console.error(err); }
  }
  overlay.style.display='none'; btn.disabled=false;
}

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.style.display='block';
  setTimeout(()=>t.style.display='none',7000);
}
</script>
<div id="toast" style="display:none;position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:4px;font-size:12px;z-index:9999;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.3)">
  ✅ PDF downloaded successfully
</div>
<div class="page">
  <div class="header">
    <div class="brand">
      <img class="brand-logo" src="../assets/logo.png" onerror="this.style.display='none'"/>
      <div>
        <div class="brand-name">Artistry by <span>pradeep</span></div>
        <div class="brand-info">
          No.28 Kamachi Illam, Bhagath Singh Street, MG Nagar Phase 1<br>
          Urappakkam, Chennai<br>
          Mobile: 9962797802 &nbsp;|&nbsp; Email: Artistrybypradeep@gmail.com<br>
        </div>
      </div>
    </div>
    <div class="billing-summary">
      <h2>Billing Summary</h2>
      <div class="qnum">${quoteNum}</div>
      <div class="qdate">Date &nbsp; ${dateStr}</div>
      <div class="terms">Due on Receipt</div>
    </div>
  </div>

  <div class="two-col">
    <div class="info-box">
      <div class="info-box-title">Billed To</div>
      <p><strong>${cust.name||'—'}</strong><br>
      ${cust.address||cust.city||'Chennai'}</p>
    </div>
    <div class="info-box">
      <div class="info-box-title">Order Details</div>
      <p>Order Name &nbsp;&nbsp;&nbsp; <strong>${o.eventType||'Wedding'}</strong><br>
      Total Events &nbsp; <strong>${events.length||1}</strong></p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Event Schedule</div>
    <div class="section-sub">List of all events included in this order</div>
    <table>
      <thead><tr><th>#</th><th>Title</th><th>Date</th><th>Location</th></tr></thead>
      <tbody>${evRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Pricing Details</div>
    <div class="section-sub">Breakdown of services and charges</div>
    <table>
      <thead><tr><th>#</th><th>Name</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>${pkgRows}</tbody>
    </table>
    <div class="total-row">
      <div class="total-box">
        <div class="words">${totalWords}</div>
        <div class="amount">₹${Number(o.total||0).toLocaleString('en-IN')}.00</div>
        <div class="balance">Advance Paid: ₹${Number(o.advance||0).toLocaleString('en-IN')}<br><strong>Balance Due: ₹${Number(balance).toLocaleString('en-IN')}</strong></div>
      </div>
    </div>
  </div>

  <div class="thankyou">
    Thank you for choosing Artistry by pradeep<br>We appreciate your business.
  </div>

  <div class="tc-section">
    <div class="tc-title">Terms &amp; Conditions</div>
    <ol>
      <li>Booking Fee: 50% advance to confirm the date (non-refundable).</li>
      <li>Delivery Timeline: Final deliverables will be provided After client done final selection within [6]weeks.</li>
      <li>Travel &amp; Accommodation: Additional charges apply if the event is outside [City/Region].</li>
      <li>Payment Method: Account Type - Savings</li>
    </ol>
    <div class="bank-box">
      <p>
        Account Name - Pradeep selvaraj<br>
        Account Number - 7704618858<br>
        Bank IFSC - IDIB000P169<br>
        Branch Name - PERUNGALATHUR
      </p>
    </div>
  </div>

  <div class="footer-print">Generated by Artistry by Pradeep Admin Panel &nbsp;|&nbsp; ${quoteNum}</div>
</div>
<script>
  setTimeout(function(){ if(window.matchMedia('print').matches || navigator.userAgent.indexOf('Chrome')>-1) {} }, 100);
</script>
</body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  },

  _numToWords(n) {
    if (!n) return 'Zero Rupees Only';
    const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    function words(num) {
      if (num===0) return '';
      if (num<20) return a[num]+' ';
      if (num<100) return b[Math.floor(num/10)]+' '+(num%10?a[num%10]+' ':'');
      if (num<1000) return a[Math.floor(num/100)]+' Hundred '+(num%100?words(num%100):'');
      if (num<100000) return words(Math.floor(num/1000))+'Thousand '+(num%1000?words(num%1000):'');
      if (num<10000000) return words(Math.floor(num/100000))+'Lakh '+(num%100000?words(num%100000):'');
      return words(Math.floor(num/10000000))+'Crore '+(num%10000000?words(num%10000000):'');
    }
    return words(Math.floor(n)).trim()+' Rupees Only';
  }
};

/* ════════════════════════════════════════
   CALENDAR MODULE
   ════════════════════════════════════════ */
const Cal = {
  current: new Date(),

  render() {
    const y=this.current.getFullYear(), m=this.current.getMonth();
    const first=new Date(y,m,1).getDay();
    const days=new Date(y,m+1,0).getDate();
    const events=DB.events();
    const todayStr=new Date().toISOString().slice(0,10);
    const upcoming=events.filter(e=>e.date>=todayStr).slice(0,8);

    let cells='';
    for(let i=0;i<first;i++) cells+=`<div class="cal-cell empty"></div>`;
    for(let d=1;d<=days;d++){
      const dateStr=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayEvs=events.filter(e=>e.date===dateStr);
      cells+=`<div class="cal-cell${dateStr===todayStr?' today':''}${dayEvs.length?' has-events':''}">
        <div class="cal-dn">${d}</div>
        ${dayEvs.slice(0,2).map(e=>`<div class="cal-ev" title="${H.esc(e.title)}" onclick="Cal.showEvent('${e.id}')" style="cursor:pointer">${H.esc(e.title)}</div>`).join('')}
        ${dayEvs.length>2?`<div style="font-size:.55rem;color:var(--orange)">+${dayEvs.length-2} more</div>`:''}
      </div>`;
    }

    const upcomingHtml = upcoming.length ? upcoming.map(e=>{
      const d=new Date(e.date);
      return `<div class="ev-item">
        <div class="ev-badge">
          <div class="ev-day">${d.getDate()}</div>
          <div class="ev-mon">${d.toLocaleString('en-IN',{month:'short'})}</div>
        </div>
        <div class="ev-info" onclick="Cal.showEvent('${e.id}')" style="cursor:pointer;flex:1">
          <div class="ev-title">${H.esc(e.title)}</div>
          <div class="ev-sub">${H.esc(e.location||e.type||'')}</div>
        </div>
        <button class="btn-icon btn-sm" onclick="Cal.delEv('${e.id}')" title="Remove">${H.svgIcon('del')}</button>
      </div>`;
    }).join('') : `<div class="empty" style="padding:1.5rem"><div class="empty-sub">No upcoming events</div></div>`;

    return `
      <div class="cal-wrap">
        <div class="cal-nav">
          <button class="btn btn-ghost btn-sm" onclick="Cal.prev()">‹ Prev</button>
          <div class="cal-month">${this.current.toLocaleString('en-IN',{month:'long',year:'numeric'})}</div>
          <button class="btn btn-ghost btn-sm" onclick="Cal.next()">Next ›</button>
        </div>
        <div class="cal-dow">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<span>${d}</span>`).join('')}
        </div>
        <div class="cal-days">${cells}</div>
      </div>
      <div class="upcoming-panel">
        <div class="upcoming-title">Upcoming Events</div>
        ${upcomingHtml}
      </div>`;
  },

  prev() {
    this.current.setMonth(this.current.getMonth()-1);
    document.getElementById('calGrid').innerHTML=this.render();
  },
  next() {
    this.current.setMonth(this.current.getMonth()+1);
    document.getElementById('calGrid').innerHTML=this.render();
  },

  openAdd() {
    App.modal('Add Event', `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Event Title *</label><input class="form-control" id="evTitle"/></div>
        <div class="form-grid fg2">
          <div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="evDate" type="date"/></div>
          <div class="form-group"><label class="form-label">Type</label>
            <select class="form-control" id="evType">
              <option>Shoot</option><option>Delivery</option><option>Meeting</option><option>Follow-up</option><option>Other</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="evLoc"/></div>
        <div class="form-group"><label class="form-label">Customer (optional)</label>
          <select class="form-control" id="evCust"><option value="">—</option>${H.customerSelect()}</select>
        </div>
      </div>
      <div class="modal-foot" style="padding:0;margin-top:1.2rem">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Cal.saveEv()">Add Event</button>
      </div>`);
  },

  saveEv() {
    const title = document.getElementById('evTitle').value.trim();
    const date  = document.getElementById('evDate').value;
    if (!title||!date) { App.toast('Title and date are required','err'); return; }
    DB.saveEvent({
      id:DB.uid(), title, date,
      type: document.getElementById('evType').value,
      location: document.getElementById('evLoc').value.trim(),
      customerId: document.getElementById('evCust').value
    });
    App.closeModal();
    App.toast('Event added','ok');
    document.getElementById('calGrid').innerHTML=this.render();
  },

  showEvent(id) {
    const e = DB.events().find(ev=>ev.id===id);
    if (!e) return;
    const cust   = e.customerId ? DB.getCustomer(e.customerId) : null;
    const order  = e.orderId    ? DB.getOrder(e.orderId)       : null;
    const dObj   = e.date ? new Date(e.date) : null;
    const dateDisp = dObj ? dObj.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '—';
    const daysLeft = dObj ? Math.ceil((dObj - new Date()) / 86400000) : null;
    const daysTag  = daysLeft !== null
      ? daysLeft < 0
        ? `<span style="background:#fee2e2;color:#dc2626;padding:2px 10px;font-size:.65rem;letter-spacing:.1em">PAST</span>`
        : daysLeft === 0
          ? `<span style="background:#fef9c3;color:#b45309;padding:2px 10px;font-size:.65rem;letter-spacing:.1em">TODAY</span>`
          : `<span style="background:#dcfce7;color:#16a34a;padding:2px 10px;font-size:.65rem;letter-spacing:.1em">IN ${daysLeft} DAY${daysLeft>1?'S':''}</span>`
      : '';

    App.modal(e.title, `
      <div style="display:flex;flex-direction:column;gap:1rem">
        <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
          <span style="font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;background:var(--orange);color:#fff;padding:3px 10px">${H.esc(e.type||'Event')}</span>
          ${daysTag}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.9rem">
          <div>
            <div style="font-size:.58rem;letter-spacing:.15em;text-transform:uppercase;color:var(--gray);margin-bottom:.3rem">Date</div>
            <div style="font-size:.92rem;color:var(--text);font-weight:500">${dateDisp}</div>
          </div>
          <div>
            <div style="font-size:.58rem;letter-spacing:.15em;text-transform:uppercase;color:var(--gray);margin-bottom:.3rem">Location</div>
            <div style="font-size:.92rem;color:var(--text)">${H.esc(e.location||'—')}</div>
          </div>
          ${cust ? `
          <div>
            <div style="font-size:.58rem;letter-spacing:.15em;text-transform:uppercase;color:var(--gray);margin-bottom:.3rem">Customer</div>
            <div style="font-size:.92rem;color:var(--text);font-weight:500">${H.esc(cust.name)}</div>
            <div style="font-size:.75rem;color:var(--gray);margin-top:2px">${H.esc(cust.phone||'')}</div>
          </div>` : ''}
          ${order ? `
          <div>
            <div style="font-size:.58rem;letter-spacing:.15em;text-transform:uppercase;color:var(--gray);margin-bottom:.3rem">Booking</div>
            <div style="font-size:.92rem;color:var(--text)">${H.esc(order.eventType||'—')}</div>
            <div style="font-size:.75rem;color:var(--gray);margin-top:2px">Package: ${H.esc(order.packageName||'—')}</div>
          </div>
          <div>
            <div style="font-size:.58rem;letter-spacing:.15em;text-transform:uppercase;color:var(--gray);margin-bottom:.3rem">Total</div>
            <div style="font-size:.92rem;color:var(--text)">${H.money(order.total)}</div>
            <div style="font-size:.75rem;color:var(--gray);margin-top:2px">Advance: ${H.money(order.advance)} &nbsp;|&nbsp; Balance: ${H.money((order.total||0)-(order.advance||0))}</div>
          </div>
          <div>
            <div style="font-size:.58rem;letter-spacing:.15em;text-transform:uppercase;color:var(--gray);margin-bottom:.3rem">Status</div>
            <div style="margin-top:2px">${H.badge(order.status||'enquiry')}</div>
          </div>` : ''}
        </div>
        ${cust && cust.phone ? `
        <div style="display:flex;gap:.6rem;flex-wrap:wrap;border-top:1px solid var(--border);padding-top:.9rem">
          <a href="tel:${H.esc(cust.phone)}" class="btn btn-ghost btn-sm" style="text-decoration:none">📞 Call ${H.esc(cust.name)}</a>
          <a href="https://wa.me/91${H.esc(cust.phone)}" target="_blank" class="btn btn-sm" style="background:#25D366;color:#fff;border:none;text-decoration:none">💬 WhatsApp</a>
          ${order ? `<button class="btn btn-sm" style="background:var(--orange);color:#fff;border:none" onclick="App.closeModal();Orders.shareQuote('${order.id}')">📄 View Quote</button>` : ''}
        </div>` : ''}
        <div style="border-top:1px solid var(--border);padding-top:.9rem;display:flex;justify-content:flex-end">
          <button class="btn btn-danger btn-sm" onclick="App.closeModal();Cal.delEv('${e.id}')">Delete Event</button>
        </div>
      </div>`);
  },

  delEv(id) {
    if (!confirm('Remove this event?')) return;
    DB.delEvent(id);
    document.getElementById('calGrid').innerHTML=this.render();
  }
};

/* ════════════════════════════════════════
   INVOICES MODULE
   ════════════════════════════════════════ */
const Inv = {
  rows(status='all') {
    let list=DB.invoices();
    if(status!=='all') list=list.filter(v=>v.status===status);
    list=list.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    if(!list.length) return `<tr><td colspan="8"><div class="empty"><div class="empty-title">No invoices yet</div></div></td></tr>`;
    return list.map(v=>{
      const bal=(v.total||0)-(v.paid||0);
      return `<tr>
        <td><strong>${H.esc(v.number)}</strong></td>
        <td>${H.esc(v.customerName||'—')}</td>
        <td>${H.date(v.createdAt)}</td>
        <td>${H.money(v.total)}</td>
        <td>${H.money(v.paid)}</td>
        <td style="color:${bal>0?'var(--danger)':'var(--success)'}">${H.money(bal)}</td>
        <td>${H.badge(v.status||'draft')}</td>
        <td><div class="action-btns">
          <button class="btn-icon" onclick="Inv.openView('${v.id}')" title="View">${H.svgIcon('eye')}</button>
          <button class="btn-icon" onclick="Inv.openEdit('${v.id}')" title="Edit">${H.svgIcon('edit')}</button>
          <button class="btn-icon" onclick="Inv.shareWA('${v.id}')" title="WhatsApp">${H.svgIcon('wa')}</button>
          <button class="btn-icon" onclick="Inv.del('${v.id}')" title="Delete">${H.svgIcon('del')}</button>
        </div></td>
      </tr>`;
    }).join('');
  },

  tab(el,s) {
    document.querySelectorAll('.filter-tabs .ftab').forEach(b=>b.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('invTbody').innerHTML=this.rows(s);
  },

  openCreate() {
    App.modal('Create Invoice', this._form(), 'modal-lg');
    this._bindLI();
  },

  openEdit(id) {
    const v=DB.getInvoice(id);
    if(!v) return;
    App.modal('Edit Invoice', this._form(v), 'modal-lg');
    this._bindLI();
  },

  _form(v=null) {
    const items = v?.items || [{ desc:'', qty:1, rate:0 }];
    return `
      <input type="hidden" id="vId" value="${v?v.id:''}"/>
      <div class="form-grid fg2" style="margin-bottom:1rem">
        <div class="form-group"><label class="form-label">Customer *</label>
          <select class="form-control" id="vCust">${H.customerSelect(v?.customerId)}</select>
        </div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="vStatus">
            ${H.statusOptions(v?.status||'draft',['draft','sent','partial','paid','overdue'])}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Invoice Date</label>
          <input class="form-control" id="vDate" type="date" value="${v?.createdAt?v.createdAt.slice(0,10):new Date().toISOString().slice(0,10)}"/>
        </div>
        <div class="form-group"><label class="form-label">Due Date</label>
          <input class="form-control" id="vDue" type="date" value="${v?.dueDate||''}"/>
        </div>
        <div class="form-group"><label class="form-label">Amount Paid (₹)</label>
          <input class="form-control" id="vPaid" type="number" value="${v?.paid||0}" oninput="Inv.calcTotals()"/>
        </div>
        <div class="form-group"><label class="form-label">GST (18%)</label>
          <select class="form-control" id="vGst" onchange="Inv.calcTotals()">
            <option value="0"${(!v?.gst)?' selected':''}>No GST</option>
            <option value="1"${v?.gst?' selected':''}>Include 18% GST</option>
          </select>
        </div>
      </div>
      <div class="li-head">
        <span>Description</span><span>Qty</span><span>Rate (₹)</span><span>Amount</span><span></span>
      </div>
      <div id="liRows">
        ${items.map((it,i)=>this._liRow(i,it.desc,it.qty,it.rate)).join('')}
      </div>
      <button class="btn btn-ghost btn-sm" style="margin-top:.5rem" onclick="Inv.addLI()">${H.svgIcon('plus')} Add Item</button>
      <div style="margin-top:1.2rem;display:flex;justify-content:flex-end">
        <div style="width:240px">
          <div class="inv-row"><span>Subtotal</span><span id="vSubtotal">₹0</span></div>
          <div class="inv-row" id="vGstRow" style="display:none"><span>GST 18%</span><span id="vGstAmt">₹0</span></div>
          <div class="inv-row grand"><span>Total</span><span id="vTotal">₹0</span></div>
          <div class="inv-row paid-row"><span>Paid</span><span id="vPaidShow">₹0</span></div>
          <div class="inv-row balance-row"><span>Balance</span><span id="vBal">₹0</span></div>
        </div>
      </div>
      <div class="modal-foot" style="padding:0;margin-top:1.2rem">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Inv.save()">Save Invoice</button>
      </div>`;
  },

  _liRow(i,desc='',qty=1,rate=0) {
    const amt=Number(qty)*Number(rate);
    return `<div class="li-row" id="li${i}">
      <input placeholder="Item description" value="${H.esc(desc)}" oninput="Inv.calcTotals()"/>
      <input type="number" value="${qty}" min="1" oninput="Inv.calcTotals()"/>
      <input type="number" value="${rate}" min="0" oninput="Inv.calcTotals()"/>
      <div class="li-total" id="liAmt${i}">${H.money(amt)}</div>
      <button class="li-del" onclick="Inv.delLI(${i})">${H.svgIcon('del')}</button>
    </div>`;
  },

  _liIdx:0,
  _bindLI() { this._liIdx=document.querySelectorAll('#liRows .li-row').length; this.calcTotals(); },

  addLI() {
    document.getElementById('liRows').insertAdjacentHTML('beforeend',this._liRow(this._liIdx++));
    this.calcTotals();
  },

  delLI(i) {
    const el=document.getElementById('li'+i);
    if(el) el.remove();
    this.calcTotals();
  },

  calcTotals() {
    const rows=document.querySelectorAll('#liRows .li-row');
    let sub=0;
    rows.forEach((row,i)=>{
      const inputs=row.querySelectorAll('input');
      const qty=Number(inputs[1]?.value)||0, rate=Number(inputs[2]?.value)||0;
      const amt=qty*rate; sub+=amt;
      const amtEl=row.querySelector('.li-total');
      if(amtEl) amtEl.textContent=H.money(amt);
    });
    const useGst=document.getElementById('vGst')?.value==='1';
    const gstAmt=useGst?sub*.18:0;
    const total=sub+gstAmt;
    const paid=Number(document.getElementById('vPaid')?.value)||0;
    const bal=total-paid;
    document.getElementById('vSubtotal').textContent=H.money(sub);
    const gstRow=document.getElementById('vGstRow');
    if(gstRow) gstRow.style.display=useGst?'flex':'none';
    document.getElementById('vGstAmt').textContent=H.money(gstAmt);
    document.getElementById('vTotal').textContent=H.money(total);
    document.getElementById('vPaidShow').textContent=H.money(paid);
    document.getElementById('vBal').textContent=H.money(bal);
    return {sub,gstAmt,total,paid,bal,useGst};
  },

  getItems() {
    const rows=document.querySelectorAll('#liRows .li-row');
    return Array.from(rows).map(row=>{
      const inputs=row.querySelectorAll('input');
      return { desc:inputs[0].value.trim(), qty:Number(inputs[1].value)||1, rate:Number(inputs[2].value)||0 };
    }).filter(it=>it.desc);
  },

  save() {
    const custId=document.getElementById('vCust').value;
    if(!custId){App.toast('Select a customer','err');return;}
    const cust=DB.getCustomer(custId);
    const idEl=document.getElementById('vId');
    const existing=idEl?.value?DB.getInvoice(idEl.value):null;
    const t=this.calcTotals();
    const v={
      id: existing?existing.id:DB.uid(),
      number: existing?existing.number:DB.nextInvNum(),
      customerId:custId, customerName:cust?cust.name:'',
      status:document.getElementById('vStatus').value,
      createdAt:(document.getElementById('vDate').value||new Date().toISOString().slice(0,10)),
      dueDate:document.getElementById('vDue').value,
      items:this.getItems(),
      subtotal:t.sub, gst:t.useGst, gstAmt:t.gstAmt, total:t.total,
      paid:Number(document.getElementById('vPaid').value)||0,
    };
    DB.saveInvoice(v);
    App.closeModal();
    App.toast(existing?'Invoice updated':'Invoice created','ok');
    App.refreshBadge();
    document.getElementById('invTbody').innerHTML=this.rows('all');
  },

  openView(id) {
    const v=DB.getInvoice(id);
    if(!v) return;
    const bal=(v.total||0)-(v.paid||0);
    App.modal('Invoice — '+v.number, `
      <div class="inv-preview" id="invPrintArea">
        <div class="inv-top">
          <div class="inv-from">
            <strong>Artistry by Pradeep</strong>
            Urappakkam, Chennai<br>
            +91 99627 97802<br>
            artistrybypradeep@gmail.com
          </div>
          <div class="inv-to">
            <span class="inv-num">${H.esc(v.number)}</span>
            <strong>${H.esc(v.customerName)}</strong>
            <div class="inv-meta">
              <span>Date:</span><span>${H.date(v.createdAt)}</span>
              <span>Due:</span><span>${H.date(v.dueDate)||'—'}</span>
              <span>Status:</span><span>${v.status}</span>
            </div>
          </div>
        </div>
        <div class="inv-items">
          <table>
            <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
            <tbody>
              ${(v.items||[]).map(it=>`<tr><td>${H.esc(it.desc)}</td><td>${it.qty}</td><td>${H.money(it.rate)}</td><td>${H.money(it.qty*it.rate)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="inv-totals">
          <div class="inv-row"><span>Subtotal</span><span>${H.money(v.subtotal)}</span></div>
          ${v.gst?`<div class="inv-row"><span>GST 18%</span><span>${H.money(v.gstAmt)}</span></div>`:''}
          <div class="inv-row grand"><span>Total</span><span>${H.money(v.total)}</span></div>
          <div class="inv-row paid-row"><span>Paid</span><span>${H.money(v.paid)}</span></div>
          <div class="inv-row balance-row"><span>Balance Due</span><span>${H.money(bal)}</span></div>
        </div>
      </div>
      <div style="display:flex;gap:.7rem;margin-top:1.2rem" class="no-print">
        <button class="btn btn-outline" onclick="window.print()">${H.svgIcon('print')} Print</button>
        <button class="btn btn-ghost" onclick="Inv.shareWA('${v.id}')">${H.svgIcon('wa')} WhatsApp</button>
        <button class="btn btn-ghost" onclick="App.closeModal()">Close</button>
      </div>`, 'modal-lg');
  },

  shareWA(id) {
    const v=DB.getInvoice(id);
    if(!v) return;
    const custPhone = String(DB.getCustomer(v.customerId)?.phone||'').replace(/\D/g,'');
    if(!custPhone){ App.toast('No phone number for this customer','err'); return; }
    window.open('https://wa.me/91'+custPhone,'_blank');
  },

  del(id) {
    if(!confirm('Delete this invoice?')) return;
    DB.delInvoice(id);
    App.toast('Invoice deleted');
    App.refreshBadge();
    document.getElementById('invTbody').innerHTML=this.rows('all');
  }
};

/* ════════════════════════════════════════
   PACKAGES MODULE
   ════════════════════════════════════════ */
const Pkgs = {
  cards() {
    const list=DB.packages();
    if(!list.length) return `<div class="empty" style="grid-column:1/-1"><div class="empty-title">No packages</div></div>`;
    return list.map(p=>`
      <div class="pkg-card">
        <div class="pkg-name">${H.esc(p.name)}</div>
        <div class="pkg-price">${p.price?H.money(p.price):'Price on request'}</div>
        <ul class="pkg-items">${(p.items||[]).map(i=>`<li>${H.esc(i)}</li>`).join('')}</ul>
        <div class="pkg-foot">
          <button class="btn btn-ghost btn-sm" onclick="Pkgs.openEdit('${p.id}')">${H.svgIcon('edit')} Edit</button>
          <button class="btn btn-danger btn-sm" onclick="Pkgs.del('${p.id}')">${H.svgIcon('del')} Delete</button>
        </div>
      </div>`).join('');
  },

  openAdd() {
    App.modal('New Package', `
      <div class="form-grid">
        <div class="form-grid fg2">
          <div class="form-group"><label class="form-label">Package Name *</label><input class="form-control" id="pName"/></div>
          <div class="form-group"><label class="form-label">Price (₹)</label><input class="form-control" id="pPrice" type="number" min="0"/></div>
        </div>
        <div class="form-group">
          <label class="form-label">Items / Includes (one per line)</label>
          <textarea class="form-control" id="pItems" style="min-height:150px" placeholder="Traditional Photography&#10;Candid Photography&#10;Album 2 Nos"></textarea>
        </div>
      </div>
      <div class="modal-foot" style="padding:0;margin-top:1.2rem">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Pkgs.save()">Save Package</button>
      </div>`);
  },

  openEdit(id) {
    const p=DB.packages().find(x=>x.id===id);
    if(!p) return;
    App.modal('Edit Package', `
      <input type="hidden" id="pId" value="${p.id}"/>
      <div class="form-grid">
        <div class="form-grid fg2">
          <div class="form-group"><label class="form-label">Package Name *</label><input class="form-control" id="pName" value="${H.esc(p.name)}"/></div>
          <div class="form-group"><label class="form-label">Price (₹)</label><input class="form-control" id="pPrice" type="number" min="0" value="${p.price||0}"/></div>
        </div>
        <div class="form-group">
          <label class="form-label">Items (one per line)</label>
          <textarea class="form-control" id="pItems" style="min-height:150px">${H.esc((p.items||[]).join('\n'))}</textarea>
        </div>
      </div>
      <div class="modal-foot" style="padding:0;margin-top:1.2rem">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Pkgs.save()">Update Package</button>
      </div>`);
  },

  save() {
    const name=document.getElementById('pName').value.trim();
    if(!name){App.toast('Name required','err');return;}
    const idEl=document.getElementById('pId');
    const p={
      id:idEl?idEl.value:DB.uid(),
      name, price:Number(document.getElementById('pPrice').value)||0,
      items:document.getElementById('pItems').value.split('\n').map(s=>s.trim()).filter(Boolean)
    };
    DB.savePackage(p);
    App.closeModal();
    App.toast(idEl?'Package updated':'Package added','ok');
    document.getElementById('pkgGrid').innerHTML=this.cards();
  },

  del(id) {
    if(!confirm('Delete this package?')) return;
    DB.delPackage(id);
    App.toast('Package deleted');
    document.getElementById('pkgGrid').innerHTML=this.cards();
  }
};

/* ════════════════════════════════════════
   ALBUMS MODULE
   ════════════════════════════════════════ */
const Albums = {
  _fmtSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  cards() {
    const list=DB.albums();
    if(!list.length) return `<div class="empty" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <div class="empty-title">No albums saved yet</div>
      <div class="empty-sub">Upload a PDF album, save it, then share to the customer on WhatsApp</div>
    </div>`;
    return list.map(a=>{
      const forever = a.forever || !a.expiry;
      const expired = !forever && a.expiry && new Date(a.expiry) < new Date();
      const status = forever
        ? '<span style="color:#16a34a">Forever</span>'
        : (expired ? '<span style="color:var(--danger)">Expired</span>' : H.date(a.expiry));
      const fileLabel = a.fileName
        ? `${H.esc(a.fileName)}${a.fileSize ? ' · ' + this._fmtSize(a.fileSize) : ''}`
        : (a.pdfUrl ? 'External link' : 'No PDF');
      return `
      <div class="album-card">
        <div class="album-thumb">
          <svg viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
        </div>
        <div class="album-body">
          <div class="album-title">${H.esc(a.title)}</div>
          <div class="album-meta">${H.esc(a.customerName||'—')} · ${status}</div>
          <div class="album-file-row" title="${H.esc(a.fileName||a.pdfUrl||'')}">${fileLabel}</div>
          <div class="album-actions">
            <button class="btn btn-outline btn-sm" onclick="Albums.preview('${a.id}')">${H.svgIcon('eye')} Preview</button>
            <button class="btn btn-danger btn-sm" onclick="Albums.del('${a.id}')">${H.svgIcon('del')} Delete</button>
            <button class="btn btn-wa-share btn-sm" onclick="Albums.share('${a.id}')">${H.svgIcon('wa')} Share</button>
          </div>
        </div>
      </div>`;
    }).join('');
  },

  openAdd() {
    App.modal('Save Album', `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Album Title *</label><input class="form-control" id="aTitle" placeholder="Mr. & Mrs. Kumar Wedding Album"/></div>
        <div class="form-group"><label class="form-label">Customer</label>
          <select class="form-control" id="aCust"><option value="">—</option>${H.customerSelect()}</select>
          <small style="font-size:.65rem;color:var(--gray);margin-top:.3rem;display:block">Select customer so Share can open their WhatsApp</small>
        </div>
        <div class="form-group">
          <label class="form-label">PDF File *</label>
          <label class="file-upload" for="aPdfFile">
            <input type="file" id="aPdfFile" accept="application/pdf,.pdf" onchange="Albums.onFilePick(this)"/>
            <span class="file-upload-btn">Choose PDF</span>
            <span class="file-upload-name" id="aPdfName">No file selected</span>
          </label>
          <small style="font-size:.65rem;color:var(--gray);margin-top:.3rem;display:block">Upload the album PDF · access is forever (no expiry)</small>
        </div>
      </div>
      <div class="modal-foot" style="padding:0;margin-top:1.2rem">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="aSaveBtn" onclick="Albums.save()">Save</button>
      </div>`);
  },

  onFilePick(input) {
    const nameEl = document.getElementById('aPdfName');
    const file = input.files && input.files[0];
    if (!nameEl) return;
    nameEl.textContent = file ? `${file.name} (${this._fmtSize(file.size)})` : 'No file selected';
  },

  async save() {
    const title = document.getElementById('aTitle').value.trim();
    const fileInput = document.getElementById('aPdfFile');
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (!title) { App.toast('Album title is required', 'err'); return; }
    if (!file) { App.toast('Please choose a PDF file', 'err'); return; }
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf) { App.toast('Only PDF files are allowed', 'err'); return; }
    if (file.size > 40 * 1024 * 1024) { App.toast('PDF is too large (max 40 MB)', 'err'); return; }

    const btn = document.getElementById('aSaveBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    try {
      const custId = document.getElementById('aCust').value;
      const cust = custId ? DB.getCustomer(custId) : null;
      const id = DB.uid();
      await AlbumFiles.put(id, file, { fileName: file.name });
      const a = {
        id,
        title,
        customerId: custId || '',
        customerName: cust ? cust.name : '',
        fileName: file.name,
        fileSize: file.size,
        pdfUrl: '',
        token: DB.uid() + DB.uid(),
        expiry: null,
        forever: true,
        views: 0,
        createdAt: new Date().toISOString()
      };
      DB.saveAlbum(a);
      App.closeModal();
      App.toast('Album saved!', 'ok');
      document.getElementById('albumGrid').innerHTML = this.cards();
    } catch (err) {
      console.error(err);
      App.toast('Could not save PDF: ' + (err.message || err), 'err');
      if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
    }
  },

  async preview(id) {
    const a = DB.getAlbum(id);
    if (!a) return;
    try {
      const stored = await AlbumFiles.get(id);
      if (stored && stored.blob) {
        const url = URL.createObjectURL(stored.blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
      }
    } catch (e) { console.error(e); }
    if (a.pdfUrl) { window.open(a.pdfUrl, '_blank'); return; }
    App.toast('PDF file not found on this device', 'err');
  },

  async share(id) {
    const a = DB.getAlbum(id);
    if (!a) return;
    const cust = a.customerId ? DB.getCustomer(a.customerId) : null;
    const phoneRaw = String((cust && cust.phone) || '').replace(/\D/g, '');
    if (!phoneRaw) {
      App.toast('Add a customer with phone number to share on WhatsApp', 'err');
      return;
    }
    const phone = '91' + phoneRaw.replace(/^91/, '');

    try {
      const stored = await AlbumFiles.get(id);
      if (stored && stored.blob) {
        const fileName = a.fileName || stored.fileName || 'album.pdf';
        const file = new File([stored.blob], fileName, { type: 'application/pdf' });
        let canFiles = false;
        try { canFiles = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { canFiles = false; }
        if (canFiles) {
          await navigator.share({ files: [file], title: fileName });
          App.toast('Shared!', 'ok');
          return;
        }
        // Fallback: download PDF, open empty WhatsApp chat
        const url = URL.createObjectURL(stored.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { try { document.body.removeChild(link); } catch (e) {} URL.revokeObjectURL(url); }, 4000);
        window.open('https://wa.me/' + phone, '_blank');
        App.toast('PDF downloaded — in WhatsApp tap 📎 to attach it', 'ok');
        return;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      console.error(err);
    }

    // Legacy albums that only have an external URL — open chat only (no template)
    if (a.pdfUrl) {
      window.open('https://wa.me/' + phone, '_blank');
      return;
    }
    App.toast('PDF file not found on this device. Re-save the album PDF.', 'err');
  },

  del(id) {
    if (!confirm('Delete this album?')) return;
    DB.delAlbum(id);
    App.toast('Album deleted');
    document.getElementById('albumGrid').innerHTML = this.cards();
  }
};

/* ════════════════════════════════════════
   SETTINGS MODULE
   ════════════════════════════════════════ */
const Settings = {
  save() {
    const u=document.getElementById('setUser').value.trim();
    const p=document.getElementById('setPass').value;
    const p2=document.getElementById('setPass2').value;
    if(!u){App.toast('Username required','err');return;}
    if(p&&p!==p2){App.toast('Passwords do not match','err');return;}
    const cur=DB.getAuth();
    DB.setAuth(u, p||cur.pass);
    sessionStorage.setItem('abp_u',u);
    document.getElementById('sUser').textContent=u;
    document.getElementById('sAvatar').textContent=u[0].toUpperCase();
    App.toast('Settings saved!','ok');
    document.getElementById('setPass').value='';
    document.getElementById('setPass2').value='';
  },
  exportData() {
    const data={customers:DB.customers(),orders:DB.orders(),invoices:DB.invoices(),packages:DB.packages(),albums:DB.albums(),events:DB.events()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='artistry-data-'+new Date().toISOString().slice(0,10)+'.json';a.click();
    App.toast('Data exported!','ok');
  },
  clearData() {
    if(!confirm('This will permanently delete ALL customers, orders, invoices, albums and events. Are you absolutely sure?')) return;
    if(!confirm('Last warning — this cannot be undone!')) return;
    ['customers','orders','invoices','albums','events'].forEach(k=>localStorage.removeItem('abp_'+k));
    App.toast('All data cleared','ok');
    location.hash='dashboard';App.route('dashboard');
  }
};

/* ════════════════════════════════════════
   BOOT
   ════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', ()=>App.init());
