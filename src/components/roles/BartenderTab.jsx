export default function BartenderTab({ user, onCallManager }) {
  return (
    <div className="bartender-tab">
      <div className="panel">
        <div className="panel-header">
          <h3>POINT OF SALE</h3>
        </div>
        <div className="coming-soon">
          <div className="placeholder-icon">💰</div>
          <h2>Coming Soon</h2>
          <p>Cashier panel under development</p>
        </div>
        <button onClick={onCallManager} className="call-manager-btn" style={{ marginTop: '1rem' }}>
          CALL MANAGER
        </button>
      </div>
    </div>
  );
}
