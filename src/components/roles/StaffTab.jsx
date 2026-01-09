import { useState, useEffect } from 'react';

export default function StaffTab({ user, onCallManager }) {
  const [attending, setAttending] = useState(null);

  return (
    <div className="staff-tab">
      <div className="panel">
        <div className="panel-header">
          <h3>INSTAGRAM CHECK-IN</h3>
        </div>
        <div className="staff-message">
          <p>Please check your Instagram direct messages for event updates and important information.</p>
          <a href="https://instagram.com/direct" target="_blank" rel="noopener noreferrer" className="button">
            Open Instagram Messages
          </a>
        </div>
        <button onClick={onCallManager} className="call-manager-btn" style={{ marginTop: '1rem' }}>
          CALL MANAGER
        </button>
      </div>
    </div>
  );
}
