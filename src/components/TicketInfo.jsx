import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';

export default function TicketInfo({ user, config }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (config?.ticket_qr_enabled) {
      loadOrGenerateTicket();
    }
  }, [config?.ticket_qr_enabled]);

  const loadOrGenerateTicket = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/tickets/', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.qr_code) {
          setTicket(data);
        } else {
          await generateTicket();
        }
      }
    } catch (err) {
      console.error('Failed to load ticket:', err);
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const generateTicket = async () => {
    try {
      const response = await fetch('/api/tickets/generate', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTicket(data);
        setError('');
      } else {
        setError('Failed to generate ticket');
      }
    } catch (err) {
      setError('Failed to generate ticket');
    }
  };

  if (!config?.ticket_qr_enabled) {
    return null;
  }

  return (
    <div className="ticket-qr-container">
      <h3>YOUR TICKET QR CODE</h3>
      
      {error && <div className="alert error">⚠ {error}</div>}

      {loading ? (
        <p className="loading-text">Generating your ticket QR code...</p>
      ) : ticket?.qr_code ? (
        <div className="qr-display">
          <div className="qr-code">
            <QRCode
              value={ticket.qr_code}
              size={256}
              level="H"
              includeMargin={true}
              renderAs="canvas"
            />
          </div>
          <div className="qr-info">
            <p>Status: <span className={ticket.verified ? 'verified' : 'pending'}>
              {ticket.verified ? '✓ VERIFIED' : '⏳ PENDING'}
            </span></p>
            {ticket.verified && ticket.verified_at && (
              <p>Verified: {new Date(ticket.verified_at).toLocaleString()}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="error-state">
          <p>Could not generate ticket QR code</p>
          <button onClick={generateTicket} disabled={loading} className="button primary">
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
