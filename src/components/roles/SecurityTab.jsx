import { useState, useEffect } from 'react';

export default function SecurityTab({ user, onCallManager }) {
  const [incidents, setIncidents] = useState([]);
  const [newIncident, setNewIncident] = useState({
    incident_type: '',
    description: '',
    people_needed: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadIncidents = async () => {
    try {
      const response = await fetch('/api/security/incidents?limit=50', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setIncidents(data);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    }
  };

  const createIncident = async (e) => {
    e.preventDefault();
    if (!newIncident.incident_type.trim()) {
      setError('Please specify incident type');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/security/incidents', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident)
      });

      if (response.ok) {
        setSuccess('Incident reported');
        setNewIncident({ incident_type: '', description: '', people_needed: 1 });
        await loadIncidents();
      } else {
        setError('Failed to report incident');
      }
    } catch (err) {
      setError('Error reporting incident');
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId, status) => {
    try {
      const response = await fetch(`/api/security/incidents/${incidentId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await loadIncidents();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const selfAssignIncident = async (incidentId) => {
    try {
      const response = await fetch(`/api/security/incidents/${incidentId}/self-assign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setSuccess('You have been assigned');
        await loadIncidents();
      } else {
        setError('Failed to assign yourself');
      }
    } catch (err) {
      console.error('Failed to self-assign:', err);
      setError('Error assigning yourself');
    }
  };

  const selfUnassignIncident = async (incidentId) => {
    try {
      const response = await fetch(`/api/security/incidents/${incidentId}/self-unassign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setSuccess('You have been unassigned');
        await loadIncidents();
      } else {
        setError('Failed to unassign yourself');
      }
    } catch (err) {
      console.error('Failed to self-unassign:', err);
      setError('Error unassigning yourself');
    }
  };

  return (
    <div className="grid">
      {error && <div className="alert error">⚠ {error}</div>}
      {success && <div className="alert success">✓ {success}</div>}

      <div className="panel">
        <div className="panel-header">
          <h3>REPORT INCIDENT</h3>
        </div>

        <form onSubmit={createIncident}>
          <input
            type="text"
            placeholder="Incident Type"
            value={newIncident.incident_type}
            onChange={(e) => setNewIncident({ ...newIncident, incident_type: e.target.value })}
            disabled={loading}
            required
          />
          <textarea
            placeholder="Description"
            value={newIncident.description}
            onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
            disabled={loading}
            rows="2"
            style={{
              padding: '0.9rem',
              border: '1px solid #2a2a2a',
              borderRadius: '2px',
              fontSize: '0.85rem',
              background: '#0a0a0a',
              color: '#888',
              letterSpacing: '1px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: '#888' }}>PEOPLE NEEDED:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={newIncident.people_needed}
              onChange={(e) => setNewIncident({ ...newIncident, people_needed: parseInt(e.target.value) })}
              disabled={loading}
              style={{ width: '80px', padding: '0.9rem' }}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'REPORTING...' : 'REPORT INCIDENT'}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>ACTIVE INCIDENTS</h3>
        </div>

        <div className="list-section">
          {incidents.filter(i => i.status === 'open').length === 0 ? (
            <p style={{ textAlign: 'center', color: '#555', fontSize: '0.8rem', padding: '1rem' }}>No active incidents</p>
          ) : (
            incidents.filter(i => i.status === 'open').map((incident) => (
              <div key={incident.id} className="list-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{incident.incident_type}</div>
                  {incident.description && (
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.3rem' }}>{incident.description}</div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: '#555' }}>
                    {incident.assigned_count}/{incident.people_needed} ASSIGNED
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => incident.assigned_count > 0 ? selfUnassignIncident(incident.id) : selfAssignIncident(incident.id)}
                    disabled={loading}
                    style={{
                      padding: '0.6rem 0.9rem',
                      fontSize: '0.7rem',
                      background: incident.assigned_count > 0 ? '#1a2a1a' : '#1a1a1a',
                      border: `1px solid ${incident.assigned_count > 0 ? '#3a5a3a' : '#3a3a3a'}`,
                      color: incident.assigned_count > 0 ? '#7ae87a' : '#888',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      borderRadius: '2px',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      transition: 'all 0.2s',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    {incident.assigned_count > 0 ? 'UNASSIGN' : 'ASSIGN'}
                  </button>
                  <button
                    onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                    disabled={incident.assigned_count < incident.people_needed || loading}
                    style={{
                      padding: '0.6rem 0.9rem',
                      fontSize: '0.7rem',
                      background: incident.assigned_count >= incident.people_needed ? '#1a2a1a' : '#1a1a1a',
                      border: `1px solid ${incident.assigned_count >= incident.people_needed ? '#3a5a3a' : '#3a3a3a'}`,
                      color: incident.assigned_count >= incident.people_needed ? '#7ae87a' : '#666',
                      cursor: incident.assigned_count >= incident.people_needed && !loading ? 'pointer' : 'not-allowed',
                      borderRadius: '2px',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      opacity: incident.assigned_count >= incident.people_needed && !loading ? 1 : 0.5,
                      transition: 'all 0.2s'
                    }}
                  >
                    {incident.assigned_count >= incident.people_needed ? 'RESOLVE' : 'WAITING'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <button 
          onClick={onCallManager}
          style={{ width: '100%', padding: '0.9rem' }}
        >
          CALL MANAGER
        </button>
      </div>
    </div>
  );
}