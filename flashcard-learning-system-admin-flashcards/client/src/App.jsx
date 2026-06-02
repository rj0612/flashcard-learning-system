import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, LogOut, Shield, UserCircle, Search, BarChart3 } from 'lucide-react';
import { apiRequest, clearAuth, getStoredAuth, saveAuth } from './services/api';

const emptyForm = { question: '', answer: '', category: '', difficulty: 'Medium' };

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth());
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [cards, setCards] = useState([]);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortMode, setSortMode] = useState('category');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(getStoredAuth().user?.role === 'admin' ? 'admin' : 'cards');
  const [selectedHistoryUser, setSelectedHistoryUser] = useState('all');

  const isAdmin = auth.user?.role === 'admin';

  function notify(text, isError = false) {
    setMessage(isError ? '' : text);
    setError(isError ? text : '');
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm;
      const data = await apiRequest(path, { method: 'POST', body: JSON.stringify(payload) });
      saveAuth(data.token, data.user);
      setAuth({ token: data.token, user: data.user });
      setActiveTab(data.user.role === 'admin' ? 'admin' : 'cards');
      notify(`Welcome, ${data.user.name}`);
    } catch (err) {
      notify(err.message, true);
    }
  }

  function logout() {
    clearAuth();
    setAuth({ token: null, user: null });
    setCards([]);
    setHistory([]);
    setUsers([]);
    setSelectedHistoryUser('all');
  }

  async function loadCards() {
    if (!auth.token) return;
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await apiRequest(`/flashcards${query}`);
      setCards(data);
    } catch (err) {
      notify(err.message, true);
    }
  }

  async function loadHistory(userId = selectedHistoryUser) {
    if (!auth.token) return;
    try {
      const query = isAdmin && userId !== 'all' ? `?userId=${encodeURIComponent(userId)}` : '';
      const data = await apiRequest(isAdmin ? `/history/admin${query}` : '/history/me');
      setHistory(data);
    } catch (err) {
      notify(err.message, true);
    }
  }

  async function loadUsers() {
    if (!isAdmin) return;
    try {
      const data = await apiRequest('/users');
      setUsers(data);
    } catch (err) {
      notify(err.message, true);
    }
  }

  useEffect(() => {
    loadCards();
  }, [auth.token, search]);

  useEffect(() => {
    if (isAdmin && activeTab !== 'admin') setActiveTab('admin');
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (!auth.token) return;
    if (activeTab === 'history' && !isAdmin) loadHistory();
    if (activeTab === 'admin' && isAdmin) {
      loadCards();
      loadHistory();
      loadUsers();
    }
  }, [activeTab, auth.token, isAdmin, selectedHistoryUser]);

  async function saveCard(e) {
    e.preventDefault();
    if (!isAdmin) return notify('Only admins can create or edit flashcards.', true);
    try {
      if (!form.question.trim() || !form.answer.trim()) return notify('Question and answer are required.', true);
      if (editingId) {
        await apiRequest(`/flashcards/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        notify('Flashcard updated successfully.');
      } else {
        await apiRequest('/flashcards', { method: 'POST', body: JSON.stringify(form) });
        notify('Flashcard created successfully.');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadCards();
    } catch (err) {
      notify(err.message, true);
    }
  }

  function editCard(card) {
    if (!isAdmin) return notify('Only admins can edit flashcards.', true);
    setEditingId(card._id);
    setForm({ question: card.question, answer: card.answer, category: card.category, difficulty: card.difficulty });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteCard(id) {
    if (!isAdmin) return notify('Only admins can delete flashcards.', true);
    if (!confirm('Delete this flashcard?')) return;
    try {
      await apiRequest(`/flashcards/${id}`, { method: 'DELETE' });
      notify('Flashcard deleted.');
      await loadCards();
      await loadHistory();
    } catch (err) {
      notify(err.message, true);
    }
  }

  async function toggleStudied(card) {
    try {
      await apiRequest(`/flashcards/${card._id}/studied`, {
        method: 'PATCH',
        body: JSON.stringify({ studied: !card.studied })
      });
      notify(card.studied ? 'Moved back to active.' : 'Marked as studied.');
      await loadCards();
    } catch (err) {
      notify(err.message, true);
    }
  }

  async function recordView(card) {
    try {
      await apiRequest(`/flashcards/${card._id}/view`, { method: 'POST' });
      if (!isAdmin) await loadHistory();
    } catch {
      // not critical for user experience
    }
  }

  async function changeRole(user, role) {
    try {
      await apiRequest(`/users/${user._id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
      notify('User role updated.');
      await loadUsers();
      await loadHistory();
    } catch (err) {
      notify(err.message, true);
    }
  }

  async function deleteUser(user) {
    if (!confirm(`Delete account for ${user.email}?`)) return;
    try {
      await apiRequest(`/users/${user._id}`, { method: 'DELETE' });
      notify('User deleted.');
      await loadUsers();
      await loadHistory();
    } catch (err) {
      notify(err.message, true);
    }
  }

  async function deleteAllHistory() {
    if (!confirm('Delete all users learning history? This cannot be undone.')) return;
    try {
      await apiRequest('/history/admin/all', { method: 'DELETE' });
      setHistory([]);
      notify('All users learning history deleted.');
    } catch (err) {
      notify(err.message, true);
    }
  }

  const categories = useMemo(() => {
    return [...new Set(cards.map((card) => card.category || 'General'))].sort((a, b) => a.localeCompare(b));
  }, [cards]);

  const visibleCards = useMemo(() => {
    const filtered = cards.filter((card) => categoryFilter === 'all' || (card.category || 'General') === categoryFilter);
    return [...filtered].sort((a, b) => {
      if (sortMode === 'category') return (a.category || 'General').localeCompare(b.category || 'General') || a.question.localeCompare(b.question);
      if (sortMode === 'difficulty') return ['Easy', 'Medium', 'Hard'].indexOf(a.difficulty) - ['Easy', 'Medium', 'Hard'].indexOf(b.difficulty);
      if (sortMode === 'question') return a.question.localeCompare(b.question);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [cards, categoryFilter, sortMode]);

  const groupedActiveCards = useMemo(() => groupByCategory(visibleCards.filter((c) => !c.studied)), [visibleCards]);
  const groupedStudiedCards = useMemo(() => groupByCategory(visibleCards.filter((c) => c.studied)), [visibleCards]);

  const stats = useMemo(() => {
    const total = cards.length;
    const studied = cards.filter((c) => c.studied).length;
    const active = total - studied;
    const percent = total ? Math.round((studied / total) * 100) : 0;
    return { total, studied, active, percent };
  }, [cards]);

  if (!auth.token) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand"><BookOpen /> <h1>Flashcard Learning System</h1></div>
          <p className="muted">Register or log in to study flashcards, track progress, and view learning history.</p>
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleAuthSubmit} className="form-stack">
            {authMode === 'register' && (
              <label>Name<input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required /></label>
            )}
            <label>Email<input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required /></label>
            <label>Password<input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required minLength="6" /></label>
            <button>{authMode === 'login' ? 'Log In' : 'Create Account'}</button>
          </form>
          <button className="link-btn" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? 'Need an account? Register' : 'Already registered? Log in'}
          </button>
          <p className="hint">Tip: register with an email containing “admin” to test admin features.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand small"><BookOpen /><strong>Flashcard System</strong></div>
        {!isAdmin && <button className={activeTab === 'cards' ? 'nav active' : 'nav'} onClick={() => setActiveTab('cards')}>Flashcards</button>}
        {!isAdmin && <button className={activeTab === 'history' ? 'nav active' : 'nav'} onClick={() => setActiveTab('history')}>My History</button>}
        {isAdmin && <button className={activeTab === 'admin' ? 'nav active' : 'nav'} onClick={() => setActiveTab('admin')}>Admin Panel</button>}
        <div className="profile"><UserCircle /> <span>{auth.user.name}<br /><small>{auth.user.role}</small></span></div>
        <button className="logout" onClick={logout}><LogOut size={16} /> Logout</button>
      </aside>

      <main className="content">
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        {activeTab === 'cards' && !isAdmin && (
          <>
            <header className="hero">
              <div><h1>Study Dashboard</h1><p className="muted">Search, sort, and study flashcards created by the admin.</p></div>
              <div className="progress"><BarChart3 /><strong>{stats.percent}%</strong><span>studied</span></div>
            </header>

            <section className="stats-grid">
              <div className="stat"><strong>{stats.total}</strong><span>Total</span></div>
              <div className="stat"><strong>{stats.active}</strong><span>Not Studied</span></div>
              <div className="stat"><strong>{stats.studied}</strong><span>Studied</span></div>
            </section>

            <section className="panel controls-panel">
              <div className="searchbar"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Live search by question, answer or category..." /></div>
              <div className="filters-row">
                <label>Category
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="all">All categories</option>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label>Sort questions by
                  <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                    <option value="category">Category</option>
                    <option value="question">Question A-Z</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="newest">Newest</option>
                  </select>
                </label>
              </div>
            </section>

            <GroupedCardSection title="Not Studied Yet" groups={groupedActiveCards} onView={recordView} onToggle={toggleStudied} canManage={false} />
            <GroupedCardSection title="Studied Flashcards" groups={groupedStudiedCards} onView={recordView} onToggle={toggleStudied} canManage={false} />
          </>
        )}

        {activeTab === 'history' && !isAdmin && <HistoryTable title="My Learning History" history={history} />}

        {activeTab === 'admin' && isAdmin && (
          <>
            <section className="panel"><h1><Shield /> Admin Panel</h1><p className="muted">Manage users, create flashcards, and review learning history records.</p></section>

            <section className="panel">
              <h2>{editingId ? 'Edit Flashcard' : 'Create Flashcard'}</h2>
              <form onSubmit={saveCard} className="flashcard-form">
                <label>Question<input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required /></label>
                <label>Answer<textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} required /></label>
                <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Web Development" /></label>
                <label>Difficulty<select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
                <div className="row"><button>{editingId ? 'Update Flashcard' : 'Add Flashcard'}</button>{editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel Edit</button>}</div>
              </form>
            </section>

            <section className="panel">
              <h2>Flashcard Bank</h2>
              <div className="searchbar"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search flashcards for admin management..." /></div>
              <CardSection title="All Flashcards" cards={visibleCards} onView={recordView} onEdit={editCard} onDelete={deleteCard} onToggle={toggleStudied} canManage />
            </section>

            <section className="panel"><h2>Users</h2><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>{users.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td><button className="small-btn" onClick={() => changeRole(u, u.role === 'admin' ? 'student' : 'admin')}>Toggle Role</button><button className="small-btn danger" onClick={() => deleteUser(u)}>Delete</button></td></tr>)}</tbody></table></div></section>
            <section className="panel">
              <div className="admin-tools">
                <label>Sort history by user
                  <select value={selectedHistoryUser} onChange={(e) => setSelectedHistoryUser(e.target.value)}>
                    <option value="all">All users</option>
                    {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                  </select>
                </label>
                <button className="danger" onClick={deleteAllHistory}>Delete All Learning History</button>
              </div>
            </section>
            <HistoryTable title="All Users Learning History" history={history} admin />
          </>
        )}
      </main>
    </div>
  );
}

function groupByCategory(cards) {
  return cards.reduce((groups, card) => {
    const category = card.category || 'General';
    if (!groups[category]) groups[category] = [];
    groups[category].push(card);
    return groups;
  }, {});
}

function GroupedCardSection({ title, groups, onView, onToggle, canManage }) {
  const entries = Object.entries(groups);
  return <section className="panel"><h2>{title}</h2>{entries.length === 0 ? <p className="empty">No flashcards here.</p> : entries.map(([category, cards]) => <div className="category-group" key={category}><h3 className="category-title">{category}</h3><div className="cards-grid">{cards.map((card) => <Flashcard key={card._id} card={card} onView={onView} onToggle={onToggle} canManage={canManage} />)}</div></div>)}</section>;
}

function CardSection({ title, cards, onView, onEdit, onDelete, onToggle, canManage }) {
  return <section><h3>{title}</h3>{cards.length === 0 ? <p className="empty">No flashcards here.</p> : <div className="cards-grid">{cards.map((card) => <Flashcard key={card._id} card={card} onView={onView} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} canManage={canManage} />)}</div>}</section>;
}

function Flashcard({ card, onView, onEdit, onDelete, onToggle, canManage }) {
  const [show, setShow] = useState(false);
  return <article className="card"><div className="badge">{card.category || 'General'} · {card.difficulty}</div><h3>{card.question}</h3>{show && <p className="answer">{card.answer}</p>}<div className="card-actions"><button onClick={() => { setShow(!show); if (!show) onView(card); }}>{show ? 'Hide Answer' : 'Show Answer'}</button><button className="secondary" onClick={() => onToggle(card)}>{card.studied ? 'Move Back' : 'Mark Studied'}</button>{canManage && <button className="secondary" onClick={() => onEdit(card)}>Edit</button>}{canManage && <button className="danger" onClick={() => onDelete(card._id)}>Delete</button>}</div></article>;
}

function HistoryTable({ title, history, admin = false }) {
  return <section className="panel"><h1>{title}</h1><div className="table-wrap"><table><thead><tr>{admin && <th>User</th>}<th>Action</th><th>Flashcard</th><th>Category</th><th>Date</th></tr></thead><tbody>{history.map((h) => <tr key={h._id}>{admin && <td>{h.user?.name || 'Unknown'}<br /><small>{h.user?.email}</small></td>}<td>{h.action}</td><td>{h.snapshotQuestion || h.flashcard?.question || 'Deleted card'}</td><td>{h.snapshotCategory || h.flashcard?.category || 'N/A'}</td><td>{new Date(h.createdAt).toLocaleString()}</td></tr>)}</tbody></table>{history.length === 0 && <p className="empty">No history records yet.</p>}</div></section>;
}
