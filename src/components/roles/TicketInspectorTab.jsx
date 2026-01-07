import { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

export default function TicketInspectorTab({ user, config }) {
  const [activeMode, setActiveMode] = useState('scanner');
  const [scannerActive, setScannerActive] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (activeMode === 'scanner' && scannerActive) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [scannerActive, activeMode]);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          scanQRCodes();
        };
      }
    } catch (err) {
      setError('Cannot access camera');
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const scanQRCodes = () => {
    if (!scannerActive || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        verifyTicket(code.data);
        setScannerActive(false);
        return;
      }
    }

    requestAnimationFrame(scanQRCodes);
  };

  const verifyTicket = async (qrCode) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/tickets/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: qrCode })
      });

      const data = await response.json();
      
      if (response.ok) {
        setLastResult({
          status: data.status || 'verified',
          username: data.username,
          role: data.role,
          isSpecial: data.is_special,
          ticketPrice: data.ticket_price,
          paymentStatus: data.payment_status,
          color: data.color || 'green',
          qrCode: qrCode,
          timestamp: new Date()
        });
        if (data.color === 'blue') {
          setShowFullscreen(true);
        } else {
          setShowFullscreen(true);
          setTimeout(() => setShowFullscreen(false), 3000);
        }
      } else {
        setLastResult({
          status: data.status || 'invalid',
          message: data.message || 'Ticket not found',
          color: 'red',
          timestamp: new Date()
        });
        setShowFullscreen(true);
        setTimeout(() => setShowFullscreen(false), 2000);
      }
    } catch (err) {
      setError('Failed to verify ticket');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paid) => {
    setConfirmLoading(true);
    try {
      const response = await fetch('/api/tickets/confirm-payment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code: lastResult.qrCode,
          paid: paid
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowPaymentConfirm(false);
        setLastResult({
          ...lastResult,
          paymentStatus: paid ? 'paid' : 'unpaid',
          color: paid ? 'green' : 'red'
        });
        setShowFullscreen(true);
        setTimeout(() => {
          setShowFullscreen(false);
          setLastResult(null);
          setScannerActive(true);
        }, 2000);
      } else {
        setError('Failed to confirm payment');
      }
    } catch (err) {
      setError('Failed to confirm payment');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleManualQR = async (e) => {
    const qrCode = e.target.value;
    if (qrCode.length === 36 && qrCode.includes('-')) {
      await verifyTicket(qrCode);
      e.target.value = '';
    }
  };

  const getColorBg = (color) => {
    const colors = {
      'green': '#1a4d1a',
      'blue': '#1a3a4d',
      'red': '#4d1a1a',
      'gold': '#4d4d1a'
    };
    return colors[color] || colors.red;
  };

  const getColorBorder = (color) => {
    const colors = {
      'green': '#00ff00',
      'blue': '#00aaff',
      'red': '#ff0000',
      'gold': '#ffd700'
    };
    return colors[color] || colors.red;
  };

  // Payment confirmation dialog for unpaid tickets
  if (showPaymentConfirm && lastResult && lastResult.paymentStatus === 'unpaid') {
    return (
      <div className="fullscreen-verification" style={{ backgroundColor: getColorBg('blue') }}>
        <div className="fullscreen-content">
          <div className="status-circle" style={{ borderColor: getColorBorder('blue') }}>
            <span>⏳</span>
          </div>
          
          <h1 className="username">{lastResult.username.toUpperCase()}</h1>
          <p className="role">{lastResult.role.toUpperCase()}</p>
          
          <div className="payment-info">
            <p className="price">{config?.currency || 'USD'} {lastResult.ticketPrice.toFixed(2)}</p>
            <p>DID THEY PAY?</p>
          </div>
          
          <div className="payment-buttons">
            <button 
              className="payment-btn pays"
              onClick={() => confirmPayment(true)}
              disabled={confirmLoading}
            >
              ✓ PAID
            </button>
            <button 
              className="payment-btn not-pays"
              onClick={() => confirmPayment(false)}
              disabled={confirmLoading}
            >
              ✗ NOT PAID
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen display
  if (showFullscreen && lastResult) {
    // Determine display color: gold for security/admin, otherwise use result color
    const displayColor = (lastResult.role === 'security' || lastResult.role === 'admin') ? 'gold' : lastResult.color;
    
    return (
      <div className="fullscreen-verification" style={{ backgroundColor: getColorBg(displayColor) }}>
        <div className="fullscreen-content">
          {lastResult.status === 'verified' || lastResult.status === 'already_verified' ? (
            <>
              <div className="status-circle" style={{ borderColor: getColorBorder(displayColor) }}>
                {displayColor === 'green' && <span>✓</span>}
                {displayColor === 'blue' && <span>⏳</span>}
                {displayColor === 'red' && <span>✗</span>}
                {displayColor === 'gold' && <span>⭐</span>}
              </div>
              
              <h1 className="username">{lastResult.username.toUpperCase()}</h1>
              <p className="role">{lastResult.role.toUpperCase()}</p>
              
              {lastResult.ticketPrice > 0 && lastResult.paymentStatus === 'unpaid' && (
                <div className="payment-info">
                  <p className="price">{config?.currency || 'USD'} {lastResult.ticketPrice.toFixed(2)}</p>
                  <p className={`payment-status ${lastResult.paymentStatus}`}>
                    {lastResult.paymentStatus === 'unpaid' ? '⏳ UNPAID' : '✓ PAID'}
                  </p>
                  <button 
                    className="button primary"
                    onClick={() => { setShowFullscreen(false); setShowPaymentConfirm(true); }}
                    disabled={confirmLoading}
                  >
                    CONFIRM PAYMENT
                  </button>
                </div>
              )}
              
              {lastResult.ticketPrice > 0 && lastResult.paymentStatus === 'paid' && (
                <div className="payment-info">
                  <p className="price">{config?.currency || 'USD'} {lastResult.ticketPrice.toFixed(2)}</p>
                  <p className={`payment-status ${lastResult.paymentStatus}`}>
                    ✓ PAID
                  </p>
                </div>
              )}
              
              {lastResult.isSpecial && (
                <p className="special-badge">⭐ STAFF</p>
              )}
            </>
          ) : (
            <>
              <div className="status-circle" style={{ borderColor: getColorBorder('red') }}>
                <span>✗</span>
              </div>
              <h1>INVALID</h1>
              <p>{lastResult.message}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="inspector-tab">
      <div className="mode-selector">
        <button
          className={`mode-btn ${activeMode === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveMode('scanner')}
        >
          QR SCANNER
        </button>
        <button
          className={`mode-btn ${activeMode === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveMode('manual')}
        >
          MANUAL ENTRY
        </button>
      </div>

      {error && <div className="alert error">⚠ {error}</div>}

      {activeMode === 'scanner' ? (
        <div className="scanner-panel">
          {!scannerActive ? (
            <button
              className="button primary"
              onClick={() => setScannerActive(true)}
              disabled={loading}
            >
              START SCANNER
            </button>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <button
                className="button danger"
                onClick={() => setScannerActive(false)}
              >
                STOP SCANNER
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="manual-panel">
          <input
            type="text"
            placeholder="Enter or scan QR code here"
            onBlur={handleManualQR}
            disabled={loading}
            className="qr-input"
          />
        </div>
      )}

      {lastResult && !showFullscreen && (
        <div
          className="verification-result"
          style={{ borderColor: getColorBorder(lastResult.color) }}
        >
          <div className="status-indicator" style={{ backgroundColor: getColorBorder(lastResult.color) }}></div>
          
          {lastResult.status === 'verified' || lastResult.status === 'already_verified' ? (
            <>
              <h4>{lastResult.username.toUpperCase()}</h4>
              <p>Role: {lastResult.role.toUpperCase()}</p>
              {lastResult.ticketPrice > 0 && (
                <p>Price: {config?.currency || 'USD'} {lastResult.ticketPrice.toFixed(2)} ({lastResult.paymentStatus})</p>
              )}
              {lastResult.isSpecial && (
                <p className="special-badge">⭐ STAFF</p>
              )}
            </>
          ) : (
            <>
              <h4>INVALID TICKET</h4>
              <p>{lastResult.message}</p>
            </>
          )}
          
          <time className="timestamp">{lastResult.timestamp.toLocaleTimeString()}</time>
        </div>
      )}
    </div>
  );
}
