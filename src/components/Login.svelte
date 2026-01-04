<script>
  import axios from 'axios';

  let step = 'username'; // 'username' or 'otp'
  let username = '';
  let otp = '';
  let loading = false;
  let error = '';
  let devOtp = '';

  async function requestOTP() {
    if (!username.trim()) {
      error = 'Enter your Instagram username';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await axios.post('/auth/request-otp', { username }, { withCredentials: true });
      step = 'otp';
      if (response.data.devOtp) {
        devOtp = response.data.devOtp;
      }
    } catch (err) {
      error = err.response?.data?.error || 'Failed to send code';
    } finally {
      loading = false;
    }
  }

  async function verifyOTP() {
    if (!otp.trim()) {
      error = 'Enter the verification code';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await axios.post('/auth/verify-otp', { username, otp }, { withCredentials: true });
      if (response.data.success) {
        window.location.href = '/';
      }
    } catch (err) {
      error = err.response?.data?.error || 'Verification failed';
    } finally {
      loading = false;
    }
  }

  function goBack() {
    step = 'username';
    otp = '';
    error = '';
    devOtp = '';
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h1>EVENT PYRAMIDE</h1>
    <p class="subtitle">INVITE-ONLY SESSION</p>
    
    {#if error}
      <div class="error-box">{error}</div>
    {/if}

    {#if step === 'username'}
      <div class="info-box">
        <div class="info-item"><span class="dot"></span> EXCLUSIVE ACCESS</div>
        <div class="info-item"><span class="dot"></span> GRANT UP TO 5 ALIASES</div>
        <div class="info-item"><span class="dot"></span> DIGITAL ENTRY CODE</div>
      </div>

      <form on:submit|preventDefault={requestOTP}>
        <input
          type="text"
          placeholder="INSTAGRAM USERNAME"
          bind:value={username}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'SENDING...' : 'REQUEST ACCESS'}
        </button>
      </form>
    {:else}
      <div class="otp-info">
        <p>CODE SENT TO @{username}</p>
        {#if devOtp}
          <p class="dev-otp">DEV: {devOtp}</p>
        {/if}
      </div>

      <form on:submit|preventDefault={verifyOTP}>
        <input
          type="text"
          placeholder="ENTER CODE"
          bind:value={otp}
          disabled={loading}
          maxlength="6"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'VERIFYING...' : 'VERIFY'}
        </button>
        <button type="button" class="secondary" on:click={goBack} disabled={loading}>
          BACK
        </button>
      </form>
    {/if}
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
  }

  .login-card {
    background: #0d0d0d;
    padding: 2.5rem;
    border-radius: 3px;
    box-shadow: inset 0 0 40px rgba(0,0,0,0.5), 0 2px 1px rgba(139,58,58,0.1);
    max-width: 420px;
    width: 100%;
    border: 1px solid #2a2a2a;
  }

  .status-line {
    color: #666;
    font-size: 0.7rem;
    letter-spacing: 2px;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .divider {
    width: 100%;
    height: 1px;
    background: #2a2a2a;
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.4rem;
    color: #888;
    letter-spacing: 4px;
    font-weight: 700;
  }

  .subtitle {
    margin: 0 0 2.5rem 0;
    color: #555;
    font-size: 0.75rem;
    letter-spacing: 2px;
  }

  .info-box {
    background: rgba(42, 42, 42, 0.3);
    border: 1px solid #2a2a2a;
    padding: 1.5rem;
    border-radius: 2px;
    margin-bottom: 2rem;
  }

  .info-item {
    margin: 0.9rem 0;
    color: #666;
    font-size: 0.8rem;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .dot {
    width: 4px;
    height: 4px;
    background: #666;
    display: inline-block;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  input {
    padding: 0.9rem;
    border: 1px solid #2a2a2a;
    border-radius: 2px;
    font-size: 0.85rem;
    background: #1a1a1a;
    color: #888;
    letter-spacing: 1px;
    text-align: center;
  }

  input::placeholder {
    color: #4a4a4a;
  }

  input:focus {
    outline: none;
    border-color: #3a3a3a;
    background: #0d0d0d;
  }

  input:disabled {
    opacity: 0.5;
  }

  button {
    display: block;
    background: #2a2a2a;
    color: #888;
    border: 1px solid #3a3a3a;
    padding: 0.9rem 1.5rem;
    border-radius: 2px;
    font-size: 0.8rem;
    font-weight: 700;
    transition: all 0.15s;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #8b3a3a;
    border-color: #8b3a3a;
    color: #d4a574;
    box-shadow: 0 0 12px rgba(139,58,58,0.3);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button.secondary {
    background: transparent;
    border-color: #2a2a2a;
    color: #666;
  }

  button.secondary:hover:not(:disabled) {
    background: #1a1a1a;
    border-color: #3a3a3a;
    color: #888;
    box-shadow: none;
  }

  .error-box {
    background: rgba(139, 58, 58, 0.1);
    border: 1px solid #8b3a3a;
    padding: 0.8rem;
    border-radius: 2px;
    margin-bottom: 1.5rem;
    color: #d4a574;
    font-size: 0.75rem;
    letter-spacing: 1px;
    text-align: center;
  }

  .otp-info {
    background: rgba(42, 42, 42, 0.3);
    border: 1px solid #2a2a2a;
    padding: 1.5rem;
    border-radius: 2px;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .otp-info p {
    margin: 0.5rem 0;
    color: #666;
    font-size: 0.75rem;
    letter-spacing: 1px;
  }

  .dev-otp {
    color: #8b3a3a !important;
    font-family: monospace;
    font-size: 1.2rem !important;
    letter-spacing: 3px !important;
    margin-top: 1rem !important;
  }
</style>
