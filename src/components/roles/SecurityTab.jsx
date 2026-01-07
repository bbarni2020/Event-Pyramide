import { useState, useEffect } from 'react';

export default function SecurityTab({ user }) {
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
      const response = await fetch('/api/security/incidents?limit=20', {
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

  const updatePeopleAvailable = async (incidentId, count) => {
    try {
      const response = await fetch(`/api/security/incidents/${incidentId}/people-available`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people_available: count })
      });

      if (response.ok) {
        await loadIncidents();
      }
    } catch (err) {
      console.error('Failed to update people available:', err);
    }
  };

  const canHandle = (incident) => {
    return incident.people_available >= incident.people_needed;
  };

  return (
    <div className="security-tab">
      <div className="panel">
        <div className="panel-header">
          <h3>REPORT INCIDENT</h3>
        </div>

        {error && <div className="alert error">⚠ {error}</div>}
        {success && <div className="alert success">✓ {success}</div>}

        <form onSubmit={createIncident}>
          <input
            type="text"
            placeholder="Incident type (e.g., Medical, Crowd Control)"
            value={newIncident.incident_type}
            onChange={(e) => setNewIncident({ ...newIncident, incident_type: e.target.value })}
            disabled={loading}
          />
          <textarea
            placeholder="Description"
            value={newIncident.description}
            onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
            disabled={loading}
            rows="3"
          ></textarea>
          <div className="form-row">
            <label>People Needed:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={newIncident.people_needed}
              onChange={(e) => setNewIncident({ ...newIncident, people_needed: parseInt(e.target.value) })}
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="button primary">
            {loading ? 'REPORTING...' : 'REPORT INCIDENT'}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>ACTIVE INCIDENTS</h3>
        </div>

        <div className="incidents-list">
          {incidents.filter(i => i.status === 'open').length === 0 ? (
            <p className="empty-state">No active incidents</p>
          ) : (
            incidents.filter(i => i.status === 'open').map((incident) => (
              <div key={incident.id} className={`incident-card ${canHandle(incident) ? 'handleable' : 'critical'}`}>
                <div className="incident-header">
                  <h4>{incident.incident_type}</h4>
                  <span className={`ticker ${canHandle(incident) ? 'ok' : 'alert'}`}>
                    {incident.people_available} / {incident.people_needed}
                  </span>
                </div>

                {incident.description && (
                  <p className="incident-description">{incident.description}</p>
                )}

                <div className="incident-info">
                  <span>Reported by: {incident.reporter_name}</span>
                  <time>{new Date(incident.created_at).toLocaleTimeString()}</time>
                </div>

                <div className="incident-controls">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={incident.people_available}
                    onChange={(e) => updatePeopleAvailable(incident.id, parseInt(e.target.value))}
                    className="people-input"
                    title="People available to handle"
                  />
                  <button
                    onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                    className="button small"
                    disabled={!canHandle(incident)}
                  >
                    RESOLVE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
