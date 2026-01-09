import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/api';
import './AdminPanel.css';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [config, setConfig] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [inspectorPayments, setInspectorPayments] = useState([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [managerCalls, setManagerCalls] = useState([]);
  const [securityJobs, setSecurityJobs] = useState([]);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDescription, setNewJobDescription] = useState('');
  const [newJobPeople, setNewJobPeople] = useState(1);
  
  const [barItems, setBarItems] = useState([]);
  const [inviteDiscounts, setInviteDiscounts] = useState([]);
  const [presetDiscounts, setPresetDiscounts] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Drink' });
  const [newInviteDiscount, setNewInviteDiscount] = useState({ invites: '', discount: '' });
  const [newPresetUser, setNewPresetUser] = useState({ username: '', discount: '' });
  
  const [inventory, setInventory] = useState([]);
  const [inventoryUpdates, setInventoryUpdates] = useState({});
  const [currency, setCurrency] = useState('HUF');
  const [bartenderBalances, setBartenderBalances] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  if (user?.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to access the Admin Panel.</p>
      </div>
    );
  }

  useEffect(() => {
    loadData();
    setCurrency(import.meta.env.VITE_CURRENCY || 'HUF');
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, invitationsRes, configRes, salariesRes, paymentsRes, callsRes, jobsRes, itemsRes, inviteDiscsRes, presetDiscsRes, inventoryRes, balancesRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getInvitations(),
        adminService.getConfig(),
        adminService.getSalaries(),
        fetch('/api/admin/inspector-payments', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/manager-calls', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/security-jobs', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/bar-items', { credentials: 'include' }).then(r => r.json().catch(() => [])),
        fetch('/api/admin/invite-discounts', { credentials: 'include' }).then(r => r.json().catch(() => [])),
        fetch('/api/admin/preset-discounts', { credentials: 'include' }).then(r => r.json().catch(() => [])),
        fetch('/api/admin/inventory', { credentials: 'include' }).then(r => r.json().catch(() => [])),
        fetch('/api/admin/bartender-balances', { credentials: 'include' }).then(r => r.json().catch(() => []))
      ]);
      
      setUsers(usersRes.data);
      setInvitations(invitationsRes.data);
      setConfig(configRes.data);
      setSalaries(salariesRes.data);
      setInspectorPayments(paymentsRes);
      setManagerCalls(callsRes);
      setSecurityJobs(jobsRes);
      setBarItems(itemsRes);
      setInviteDiscounts(inviteDiscsRes);
      setPresetDiscounts(presetDiscsRes);
      setInventory(inventoryRes);
      setBartenderBalances(balancesRes);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    }
  };

  const updateConfig = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await adminService.updateConfig(config);
      setSuccess('Configuration updated successfully!');
    } catch (err) {
      setError('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const toggleBanUser = async (userId, isBanned) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isBanned ? `/admin/users/${userId}/unban` : `/admin/users/${userId}/ban`;
      await fetch(endpoint, { method: 'POST', credentials: 'include' });
      await loadData();
      setSuccess(`User ${isBanned ? 'unbanned' : 'banned'} successfully!`);
    } catch (err) {
      setError('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, role) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updateUserRole(userId, role);
      await loadData();
      setSuccess('Role updated');
    } catch (err) {
      setError('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await adminService.broadcast({ content: broadcastMessage });
      setSuccess('Broadcast sent successfully!');
      setBroadcastMessage('');
    } catch (err) {
      setError('Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  const updateSalary = async (role, salary) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updateSalary(role, salary, config?.currency || 'USD');
      await loadData();
      setSuccess(`Salary for ${role} updated`);
    } catch (err) {
      setError('Failed to update salary');
    } finally {
      setLoading(false);
    }
  };

  const createSecurityJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await fetch('/api/admin/security-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newJobTitle,
          description: newJobDescription,
          required_people: parseInt(newJobPeople)
        })
      });
      setNewJobTitle('');
      setNewJobDescription('');
      setNewJobPeople(1);
      await loadData();
      setSuccess('Security job created');
    } catch (err) {
      setError('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const deleteSecurityJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/security-jobs/${jobId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      await loadData();
      setSuccess('Job deleted');
    } catch (err) {
      setError('Failed to delete job');
    } finally {
      setLoading(false);
    }
  };

  const resolveManagerCall = async (callId) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/manager-calls/${callId}/resolve`, {
        method: 'POST',
        credentials: 'include'
      });
      await loadData();
      setSuccess('Manager call resolved');
    } catch (err) {
      setError('Failed to resolve call');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="admin-panel">
      <div className="status-bar">
        <span className="status-item">SYSTEM: ADMIN</span>
        <span className="status-divider">|</span>
        <span className="status-item">CLEARANCE: UNLIMITED</span>
      </div>

      {error && <div className="alert error">⚠ {error}</div>}
      {success && <div className="alert success">✓ {success}</div>}

      <div className="tabs">
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
          USERS ({users.length})
        </button>
        <button className={activeTab === 'invitations' ? 'active' : ''} onClick={() => setActiveTab('invitations')}>
          GRANTS ({invitations.length})
        </button>
        <button className={activeTab === 'config' ? 'active' : ''} onClick={() => setActiveTab('config')}>
          CONFIG
        </button>
        <button className={activeTab === 'salaries' ? 'active' : ''} onClick={() => setActiveTab('salaries')}>
          SALARIES
        </button>
        <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
          INSPECTOR PAYMENTS
        </button>
        <button className={activeTab === 'broadcast' ? 'active' : ''} onClick={() => setActiveTab('broadcast')}>
          BROADCAST
        </button>
        <button className={activeTab === 'manager-calls' ? 'active' : ''} onClick={() => setActiveTab('manager-calls')}>
          MANAGER CALLS ({managerCalls.length})
        </button>
        <button className={activeTab === 'security-jobs' ? 'active' : ''} onClick={() => setActiveTab('security-jobs')}>
          SECURITY JOBS ({securityJobs.length})
        </button>
        <button className={activeTab === 'pricing' ? 'active' : ''} onClick={() => setActiveTab('pricing')}>
          PRICING & DISCOUNTS
        </button>
        <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
          INVENTORY
        </button>
        <button className={activeTab === 'bartenders' ? 'active' : ''} onClick={() => setActiveTab('bartenders')}>
          BARTENDER BALANCES
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && (
          <div>
            <input
              type="text"
              className="search-input"
              placeholder="SEARCH BY ALIAS OR INSTAGRAM ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ALIAS</th>
                    <th>INSTAGRAM ID</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>REGISTERED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((user) =>
                      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.instagram_id.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
                      <tr key={user.id}>
                    <td className="alias">@{user.username}</td>
                    <td className="monospace">{user.instagram_id}</td>
                    <td>
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        disabled={loading}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="staff">staff</option>
                        <option value="ticket-inspector">ticket-inspector</option>
                        <option value="security">security</option>
                        <option value="bartender">bartender</option>
                      </select>
                    </td>
                    <td>
                      {user.is_banned ? (
                        <span className="badge banned">BANNED</span>
                      ) : (
                        <span className="badge active">ACTIVE</span>
                      )}
                    </td>
                    <td className="timestamp">{formatDate(user.created_at)}</td>
                    <td>
                      <button 
                        className="action-btn" 
                        onClick={() => toggleBanUser(user.id, user.is_banned)}
                        disabled={loading}
                      >
                        {user.is_banned ? 'RESTORE' : 'BAN'}
                      </button>
                    </td>
                  </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>GRANTER</th>
                  <th>RECIPIENT</th>
                  <th>STATUS</th>
                  <th>ISSUED</th>
                  <th>CONFIRMED</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id}>
                    <td className="alias">@{inv.inviterUsername}</td>
                    <td className="alias">@{inv.inviteeUsername}</td>
                    <td><span className={`indicator indicator-${inv.status}`}></span> {inv.status.toUpperCase()}</td>
                    <td className="timestamp">{formatDate(inv.createdAt)}</td>
                    <td className="timestamp">{inv.acceptedAt ? formatDate(inv.acceptedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'config' && config && (
          <div className="config-form">
            <fieldset>
              <legend>EVENT DETAILS</legend>
              <div className="form-group">
                <label htmlFor="eventDate">EVENT DATE</label>
                <input 
                  id="eventDate" 
                  type="datetime-local" 
                  value={config.eventDate}
                  onChange={(e) => setConfig({...config, eventDate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="eventPlace">EVENT PLACE</label>
                <input 
                  id="eventPlace" 
                  type="text" 
                  value={config.eventPlace}
                  onChange={(e) => setConfig({...config, eventPlace: e.target.value})}
                  placeholder="Enter venue name or address" 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="eventPlaceLat">LATITUDE</label>
                  <input 
                    id="eventPlaceLat" 
                    type="number" 
                    step="0.00000001" 
                    value={config.eventPlaceLat}
                    onChange={(e) => setConfig({...config, eventPlaceLat: e.target.value})}
                    placeholder="47.497912" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="eventPlaceLng">LONGITUDE</label>
                  <input 
                    id="eventPlaceLng" 
                    type="number" 
                    step="0.00000001" 
                    value={config.eventPlaceLng}
                    onChange={(e) => setConfig({...config, eventPlaceLng: e.target.value})}
                    placeholder="19.040235" 
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="memberCountReleaseDate">PARTICIPANT COUNT RELEASE DATE</label>
                <input 
                  id="memberCountReleaseDate" 
                  type="datetime-local" 
                  value={config.releaseDateParticipants}
                  onChange={(e) => setConfig({...config, releaseDateParticipants: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={config.participantsPublic}
                    onChange={(e) => setConfig({...config, participantsPublic: e.target.checked})}
                  />
                  <span>PARTICIPANTS COUNT PUBLIC</span>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>EVENT DATE VISIBILITY</legend>
              <div className="form-group">
                <label htmlFor="eventDateReleaseDate">EVENT DATE RELEASE DATE</label>
                <input 
                  id="eventDateReleaseDate" 
                  type="datetime-local" 
                  value={config.releaseDateEventDate}
                  onChange={(e) => setConfig({...config, releaseDateEventDate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={config.eventDatePublic}
                    onChange={(e) => setConfig({...config, eventDatePublic: e.target.checked})}
                  />
                  <span>EVENT DATE PUBLIC</span>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>EVENT LOCATION VISIBILITY</legend>
              <div className="form-group">
                <label htmlFor="eventPlaceReleaseDate">LOCATION RELEASE DATE</label>
                <input 
                  id="eventPlaceReleaseDate" 
                  type="datetime-local" 
                  value={config.releaseDateEventPlace}
                  onChange={(e) => setConfig({...config, releaseDateEventPlace: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={config.eventPlacePublic}
                    onChange={(e) => setConfig({...config, eventPlacePublic: e.target.checked})}
                  />
                  <span>LOCATION PUBLIC</span>
                </label>
              </div>
              <div className="form-group">
                <label htmlFor="maxCap">MAX CAPACITY</label>
                <input 
                  id="maxCap" 
                  type="number" 
                  value={config.maxParticipants}
                  onChange={(e) => setConfig({...config, maxParticipants: e.target.value})}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>PRICING</legend>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="minPrice">MIN TICKET PRICE</label>
                  <input 
                    id="minPrice" 
                    type="number" 
                    step="0.01" 
                    value={config.minTicketPrice}
                    onChange={(e) => setConfig({...config, minTicketPrice: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxPrice">MAX TICKET PRICE</label>
                  <input 
                    id="maxPrice" 
                    type="number" 
                    step="0.01" 
                    value={config.maxTicketPrice}
                    onChange={(e) => setConfig({...config, maxTicketPrice: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="currency">CURRENCY</label>
                <input 
                  id="currency" 
                  type="text" 
                  value={config.currency}
                  onChange={(e) => setConfig({...config, currency: e.target.value})}
                  placeholder="USD" 
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>INVITE & DISCOUNT SETTINGS</legend>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="maxInvites">MAX INVITES PER USER</label>
                  <input 
                    id="maxInvites" 
                    type="number" 
                    value={config.maxInvitesPerUser}
                    onChange={(e) => setConfig({...config, maxInvitesPerUser: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxDiscount">MAX DISCOUNT (%) — All Invites Accepted</label>
                  <input 
                    id="maxDiscount" 
                    type="number" 
                    step="0.01" 
                    value={config.maxDiscountPercent}
                    onChange={(e) => setConfig({...config, maxDiscountPercent: e.target.value})}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>TICKET QR CODES</legend>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={config.ticketQrEnabled || false}
                    onChange={(e) => setConfig({...config, ticketQrEnabled: e.target.checked})}
                  />
                  <span>ENABLE TICKET QR CODES</span>
                </label>
                <p className="help-text">Allow users to generate QR codes for ticket verification</p>
              </div>
            </fieldset>

            <button onClick={updateConfig} disabled={loading} className="submit-btn">
              {loading ? 'APPLYING...' : 'APPLY CHANGES'}
            </button>
          </div>
        )}

        {activeTab === 'salaries' && (
          <div className="salaries-section">
            <div className="salaries-header">STAFF ROLE SALARIES</div>
            <div className="salaries-grid">
              {['staff', 'ticket-inspector', 'security', 'bartender'].map((role) => {
                const salary = salaries.find(s => s.role === role);
                const salaryAmount = salary?.salary || 0;
                return (
                  <div key={role} className="salary-card">
                    <div className="salary-role">{role.toUpperCase()}</div>
                    <div className="salary-input-group">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={salaryAmount}
                        onChange={(e) => {
                          setSalaries(salaries.map(s => 
                            s.role === role ? {...s, salary: parseFloat(e.target.value) || 0} : s
                          ));
                        }}
                      />
                      <span className="salary-currency">{config?.currency || 'USD'}</span>
                    </div>
                    <button 
                      onClick={() => updateSalary(role, salaryAmount)}
                      disabled={loading}
                      className="save-salary-btn"
                    >
                      SAVE
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-section">
            <div className="payments-header">TICKET INSPECTOR PAYMENTS</div>
            <div className="payments-table">
              <div className="payments-row header">
                <div className="col-name">INSPECTOR</div>
                <div className="col-amount">TOTAL COLLECTED</div>
                <div className="col-count">TICKETS VERIFIED</div>
              </div>
              {inspectorPayments.length > 0 ? (
                <>
                  {inspectorPayments.map((payment) => (
                    <div key={payment.inspector_id} className="payments-row">
                      <div className="col-name">{payment.inspector_name.toUpperCase()}</div>
                      <div className="col-amount">{config?.currency || 'USD'} {payment.total_collected.toFixed(2)}</div>
                      <div className="col-count">{payment.verified_count}</div>
                    </div>
                  ))}
                  <div className="payments-row header" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #3a3a3a' }}>
                    <div className="col-name">TOTAL</div>
                    <div className="col-amount">
                      {config?.currency || 'USD'} {inspectorPayments.reduce((sum, p) => sum + p.total_collected, 0).toFixed(2)}
                    </div>
                    <div className="col-count">
                      {inspectorPayments.reduce((sum, p) => sum + p.verified_count, 0)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-message">NO TICKET INSPECTORS FOUND</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="broadcast-section">
            <div className="broadcast-header">SYSTEM BROADCAST</div>
            <textarea 
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="ENTER MESSAGE..."
              rows="6"
            />
            <button onClick={sendBroadcast} disabled={loading || !broadcastMessage.trim()} className="submit-btn">
              {loading ? 'TRANSMITTING...' : 'TRANSMIT MESSAGE'}
            </button>
          </div>
        )}

        {activeTab === 'manager-calls' && (
          <div className="manager-calls-section">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', letterSpacing: '2px', color: '#888', fontWeight: 700 }}>MANAGER CALLS</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {managerCalls.filter(c => c.status === 'open').length > 0 ? (
                managerCalls.filter(c => c.status === 'open').map((call) => (
                  <div key={call.id} style={{
                    background: '#0d0d0d',
                    border: '1px solid #2a2a2a',
                    borderLeft: '3px solid #ff7f7f',
                    borderRadius: '3px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>@{call.username}</div>
                        <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.25rem' }}>{new Date(call.created_at).toLocaleString()}</div>
                      </div>
                      <span style={{ 
                        background: 'rgba(139, 58, 58, 0.3)',
                        border: '1px solid #8b3a3a',
                        color: '#ff6b6b',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '2px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        whiteSpace: 'nowrap'
                      }}>
                        OPEN
                      </span>
                    </div>
                    
                    {call.reason && (
                      <div style={{ 
                        background: '#0a0a0a',
                        padding: '0.75rem',
                        borderRadius: '2px',
                        fontSize: '0.85rem',
                        color: '#888',
                        fontFamily: 'monospace',
                        borderLeft: '2px solid #3a3a3a',
                        lineHeight: 1.4
                      }}>
                        {call.reason}
                      </div>
                    )}
                    
                    <button 
                      onClick={() => resolveManagerCall(call.id)}
                      disabled={loading}
                      style={{
                        padding: '0.75rem',
                        background: '#1a2a1a',
                        border: '1px solid #3a5a3a',
                        color: '#7ae87a',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        borderRadius: '2px',
                        transition: 'all 0.2s',
                        opacity: loading ? 0.5 : 1
                      }}
                    >
                      {loading ? 'RESOLVING...' : 'MARK RESOLVED'}
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#555', fontSize: '0.85rem' }}>
                  No open manager calls
                </div>
              )}
            </div>

            {managerCalls.filter(c => c.status === 'resolved').length > 0 && (
              <>
                <h4 style={{ fontSize: '0.8rem', color: '#666', letterSpacing: '1px', marginBottom: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #2a2a2a' }}>RESOLVED</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {managerCalls.filter(c => c.status === 'resolved').slice(0, 10).map((call) => (
                    <div key={call.id} style={{
                      background: '#0d0d0d',
                      border: '1px solid #2a2a2a',
                      borderLeft: '3px solid #588b3a',
                      borderRadius: '3px',
                      padding: '1rem',
                      opacity: 0.7
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>@{call.username}</div>
                        <span style={{ 
                          background: 'rgba(88, 139, 58, 0.3)',
                          border: '1px solid #588b3a',
                          color: '#90ee90',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '2px',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          letterSpacing: '1px'
                        }}>
                          RESOLVED
                        </span>
                      </div>
                      {call.reason && (
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                          {call.reason.substring(0, 50)}{call.reason.length > 50 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'security-jobs' && (
          <div className="security-jobs-section">
            <div className="section-header">SECURITY JOBS</div>
            
            <form onSubmit={createSecurityJob} className="job-form">
              <input 
                type="text"
                placeholder="JOB TITLE"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="JOB DESCRIPTION"
                value={newJobDescription}
                onChange={(e) => setNewJobDescription(e.target.value)}
                rows="3"
              />
              <input
                type="number"
                placeholder="PEOPLE NEEDED"
                value={newJobPeople}
                onChange={(e) => setNewJobPeople(e.target.value)}
                min="1"
                required
              />
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'CREATING...' : 'CREATE JOB'}
              </button>
            </form>

            <div className="jobs-list">
              {securityJobs.length === 0 ? (
                <p className="empty-state">No security jobs</p>
              ) : (
                securityJobs.map((job) => (
                  <div key={job.id} className={`job-item job-${job.status}`}>
                    <div className="job-header">
                      <div>
                        <h4>{job.title}</h4>
                        <p className="job-desc">{job.description}</p>
                      </div>
                      <div className="job-stats">
                        <span>{job.assigned_count}/{job.required_people} ASSIGNED</span>
                        <span className={`status-badge status-${job.status}`}>{job.status.toUpperCase()}</span>
                      </div>
                    </div>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteSecurityJob(job.id)}
                      disabled={loading}
                    >
                      DELETE
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', letterSpacing: '2px', color: '#888', fontWeight: 700 }}>BAR ITEMS</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              fetch('/api/admin/bar-items', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
              }).then(() => {
                loadData();
                setNewItem({ name: '', price: '', category: 'Drink' });
                setSuccess('Item added');
              }).catch(() => setError('Failed to add item')).finally(() => setLoading(false));
            }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', marginBottom: '2rem' }}>
              <input type="text" placeholder="NAME" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} required />
              <input type="number" placeholder="PRICE" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} step="0.01" required />
              <select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} style={{ padding: '0.9rem', border: '1px solid #2a2a2a', background: '#0a0a0a', color: '#888' }}>
                <option>Drink</option>
                <option>Food</option>
                <option>Snack</option>
              </select>
              <button type="submit" disabled={loading} style={{ padding: '0.9rem 1.5rem', background: '#1a2a1a', border: '1px solid #3a5a3a', color: '#7ae87a', cursor: 'pointer', borderRadius: '2px' }}>ADD</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
              {barItems.map((item) => (
                <div key={item.id} style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '3px', padding: '1rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>{item.category}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: '#888' }}>${parseFloat(item.price).toFixed(2)}</span>
                    <input type="number" step="0.01" defaultValue={parseFloat(item.price)} onChange={(e) => item._newPrice = e.target.value} style={{ padding: '0.5rem', background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#888', borderRadius: '2px' }} />
                    <button onClick={() => { setLoading(true); fetch(`/api/admin/bar-items/${item.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price: parseFloat(item._newPrice || item.price) }) }).then(() => loadData()).catch(() => setError('Failed to update price')).finally(() => setLoading(false)); }} style={{ padding: '0.5rem', background: '#1a2a1a', border: '1px solid #3a5a3a', color: '#7ae87a', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '2px' }}>SET PRICE</button>
                  </div>
                  <button onClick={() => { setLoading(true); fetch(`/api/admin/bar-items/${item.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !item.available }) }).then(() => loadData()).catch(() => setError('Failed to toggle availability')).finally(() => setLoading(false)); }} style={{ width: '100%', padding: '0.5rem', background: item.available ? '#1a2a1a' : '#1a1a1a', border: '1px solid #3a5a3a', color: item.available ? '#7ae87a' : '#888', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '2px', marginBottom: '0.5rem' }}>{item.available ? 'AVAILABLE' : 'UNAVAILABLE'}</button>
                  <button onClick={() => { setLoading(true); fetch(`/api/admin/bar-items/${item.id}`, { method: 'DELETE', credentials: 'include' }).then(() => loadData()).catch(() => setError('Failed to delete')).finally(() => setLoading(false)); }} style={{ width: '100%', padding: '0.5rem', background: '#3a1a1a', border: '1px solid #5a2a2a', color: '#ff7f7f', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '2px' }}>DELETE</button>
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', letterSpacing: '2px', color: '#888', fontWeight: 700 }}>INVITE NUMBER DISCOUNTS</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              fetch('/api/admin/invite-discounts', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invite_count: parseInt(newInviteDiscount.invites), discount_percent: parseFloat(newInviteDiscount.discount) })
              }).then(() => {
                loadData();
                setNewInviteDiscount({ invites: '', discount: '' });
                setSuccess('Discount tier added');
              }).catch(() => setError('Failed to add discount')).finally(() => setLoading(false));
            }} style={{ display: 'grid', gridTemplateColumns: '200px 200px auto', gap: '1rem', marginBottom: '2rem' }}>
              <input type="number" placeholder="INVITE COUNT" value={newInviteDiscount.invites} onChange={(e) => setNewInviteDiscount({...newInviteDiscount, invites: e.target.value})} min="1" required />
              <input type="number" placeholder="DISCOUNT %" value={newInviteDiscount.discount} onChange={(e) => setNewInviteDiscount({...newInviteDiscount, discount: e.target.value})} step="0.01" max="100" required />
              <button type="submit" disabled={loading} style={{ padding: '0.9rem 1.5rem', background: '#1a2a1a', border: '1px solid #3a5a3a', color: '#7ae87a', cursor: 'pointer', borderRadius: '2px' }}>ADD TIER</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
              {inviteDiscounts.sort((a, b) => a.invite_count - b.invite_count).map((disc) => (
                <div key={disc.id} style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '3px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>INVITES</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{disc.invite_count}+</div>
                  <div style={{ fontSize: '0.9rem', color: '#7ae87a', marginBottom: '0.5rem' }}>{disc.discount_percent}% OFF</div>
                  <button onClick={() => { setLoading(true); fetch(`/api/admin/invite-discounts/${disc.id}`, { method: 'DELETE', credentials: 'include' }).then(() => loadData()).catch(() => setError('Failed to delete')).finally(() => setLoading(false)); }} style={{ width: '100%', padding: '0.5rem', background: '#3a1a1a', border: '1px solid #5a2a2a', color: '#ff7f7f', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '2px' }}>DELETE</button>
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', letterSpacing: '2px', color: '#888', fontWeight: 700 }}>PRESET DISCOUNTS</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              fetch('/api/admin/preset-discounts', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newPresetUser.username, discount_percent: parseFloat(newPresetUser.discount) })
              }).then(() => {
                loadData();
                setNewPresetUser({ username: '', discount: '' });
                setSuccess('Preset discount added');
              }).catch(() => setError('Failed to add preset')).finally(() => setLoading(false));
            }} style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: '1rem', marginBottom: '2rem' }}>
              <input type="text" placeholder="USERNAME" value={newPresetUser.username} onChange={(e) => setNewPresetUser({...newPresetUser, username: e.target.value})} required />
              <input type="number" placeholder="DISCOUNT %" value={newPresetUser.discount} onChange={(e) => setNewPresetUser({...newPresetUser, discount: e.target.value})} step="0.01" max="100" required />
              <button type="submit" disabled={loading} style={{ padding: '0.9rem 1.5rem', background: '#1a2a1a', border: '1px solid #3a5a3a', color: '#7ae87a', cursor: 'pointer', borderRadius: '2px' }}>ADD USER</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {presetDiscounts.map((preset) => (
                <div key={preset.id} style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '3px', padding: '1rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>@{preset.username}</div>
                  <div style={{ fontSize: '0.85rem', color: '#7ae87a', marginBottom: '0.5rem' }}>{preset.discount_percent}% OFF</div>
                  {preset.reason && <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>{preset.reason}</div>}
                  <button onClick={() => { setLoading(true); fetch(`/api/admin/preset-discounts/${preset.id}`, { method: 'DELETE', credentials: 'include' }).then(() => loadData()).catch(() => setError('Failed to delete')).finally(() => setLoading(false)); }} style={{ width: '100%', padding: '0.5rem', background: '#3a1a1a', border: '1px solid #5a2a2a', color: '#ff7f7f', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '2px' }}>DELETE</button>
                </div>
              ))}
            </div>
          </div>
        )}      
        {activeTab === 'bartenders' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', letterSpacing: '2px', color: '#888', fontWeight: 700 }}>BARTENDER BALANCES</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {bartenderBalances.map((b) => (
                <div key={b.bartender_id} style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '3px', padding: '1rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>@{b.bartender_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Total Sales: <span style={{ color: '#aaa', fontWeight: 600 }}>{Number(b.total_sales).toFixed(2)} {currency}</span></div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Withdrawn: <span style={{ color: '#aaa', fontWeight: 600 }}>{Number(b.total_payouts).toFixed(2)} {currency}</span></div>
                  <div style={{ fontSize: '0.9rem', color: '#7ae87a', marginBottom: '0.75rem', fontWeight: 700 }}>Outstanding: {Number(b.outstanding).toFixed(2)} {currency}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.5rem' }}>
                    <input type="number" step="0.01" defaultValue={Number(b.outstanding).toFixed(2)} onChange={(e) => b._withdrawAmt = e.target.value} style={{ padding: '0.75rem', background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#888', borderRadius: '2px' }} />
                    <button onClick={() => { const amt = parseFloat(b._withdrawAmt ?? b.outstanding); if (isNaN(amt) || amt <= 0) { setError('Invalid amount'); return; } setLoading(true); fetch('/api/admin/bartender-payouts', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bartender_id: b.bartender_id, amount: amt }) }).then(async (r) => { if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Failed to withdraw'); } }).then(() => { setSuccess('Withdrawal recorded'); loadData(); }).catch((e) => setError(e.message || 'Failed')).finally(() => setLoading(false)); }} disabled={loading || Number(b.outstanding) <= 0} style={{ padding: '0.75rem 1rem', background: '#1a2a1a', border: '1px solid #3a5a3a', color: '#7ae87a', fontWeight: 700, cursor: Number(b.outstanding) <= 0 ? 'not-allowed' : 'pointer', borderRadius: '2px' }}>WITHDRAW</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'inventory' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', letterSpacing: '2px', color: '#888', fontWeight: 700 }}>MANAGE INVENTORY</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {barItems.map((item) => {
                const inv = inventory.find(i => i.item_id === item.id);
                const currentQty = inv?.quantity || 0;
                const inputValue = inventoryUpdates[item.id] !== undefined ? inventoryUpdates[item.id] : currentQty;
                
                return (
                  <div key={item.id} style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '3px', padding: '1.5rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '1rem' }}>{item.category}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>
                      Price: <span style={{ color: '#aaa', fontWeight: 600 }}>{parseFloat(item.price).toFixed(2)} {currency}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '0.75rem', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.5rem' }}>QUANTITY</label>
                        <input 
                          type="number" 
                          value={inputValue} 
                          onChange={(e) => setInventoryUpdates({...inventoryUpdates, [item.id]: parseInt(e.target.value) || 0})}
                          style={{ width: '100%', padding: '0.75rem', background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#888', borderRadius: '2px' }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          setLoading(true);
                          fetch(`/api/admin/inventory`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ item_id: item.id, quantity: inputValue })
                          }).then(() => {
                            loadData();
                            setSuccess(`Inventory updated for ${item.name}`);
                          }).catch(() => setError('Failed to update')).finally(() => setLoading(false));
                        }}
                        disabled={loading}
                        style={{ padding: '0.75rem 1rem', background: '#1a2a1a', border: '1px solid #3a5a3a', color: '#7ae87a', fontWeight: 700, cursor: 'pointer', borderRadius: '2px' }}
                      >
                        SET
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a2a2a' }}>
                      Current: <span style={{ color: '#888', fontWeight: 600 }}>{currentQty}</span> units
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}