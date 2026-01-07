import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { invitationService, authService, eventService } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [newInvitation, setNewInvitation] = useState({ instagram_id: '' });
  const [config, setConfig] = useState({ maxInvitesPerUser: 5 });
  const [attending, setAttending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAttendance();
    loadInvitations();
    loadEventInfo();
  }, []);

  const loadEventInfo = async () => {
    try {
      const response = await eventService.getInfo();
      const data = response.data || {};
      setConfig({
        ...data,
        currency: data.currency || 'USD',
        minTicketPrice: data.min_ticket_price ?? null,
        maxTicketPrice: data.max_ticket_price ?? null,
        maxInvitesPerUser: data.max_invites_per_user ?? 0,
        maxDiscountPercent: data.max_discount_percent ?? 0,
      });
    } catch (err) {
      console.error('Failed to load event info:', err);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await invitationService.getMyInvitations();
      setInvitations(response.data);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  };

  const loadAttendance = async () => {
    try {
      const response = await authService.checkStatus();
      if (response.data.authenticated && response.data.user) {
        setAttending(response.data.user.attending);
      }
    } catch (err) {
      console.error('Failed to load attendance status:', err);
    }
  };

  const sendInvitation = async (e) => {
    e.preventDefault();
    if (!newInvitation.instagram_id) {
      setError('Please fill in Instagram ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await invitationService.createInvitation({
        instagram_id: newInvitation.instagram_id,
        username: newInvitation.instagram_id
      });
      setSuccess('Invitation sent successfully!');
      setNewInvitation({ instagram_id: '' });
      await loadInvitations();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const deleteInvitation = async (invitationId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await invitationService.deleteInvitation(invitationId);
      setSuccess('Invitation cancelled');
      await loadInvitations();
    } catch (err) {
      setError('Failed to cancel invitation');
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (value) => {
    try {
      setError('');
      setSuccess('');
      await authService.setAttendance(value);
      setAttending(value);
      setSuccess(`You've marked yourself as ${value ? 'attending' : 'not attending'}`);
    } catch (err) {
      setError('Failed to update attendance');
      console.error(err);
    }
  };

  const acceptedInvites = invitations.filter((inv) => inv.status === 'accepted').length;
  const invitationLimit = user?.is_admin ? '∞' : config.maxInvitesPerUser;
  const remainingInvites = user?.is_admin
    ? '∞'
    : Math.max(0, config.maxInvitesPerUser - invitations.length);

  const currency = (config.currency || 'USD').toUpperCase();
  const maxPrice = config.maxTicketPrice ?? null;
  const minPrice = config.minTicketPrice ?? maxPrice ?? null;
  const maxInvitesForDiscount = config.maxInvitesPerUser || 0;
  const discountFraction = maxInvitesForDiscount > 0
    ? Math.min(acceptedInvites / maxInvitesForDiscount, 1)
    : 0;
  const maxDiscount = config.maxDiscountPercent || 0;
  const effectiveDiscountPct = maxDiscount * discountFraction;
  const effectivePrice = (() => {
    if (maxPrice != null && minPrice != null) {
      const span = maxPrice - minPrice;
      return maxPrice - span * discountFraction;
    }
    if (maxPrice != null) {
      return maxPrice * (1 - effectiveDiscountPct / 100);
    }
    return null;
  })();

  const discountAmount = maxPrice != null && effectivePrice != null
    ? Math.max(0, maxPrice - effectivePrice)
    : 0;

  const formatMoney = (value) => value == null ? '—' : `${currency} ${Number(value).toFixed(2)}`;

  return (
    <div className="dashboard">
      <div className="status-bar">
        <span className="status-item">ALIAS: {user?.username}</span>
      </div>

      {error && <div className="alert error">⚠ {error}</div>}
      {success && <div className="alert success">✓ {success}</div>}

      <div className="grid">
        <div className="panel">
          <div className="panel-header">
            <h3>GRANT ACCESS</h3>
            <div className="quota">REMAINING: {remainingInvites} / {invitationLimit}</div>
          </div>
          
          <form onSubmit={sendInvitation}>
            <input
              type="text"
              placeholder="INSTAGRAM ID"
              value={newInvitation.instagram_id}
              onChange={(e) => setNewInvitation({ instagram_id: e.target.value })}
              disabled={loading || (!user?.is_admin && invitations.length >= config.maxInvitesPerUser)}
            />
            <button 
              type="submit" 
              disabled={loading || (!user?.is_admin && invitations.length >= config.maxInvitesPerUser)}
            >
              {loading ? 'PROCESSING...' : 'GRANT ACCESS'}
            </button>
          </form>

          <div className="list-section">
            <div className="list-header">GRANTED ({invitations.length})</div>
            {invitations.map((invitation) => (
              <div key={invitation.id} className="list-row">
                <span className={`indicator indicator-${invitation.status}`}></span>
                <span className="alias">@{invitation.invitee_username}</span>
                <span className="status-text">{invitation.status.toUpperCase()}</span>
                {invitation.status === 'pending' && (
                  <button 
                    className="delete-invite-btn"
                    onClick={() => deleteInvitation(invitation.id)}
                    disabled={loading}
                    title="Cancel this invitation"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          {user?.role === 'user' ? (
            <>
              <div className="panel-header">
                <h3>EVENT TICKET</h3>
              </div>
              <div className="ticket-info">
                <div className="price-display">
                  <div className="price-label">
                    TICKET PRICE
                    <button
                      type="button"
                      className="info-button"
                      data-tip="Invite more people; when they accept, your price slides down toward the max discount."
                      aria-label="Invite more people; when they accept, your price slides down toward the max discount."
                    >?</button>
                  </div>
                  <div className="price-value">{formatMoney(effectivePrice ?? maxPrice)}</div>
                  <div className="price-subtext">DISCOUNT: {formatMoney(discountAmount)}</div>
                </div>
              <div className="attendance-section">
                <div className="attendance-label">ATTENDANCE</div>
                <div className="button-group">
                  <button 
                    className={`attendance-btn ${attending === true ? 'active' : ''}`}
                    onClick={() => updateAttendance(true)}
                  >
                    ATTENDING
                  </button>
                  <button 
                    className={`attendance-btn ${attending === false ? 'active' : ''}`}
                    onClick={() => updateAttendance(false)}
                  >
                    NOT ATTENDING
                  </button>
                </div>
                {attending !== null && (
                  <div className={`status-badge ${attending ? 'going' : ''}`}>
                    {attending ? '✓ You\'re attending' : '✗ Not attending'}
                  </div>
                )}
              </div>
              </div>
            </>
          ) : (
            <>
              <div className="panel-header">
                <h3>STAFF ACCESS</h3>
              </div>
              <div className="staff-ticket">
                <div className="free-ticket">
                  <div className="ticket-label">YOUR TICKET</div>
                  <div className="ticket-price">FREE</div>
                  <div className="ticket-role">{user?.role.toUpperCase()}</div>
                </div>
                <div className="revenue-box">
                  <div className="revenue-label">GUEST PAYS</div>
                  <div className="revenue-value">{formatMoney(maxPrice)}</div>
                  <div className="revenue-subtext">Per attendee</div>
                </div>
              </div>
              <div className="attendance-section">
                <div className="attendance-label">ATTENDANCE</div>
                <div className="button-group">
                  <button 
                    className={`attendance-btn ${attending === true ? 'active' : ''}`}
                    onClick={() => updateAttendance(true)}
                  >
                    ATTENDING
                  </button>
                  <button 
                    className={`attendance-btn ${attending === false ? 'active' : ''}`}
                    onClick={() => updateAttendance(false)}
                  >
                    NOT ATTENDING
                  </button>
                </div>
                {attending !== null && (
                  <div className={`status-badge ${attending ? 'going' : ''}`}>
                    {attending ? '✓ You\'re attending' : '✗ Not attending'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
