import { useState } from 'react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [step, setStep] = useState('username');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const { setUser, setIsAuthenticated } = useAuth();

  const requestOTP = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Enter your Instagram username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.requestOTP(username);
      setStep('otp');
      if (response.data.devOtp) {
        setDevOtp(response.data.devOtp);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.verifyOTP(username, otp);
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('username');
    setOtp('');
    setError('');
    setDevOtp('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>EVENT PYRAMIDE</h1>
        <p className="subtitle">INVITE-ONLY SESSION</p>
        
        {error && <div className="error-box">{error}</div>}

        {step === 'username' ? (
          <>
            <div className="info-box">
              <div className="info-item"><span className="dot"></span> EXCLUSIVE ACCESS</div>
              <div className="info-item"><span className="dot"></span> GRANT UP TO 5 ALIASES</div>
              <div className="info-item"><span className="dot"></span> DIGITAL ENTRY CODE</div>
            </div>

            <form onSubmit={requestOTP}>
              <input
                type="text"
                placeholder="INSTAGRAM USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'SENDING...' : 'REQUEST ACCESS'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="otp-info">
              <p>CODE SENT TO @{username}</p>
              {devOtp && <p className="dev-otp">DEV: {devOtp}</p>}
            </div>

            <form onSubmit={verifyOTP}>
              <input
                type="text"
                placeholder="ENTER CODE"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                maxLength="6"
              />
              <button type="submit" disabled={loading}>
                {loading ? 'VERIFYING...' : 'VERIFY'}
              </button>
              <button type="button" className="secondary" onClick={goBack} disabled={loading}>
                BACK
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
