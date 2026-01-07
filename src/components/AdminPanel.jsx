import { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import './AdminPanel.css';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [config, setConfig] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, invitationsRes, configRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getInvitations(),
        adminService.getConfig()
      ]);
      
      setUsers(usersRes.data);
      setInvitations(invitationsRes.data);
      setConfig(configRes.data);
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
        <button className={activeTab === 'broadcast' ? 'active' : ''} onClick={() => setActiveTab('broadcast')}>
          BROADCAST
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ALIAS</th>
                  <th>INSTAGRAM ID</th>
                  <th>ADMIN</th>
                  <th>STATUS</th>
                  <th>REGISTERED</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="alias">@{user.username}</td>
                    <td className="monospace">{user.instagramId}</td>
                    <td>{user.isAdmin ? '✓' : '—'}</td>
                    <td>
                      {user.isBanned ? (
                        <span className="badge banned">BANNED</span>
                      ) : (
                        <span className="badge active">ACTIVE</span>
                      )}
                    </td>
                    <td className="timestamp">{formatDate(user.createdAt)}</td>
                    <td>
                      <button 
                        className="action-btn" 
                        onClick={() => toggleBanUser(user.id, user.isBanned)}
                        disabled={loading}
                      >
                        {user.isBanned ? 'RESTORE' : 'BAN'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={config.infoPublic}
                    onChange={(e) => setConfig({...config, infoPublic: e.target.checked})}
                  />
                  <span>PUBLIC INFORMATION</span>
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

            <button onClick={updateConfig} disabled={loading} className="submit-btn">
              {loading ? 'APPLYING...' : 'APPLY CHANGES'}
            </button>
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
