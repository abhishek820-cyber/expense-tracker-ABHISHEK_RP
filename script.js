(() => {
  'use strict';
  const KEY = 'expense-tracker:v1';
  const CATEGORIES = {
    expense: ['Food', 'Transport', 'Rent', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other'],
    income: ['Salary', 'Freelance', 'Gift', 'Investment', 'Other']
  };
  const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  const $ = id => document.getElementById(id);

  let transactions = load();
  let editingId = null;

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(transactions)); }
    catch { alert('Could not save data. Your browser storage may be full or disabled.'); }
  }
  const today = () => new Date().toISOString().slice(0, 10);
  const thisMonth = () => today().slice(0, 7);
  const currentType = () => document.querySelector('input[name=type]:checked').value;

  // ---------- Form ----------
  function fillCategories() {
    const sel = $('category'), prev = sel.value;
    sel.innerHTML = '<option value="">Select a category</option>';
    CATEGORIES[currentType()].forEach(c => sel.add(new Option(c, c)));
    if (CATEGORIES[currentType()].includes(prev)) sel.value = prev;
  }
  function fillFilterCategories() {
    const sel = $('fCategory'), prev = sel.value || 'all';
    const all = [...new Set([...CATEGORIES.expense, ...CATEGORIES.income])];
    sel.innerHTML = '';
    sel.add(new Option('All categories', 'all'));
    all.forEach(c => sel.add(new Option(c, c)));
    sel.value = prev;
  }
  function setError(field, msg) {
    $(field + 'Err').textContent = msg;
    $(field).classList.toggle('invalid', !!msg);
  }
  function validate() {
    const amount = parseFloat($('amount').value);
    const errs = {
      amount: !$('amount').value ? 'Enter an amount.' :
        (isNaN(amount) || amount <= 0) ? 'Amount must be greater than 0.' :
        amount > 1e9 ? 'Amount is too large.' : '',
      category: $('category').value ? '' : 'Choose a category.',
      date: !$('date').value ? 'Pick a date.' : '',
      description: !$('description').value.trim() ? 'Add a short description.' : ''
    };
    Object.entries(errs).forEach(([f, m]) => setError(f, m));
    return Object.values(errs).every(m => !m);
  }
  function resetForm() {
    editingId = null;
    $('form').reset();
    $('date').value = today();
    fillCategories();
    ['amount', 'category', 'date', 'description'].forEach(f => setError(f, ''));
    $('formTitle').textContent = 'Add transaction';
    $('submitBtn').textContent = 'Add transaction';
    $('cancelBtn').hidden = true;
  }
  $('form').addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    const t = {
      id: editingId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
      type: currentType(),
      amount: Math.round(parseFloat($('amount').value) * 100) / 100,
      category: $('category').value,
      date: $('date').value,
      description: $('description').value.trim()
    };
    transactions = editingId
      ? transactions.map(x => x.id === editingId ? t : x)
      : [t, ...transactions];
    save();
    resetForm();
    render();
  });
  document.querySelectorAll('input[name=type]').forEach(r => r.addEventListener('change', fillCategories));
  $('cancelBtn').addEventListener('click', resetForm);
  ['amount', 'category', 'date', 'description'].forEach(f =>
    $(f).addEventListener('input', () => setError(f, '')));

  function startEdit(id) {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    editingId = id;
    document.querySelector(`input[name=type][value=${t.type}]`).checked = true;
    fillCategories();
    $('amount').value = t.amount;
    $('category').value = t.category;
    $('date').value = t.date;
    $('description').value = t.description;
    $('formTitle').textContent = 'Edit transaction';
    $('submitBtn').textContent = 'Save changes';
    $('cancelBtn').hidden = false;
    $('form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('amount').focus();
  }
  function remove(id) {
    if (!confirm('Delete this transaction?')) return;
    transactions = transactions.filter(x => x.id !== id);
    if (editingId === id) resetForm();
    save();
    render();
  }

  // ---------- Rendering ----------
  const sum = (arr, type) => arr.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);

  function filtered() {
    const type = $('fType').value, cat = $('fCategory').value, month = $('fMonth').value;
    return transactions
      .filter(t => (type === 'all' || t.type === type) &&
                   (cat === 'all' || t.category === cat) &&
                   (!month || t.date.startsWith(month)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function renderList() {
    const list = $('list'), rows = filtered();
    list.innerHTML = '';
    rows.forEach(t => {
      const li = document.createElement('li');
      li.className = 'item ' + t.type;
      const desc = document.createElement('div');
      desc.className = 'desc'; desc.textContent = t.description;
      const amt = document.createElement('div');
      amt.className = 'amt';
      amt.textContent = (t.type === 'income' ? '+' : '−') + money.format(t.amount);
      const meta = document.createElement('div');
      meta.className = 'meta';
      const tag = document.createElement('span');
      tag.className = 'tag'; tag.textContent = t.category;
      meta.append(tag, new Date(t.date + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
      const btns = document.createElement('div');
      btns.className = 'btns';
      const ed = document.createElement('button');
      ed.type = 'button'; ed.textContent = 'Edit';
      ed.setAttribute('aria-label', 'Edit ' + t.description);
      ed.onclick = () => startEdit(t.id);
      const del = document.createElement('button');
      del.type = 'button'; del.textContent = 'Delete'; del.className = 'del';
      del.setAttribute('aria-label', 'Delete ' + t.description);
      del.onclick = () => remove(t.id);
      btns.append(ed, del);
      li.append(desc, amt, meta, document.createElement('span'), btns);
      list.append(li);
    });
    const empty = $('empty');
    empty.hidden = rows.length > 0;
    empty.textContent = transactions.length
      ? 'No transactions match these filters.'
      : 'No transactions yet. Add your first one to get started.';
  }

  function renderSummary() {
    const month = $('sumMonth').value || thisMonth();
    const rows = transactions.filter(t => t.date.startsWith(month));
    const inc = sum(rows, 'income'), exp = sum(rows, 'expense');
    $('mIncome').textContent = money.format(inc);
    $('mExpense').textContent = money.format(exp);
    $('mNet').textContent = money.format(inc - exp);

    const byCat = {};
    rows.filter(t => t.type === 'expense').forEach(t => byCat[t.category] = (byCat[t.category] || 0) + t.amount);
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const chart = $('chart');
    chart.innerHTML = '';
    if (!entries.length) {
      const p = document.createElement('p');
      p.className = 'empty'; p.textContent = 'No expenses recorded for this month.';
      chart.append(p);
      return;
    }
    const max = entries[0][1];
    entries.forEach(([cat, val]) => {
      const row = document.createElement('div');
      row.className = 'bar';
      const name = document.createElement('span'); name.textContent = cat;
      const track = document.createElement('div'); track.className = 'track';
      const fill = document.createElement('div'); fill.className = 'fill';
      fill.style.width = (val / max * 100) + '%';
      track.append(fill);
      const v = document.createElement('span');
      v.className = 'v'; v.textContent = money.format(val) + ' (' + Math.round(val / exp * 100) + '%)';
      row.append(name, track, v);
      chart.append(row);
    });
  }

  function render() {
    const inc = sum(transactions, 'income'), exp = sum(transactions, 'expense');
    $('totalIncome').textContent = money.format(inc);
    $('totalExpense').textContent = money.format(exp);
    $('balance').textContent = money.format(inc - exp);
    renderList();
    renderSummary();
  }

  // ---------- Init ----------
  ['fType', 'fCategory', 'fMonth'].forEach(id => $(id).addEventListener('input', renderList));
  $('sumMonth').addEventListener('input', renderSummary);
  $('clearFilters').addEventListener('click', () => {
    $('fType').value = 'all'; $('fCategory').value = 'all'; $('fMonth').value = '';
    renderList();
  });
  fillFilterCategories();
  $('sumMonth').value = thisMonth();
  resetForm();
  render();
})();