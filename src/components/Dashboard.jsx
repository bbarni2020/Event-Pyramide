import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { invitationService, authService } from '../services/api';
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
  }, []);

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

  const invitationLimit = user?.isAdmin ? '∞' : config.maxInvitesPerUser;
  const remainingInvites = user?.isAdmin
    ? '∞'
    : Math.max(0, config.maxInvitesPerUser - invitations.length);

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
              disabled={loading || (!user?.isAdmin && invitations.length >= 5)}
            />
            <button 
              type="submit" 
              disabled={loading || (!user?.isAdmin && invitations.length >= 5)}
            >
              {loading ? 'PROCESSING...' : 'GRANT ACCESS'}
            </button>
          </form>

          <div className="list-section">
            <div className="list-header">GRANTED ({invitations.length})</div>
            {invitations.map((invitation) => (
              <div key={invitation.id} className="list-row">
                <span className={`indicator indicator-${invitation.status}`}></span>
                <span className="alias">@{invitation.inviteeUsername}</span>
                <span className="status-text">{invitation.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>EVENT TICKET</h3>
          </div>
          <div className="ticket-info">
            <div className="price-display">
              <div className="price-label">TICKET PRICE</div>
              <div className="price-value">USD 50.00</div>
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
        </div>
      </div>
    </div>
  );
}
