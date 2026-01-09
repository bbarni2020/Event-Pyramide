import { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

export default function BartenderTab({ user, onCallManager }) {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [scannerActive, setScannerActive] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currency, setCurrency] = useState('HUF');
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [inventory, setInventory] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadItems();
    loadCurrency();
    checkCameraPermission();
    loadInventory();
  }, []);

  const checkCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices) {
        console.log('MediaDevices API not available');
        return;
      }

      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' });
        setCameraPermission(result.state);
        result.onchange = () => {
          setCameraPermission(result.state);
        };
      }
    } catch (err) {
      console.log('Permissions API not supported:', err);
    }
  };

  useEffect(() => {
    if (scannerActive) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [scannerActive]);

  const loadCurrency = async () => {
    try {
      const currency = import.meta.env.VITE_CURRENCY || 'HUF';
      setCurrency(currency);
    } catch (err) {
      setCurrency('HUF');
    }
  };

  const loadItems = async () => {
    try {
      const response = await fetch('/api/bar/items', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
      setError('Failed to load items');
    }
  };

  const loadInventory = async () => {
    try {
      const response = await fetch('/api/bar/inventory', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const mapped = {};
        data.forEach(inv => { mapped[inv.item_id] = inv.quantity; });
        setInventory(mapped);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  };

  const startScanner = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera not available. Use a supported browser over HTTPS.');
      setScannerActive(false);
      return;
    }
    try {
      const constraints = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(() => navigator.mediaDevices.getUserMedia({ video: true }));

      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          scanQRCodes();
        };
      }
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError' || err.name === 'NotReadableError') {
        setError('Camera is not accessible. It may be in use by another app.');
      } else {
        setError(`Cannot access camera: ${err.message || 'Unknown error'}`);
      }

      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
        verifyCustomer(code.data);
        setScannerActive(false);
        return;
      }
    }

    requestAnimationFrame(scanQRCodes);
  };

  const verifyCustomer = async (qrCode) => {
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
        setCustomerData({
          user_id: data.user_id,
          username: data.username,
          invites: data.invites || 0,
          discount: data.bar_discount || 0
        });
        setSuccess(`✓ Scanned: @${data.username} (${data.bar_discount || 0}% off)`);
      } else {
        setError('✗ Invalid QR code');
      }
    } catch (err) {
      console.error('Failed to verify customer:', err);
      setError('✗ Error reading QR code');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const stock = inventory[item.id] ?? 0;
    const existingItem = cart.find(c => c.id === item.id);
    const nextQty = (existingItem?.quantity || 0) + 1;
    if (nextQty > stock) {
      setError('Out of stock');
      return;
    }
    if (existingItem) {
      setCart(cart.map(c => (c.id === item.id ? { ...c, quantity: nextQty } : c)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const stock = inventory[itemId] ?? 0;
    if (quantity > stock) {
      setError('Exceeds stock');
      return;
    }
    setCart(cart.map(c => (c.id === itemId ? { ...c, quantity } : c)));
  };

  const calculateTotal = () => {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;

    if (customerData) {
      const discountPercent = customerData.discount || 0;
      discount = subtotal * (discountPercent / 100);
    }

    return {
      subtotal,
      discount,
      total: subtotal - discount
    };
  };

  const completeSale = async () => {
    setLoading(true);

    try {
      if (cart.length === 0) {
        setError('No items in cart');
        setLoading(false);
        return;
      }
      const { subtotal, discount, total } = calculateTotal();
      const itemsJson = {};

      cart.forEach(item => {
        itemsJson[item.id] = item.quantity;
      });

      const response = await fetch('/api/bar/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bartender_id: user.id,
          customer_id: customerData?.user_id || null,
          items_json: itemsJson,
          total_amount: subtotal,
          discount_applied: customerData?.discount || 0,
          actual_amount: total
        })
      });

      if (response.ok) {
        const totalMoney = subtotal - discount;
        setSuccess(`✓ Sale completed! Bartender should have: ${totalMoney.toFixed(2)} ${currency}`);
        setCart([]);
        setCustomerData(null);
        setShowCheckoutConfirm(false);
        await loadInventory();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('✗ Failed to complete sale');
      }
    } catch (err) {
      console.error('Error completing sale:', err);
      setError('✗ Error completing sale');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, discount, total } = calculateTotal();

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', padding: '2rem' }}>
      <div>
        {error && (
          <div style={{
            padding: '1rem',
            background: '#3a1a1a',
            border: '1px solid #5a2a2a',
            borderRadius: '3px',
            color: '#ff7f7f',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            padding: '1rem',
            background: '#1a3a1a',
            border: '1px solid #2a5a2a',
            borderRadius: '3px',
            color: '#7ae87a',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            {success}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.9rem', letterSpacing: '2px', color: '#888', fontWeight: 700, marginBottom: '1rem' }}>MENU ITEMS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={!item.available || (inventory[item.id] ?? 0) <= 0}
                style={{
                  padding: '1.2rem',
                  background: item.available && (inventory[item.id] ?? 0) > 0 ? '#0d0d0d' : '#0a0a0a',
                  border: item.available && (inventory[item.id] ?? 0) > 0 ? '1px solid #2a2a2a' : '1px solid #1a1a1a',
                  borderRadius: '3px',
                  color: item.available && (inventory[item.id] ?? 0) > 0 ? '#888' : '#555',
                  fontSize: '0.9rem',
                  cursor: item.available && (inventory[item.id] ?? 0) > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  opacity: item.available && (inventory[item.id] ?? 0) > 0 ? 1 : 0.5,
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '120px'
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.75rem' }}>{item.category}</div>
                <div style={{ fontSize: '1.1rem', color: '#aaa', fontWeight: 600 }}>{parseFloat(item.price).toFixed(2)} {currency}</div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>Stock: {inventory[item.id] ?? 0}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '3px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', letterSpacing: '2px', color: '#888', fontWeight: 700, marginBottom: '1rem' }}>SCAN CUSTOMER</h3>

          {!scannerActive ? (
            <>
              {cameraPermission === 'denied' && (
                <div style={{
                  padding: '1rem',
                  background: '#3a1a1a',
                  border: '1px solid #5a2a2a',
                  borderRadius: '3px',
                  marginBottom: '1rem',
                  color: '#ff7f7f',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷🚫</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>CAMERA ACCESS DENIED</div>
                  <div style={{ fontSize: '0.75rem', color: '#ff9f9f' }}>
                    Please enable camera access in your browser settings and refresh the page.
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setScannerActive(true)}
                disabled={cameraPermission === 'denied'}
                style={{
                  width: '100%',
                  padding: '1.2rem',
                  background: cameraPermission === 'denied' ? '#1a1a1a' : '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  color: cameraPermission === 'denied' ? '#555' : '#888',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  cursor: cameraPermission === 'denied' ? 'not-allowed' : 'pointer',
                  borderRadius: '3px',
                  marginBottom: '1rem',
                  transition: 'all 0.2s',
                  opacity: cameraPermission === 'denied' ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (cameraPermission !== 'denied') {
                    e.target.style.background = '#252525';
                    e.target.style.borderColor = '#4a4a4a';
                  }
                }}
                onMouseOut={(e) => {
                  if (cameraPermission !== 'denied') {
                    e.target.style.background = '#1a1a1a';
                    e.target.style.borderColor = '#3a3a3a';
                  }
                }}
              >
                📱 START SCANNER
              </button>
              
              {cameraPermission === 'prompt' && (
                <div style={{
                  padding: '0.75rem',
                  background: '#1a1a3a',
                  border: '1px solid #2a2a5a',
                  borderRadius: '3px',
                  color: '#aabbff',
                  fontSize: '0.75rem',
                  textAlign: 'center'
                }}>
                  💡 You'll be asked to allow camera access
                </div>
              )}
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  borderRadius: '3px',
                  marginBottom: '1rem',
                  background: '#000',
                  minHeight: '300px',
                  maxHeight: '400px',
                  objectFit: 'cover'
                }}
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
              
              <div style={{
                padding: '0.75rem',
                background: '#0a0a0a',
                borderRadius: '3px',
                marginBottom: '1rem',
                textAlign: 'center',
                border: '1px solid #3a3a3a'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#888', fontWeight: 600 }}>
                  <span style={{ display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }}>📷</span> SCANNING FOR QR CODES...
                </div>
              </div>
              
              <button
                onClick={() => setScannerActive(false)}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: '#3a1a1a',
                  border: '1px solid #5a2a2a',
                  color: '#ff7f7f',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '3px'
                }}
              >
                ✕ STOP SCANNER
              </button>
            </>
          )}

          {customerData && (
            <div style={{
              background: '#0a0a0a',
              padding: '1.2rem',
              borderRadius: '3px',
              marginTop: '1rem',
              borderLeft: '3px solid #7ae87a'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#555', letterSpacing: '1px' }}>CUSTOMER</div>
              <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '0.75rem' }}>@{customerData.username}</div>
              <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Invites: {customerData.invites}</div>
              <div style={{ fontSize: '0.9rem', color: '#7ae87a', marginTop: '0.5rem', fontWeight: 700 }}>Discount: {customerData.discount}%</div>
              <button
                onClick={() => setCustomerData(null)}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.6rem',
                  background: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  color: '#888',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '2px'
                }}
              >
                CLEAR CUSTOMER
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{
        background: '#0d0d0d',
        border: '1px solid #2a2a2a',
        borderRadius: '3px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        height: 'fit-content',
        position: 'sticky',
        top: '2rem'
      }}>
        <h3 style={{ fontSize: '0.9rem', letterSpacing: '2px', color: '#888', fontWeight: 700, marginBottom: '1.5rem' }}>CART</h3>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', maxHeight: '400px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', fontSize: '0.85rem', padding: '2rem 0' }}>No items</div>
          ) : (
            cart.map((item) => (
              <div key={item.id} style={{
                padding: '1rem',
                background: '#0a0a0a',
                borderRadius: '2px',
                marginBottom: '0.75rem',
                borderLeft: '2px solid #3a3a3a'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem', fontWeight: 600 }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {(item.price * item.quantity).toFixed(2)} {currency}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        background: '#1a1a1a',
                        border: '1px solid #3a3a3a',
                        color: '#888',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderRadius: '2px'
                      }}
                    >
                      −
                    </button>
                    <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', color: '#888', minWidth: '25px', textAlign: 'center', fontWeight: 700 }}>
                      {item.quantity}
                    </div>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={(inventory[item.id] ?? 0) <= item.quantity}
                      style={{
                        padding: '0.4rem 0.6rem',
                        background: '#1a1a1a',
                        border: '1px solid #3a3a3a',
                        color: (inventory[item.id] ?? 0) <= item.quantity ? '#555' : '#888',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: (inventory[item.id] ?? 0) <= item.quantity ? 'not-allowed' : 'pointer',
                        borderRadius: '2px'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{
                    width: '100%',
                    padding: '0.4rem',
                    background: '#3a1a1a',
                    border: '1px solid #5a2a2a',
                    color: '#ff7f7f',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderRadius: '2px'
                  }}
                >
                  REMOVE
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <>
            <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '1.2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888', marginBottom: '0.75rem' }}>
                <span>SUBTOTAL</span>
                <span style={{ fontWeight: 700 }}>{subtotal.toFixed(2)} {currency}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#7ae87a', marginBottom: '0.75rem' }}>
                  <span>DISCOUNT</span>
                  <span style={{ fontWeight: 700 }}>-{discount.toFixed(2)} {currency}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.1rem',
                color: '#fff',
                fontWeight: 700,
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #2a2a2a'
              }}>
                <span>TOTAL</span>
                <span>{total.toFixed(2)} {currency}</span>
              </div>
            </div>

            {showCheckoutConfirm && (
              <div style={{
                padding: '1rem',
                background: '#0a0a0a',
                border: '1px solid #3a3a3a',
                borderRadius: '3px',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                  Bartender should have: <span style={{ color: '#7ae87a', fontWeight: 700, fontSize: '1rem' }}>{total.toFixed(2)} {currency}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowCheckoutConfirm(false)}
                    style={{
                      padding: '0.8rem',
                      background: '#1a1a1a',
                      border: '1px solid #3a3a3a',
                      color: '#888',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderRadius: '2px'
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={completeSale}
                    disabled={loading || cart.length === 0}
                    style={{
                      padding: '0.8rem',
                      background: '#1a2a1a',
                      border: '1px solid #3a5a3a',
                      color: '#7ae87a',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      borderRadius: '2px',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    CONFIRM
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowCheckoutConfirm(true)}
              disabled={loading}
              style={{
                width: '100%',
                marginBottom: '1rem',
                padding: '1rem',
                background: '#1a2a1a',
                border: '1px solid #3a5a3a',
                color: '#7ae87a',
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '1px',
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: '3px',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              ✓ COMPLETE SALE
            </button>
          </>
        )}

        <button
          onClick={onCallManager}
          style={{
            width: '100%',
            padding: '0.8rem',
            background: '#1a1a1a',
            border: '1px solid #3a3a3a',
            color: '#888',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '1px',
            cursor: 'pointer',
            borderRadius: '3px'
          }}
        >
          📞 CALL MANAGER
        </button>
      </div>
    </div>
    </>
  );
}
