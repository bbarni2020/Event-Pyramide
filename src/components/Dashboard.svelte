<script>
  import { onMount } from 'svelte';
  import { user } from '../stores/auth.js';
  import { invitationService, eventService } from '../services/api.js';
  import { authService } from '../services/api.js';

  let invitations = [];
  let newInvitation = { instagram_id: '' };
  let config = null;
  let attending = null;
  let loading = false;
  let error = '';
  let success = '';

  onMount(async () => {
    await loadInvitations();
    await loadConfig();
    await loadAttendance();
  });

  async function loadInvitations() {
    try {
      const response = await invitationService.getMyInvitations();
      invitations = response.data;
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  }

  async function loadConfig() {
    try {
      const response = await eventService.getConfig();
      config = response.data;
    } catch (err) {
      console.error('Failed to load event config:', err);
    }
  }

  async function loadAttendance() {
    try {
      const response = await authService.checkStatus();
      if (response.data.authenticated && response.data.user) {
        attending = response.data.user.attending;
      }
    } catch (err) {
      console.error('Failed to load attendance status:', err);
    }
  }

  async function sendInvitation() {
    if (!newInvitation.instagram_id) {
      error = 'Please fill in Instagram ID';
      return;
    }

    loading = true;
    error = '';
    success = '';

    try {
      // Use instagram_id as username/alias
      await invitationService.createInvitation({
        instagram_id: newInvitation.instagram_id,
        username: newInvitation.instagram_id
      });
      success = 'Invitation sent successfully!';
      newInvitation = { instagram_id: '' };
      await loadInvitations();
    } catch (err) {
      error = err.response?.data?.error || 'Failed to send invitation';
    } finally {
      loading = false;
    }
  }

  async function setAttendance(value) {
    try {
      error = '';
      success = '';
      console.log('Attendance changed:', { userId: $user.id, username: $user.username, attending: value });
      await authService.setAttendance(value);
      attending = value;
      success = `You've marked yourself as ${value ? 'attending' : 'not attending'}`;
    } catch (err) {
      error = 'Failed to update attendance';
      console.error(err);
    }
  }

  const invitationLimit = $user.isAdmin ? '∞' : (config?.maxInvitesPerUser || 5);
  const remainingInvites = $user.isAdmin ? '∞' : Math.max(0, (config?.maxInvitesPerUser || 5) - invitations.length);

</script>

<div class="dashboard">
  <div class="status-bar">
    <span class="status-item">ALIAS: {$user.username}</span>
  </div>

  {#if error}
    <div class="alert error">⚠ {error}</div>
  {/if}

  {#if success}
    <div class="alert success">✓ {success}</div>
  {/if}

  <div class="grid">
    <div class="panel">
      <div class="panel-header">
        <h3>GRANT ACCESS</h3>
        <div class="quota">REMAINING: {remainingInvites} / {invitationLimit}</div>
      </div>
      
      <form on:submit|preventDefault={sendInvitation}>
        <input
          type="text"
          placeholder="INSTAGRAM ID"
          bind:value={newInvitation.instagram_id}
          disabled={loading || (!$user.isAdmin && invitations.length >= 5)}
        />
        <button 
          type="submit" 
          disabled={loading || (!$user.isAdmin && invitations.length >= 5)}
        >
          {loading ? 'PROCESSING...' : 'GRANT ACCESS'}
        </button>
      </form>

      <div class="list-section">
        <div class="list-header">GRANTED ({invitations.length})</div>
        {#each invitations as invitation}
          <div class="list-row">
            <span class="indicator indicator-{invitation.status}"></span>
            <span class="alias">@{invitation.inviteeUsername}</span>
            <span class="status-text">{invitation.status.toUpperCase()}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h3>EVENT TICKET</h3>
      </div>
      <div class="ticket-info">
        <div class="price-display">
          <div class="price-label">TICKET PRICE</div>
          <div class="price-value">USD 50.00</div>
        </div>
        <div class="attendance-section">
          <div class="attendance-label">ATTENDANCE</div>
          <div class="button-group">
            <button 
              class="attendance-btn" 
              class:active={attending === true}
              on:click={() => setAttendance(true)}
            >
              ATTENDING
            </button>
            <button 
              class="attendance-btn" 
              class:active={attending === false}
              on:click={() => setAttendance(false)}
            >
              NOT ATTENDING
            </button>
          </div>
          {#if attending !== null}
            <div class="status-badge" class:going={attending}>
              {attending ? '✓ You\'re attending' : '✗ Not attending'}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 2rem 0;
  }

  .status-bar {
    margin-bottom: 2.5rem;
    padding: 0.6rem 0;
    border-top: 1px solid #2a2a2a;
    border-bottom: 1px solid #2a2a2a;
    display: flex;
    gap: 1.5rem;
    font-size: 0.7rem;
    letter-spacing: 2px;
    color: #666;
  }

  .status-divider {
    color: #3a3a3a;
  }

  .alert {
    padding: 0.7rem 1rem;
    margin-bottom: 1.5rem;
    font-size: 0.75rem;
    letter-spacing: 1px;
    border-left: 2px solid;
  }

  .alert.error {
    background: rgba(139, 58, 58, 0.1);
    border-color: #8b3a3a;
    color: #d4a574;
  }

  .alert.success {
    background: rgba(122, 155, 126, 0.1);
    border-color: #7a9b7e;
    color: #7a9b7e;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 2rem;
  }

  .panel {
    background: #0d0d0d;
    padding: 0;
    border-radius: 2px;
    box-shadow: inset 0 0 30px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.03);
    border: 1px solid #2a2a2a;
  }

  .panel-header {
    padding: 1.2rem 1.5rem;
    border-bottom: 1px solid #2a2a2a;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-header h3 {
    margin: 0;
    color: #666;
    font-size: 0.8rem;
    letter-spacing: 3px;
    font-weight: 700;
  }

  .quota {
    font-size: 0.7rem;
    color: #555;
    letter-spacing: 1px;
    font-family: monospace;
  }

  form {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  input {
    padding: 0.8rem;
    border: 1px solid #2a2a2a;
    border-radius: 2px;
    font-size: 0.8rem;
    background: #1a1a1a;
    color: #888;
    letter-spacing: 1px;
    font-family: inherit;
  }

  input::placeholder {
    color: #4a4a4a;
    letter-spacing: 1px;
  }

  input:focus {
    outline: none;
    border-color: #3a3a3a;
    background: #0d0d0d;
  }

  input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  button {
    background: #2a2a2a;
    color: #888;
    border: 1px solid #3a3a3a;
    padding: 0.8rem;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 2px;
    transition: all 0.15s;
  }

  button:hover:not(:disabled) {
    background: #8b3a3a;
    border-color: #8b3a3a;
    color: #d4a574;
  }

  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .list-section {
    padding: 1.5rem;
    border-top: 1px solid #2a2a2a;
  }

  .list-header {
    font-size: 0.7rem;
    color: #555;
    letter-spacing: 2px;
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .list-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.7rem 0;
    border-bottom: 1px solid #1a1a1a;
  }

  .list-row:last-child {
    border-bottom: none;
  }

  .indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .indicator-pending {
    background: #666;
  }

  .indicator-accepted {
    background: #8b3a3a;
  }

  .alias {
    flex: 1;
    font-size: 0.85rem;
    color: #888;
    letter-spacing: 0.5px;
  }

  .status-text {
    font-size: 0.7rem;
    color: #555;
    letter-spacing: 1px;
    font-family: monospace;
  }

  .ticket-info {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .price-display {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .price-label {
    font-size: 0.7rem;
    color: #555;
    letter-spacing: 2px;
    font-weight: 700;
  }

  .price-value {
    font-size: 1.4rem;
    color: #d4a574;
    letter-spacing: 1px;
    font-family: monospace;
    font-weight: 600;
  }

  .attendance-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .attendance-label {
    font-size: 0.7rem;
    color: #555;
    letter-spacing: 2px;
    font-weight: 700;
  }

  .button-group {
    display: flex;
    gap: 0.8rem;
  }

  .attendance-btn {
    flex: 1;
    padding: 0.8rem;
    background: #2a2a2a;
    color: #555;
    border: 1px solid #3a3a3a;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 2px;
    transition: all 0.15s;
  }

  .attendance-btn:hover:not(:disabled) {
    background: #3a3a3a;
    border-color: #4a4a4a;
    color: #888;
  }

  .attendance-btn.active {
    background: #8b3a3a;
    border-color: #8b3a3a;
    color: #d4a574;
  }

  .attendance-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .status-badge {
    font-size: 0.75rem;
    padding: 0.6rem 1rem;
    border-radius: 2px;
    letter-spacing: 1px;
    text-align: center;
    background: rgba(139, 58, 58, 0.15);
    color: #d4a574;
    border: 1px solid rgba(139, 58, 58, 0.4);
  }

  .status-badge.going {
    background: rgba(122, 155, 126, 0.15);
    color: #7a9b7e;
    border-color: rgba(122, 155, 126, 0.4);
  }
</style>
