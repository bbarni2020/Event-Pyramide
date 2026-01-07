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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  if (!user?.is_admin) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to access the Admin Panel.</p>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, invitationsRes, configRes, salariesRes, paymentsRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getInvitations(),
        adminService.getConfig(),
        adminService.getSalaries(),
        fetch('/api/admin/inspector-payments', { credentials: 'include' }).then(r => r.json())
      ]);
      
      setUsers(usersRes.data);
      setInvitations(invitationsRes.data);
      setConfig(configRes.data);
      setSalaries(salariesRes.data);
      setInspectorPayments(paymentsRes);
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
                        value={user.role || (user.is_admin ? 'admin' : 'user')}
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
      </div>
    </div>
  );
}
