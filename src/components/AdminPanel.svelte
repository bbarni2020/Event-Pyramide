<script>
  import { onMount } from 'svelte';
  import { adminService } from '../services/api.js';

  let activeTab = 'users';
  let users = [];
  let invitations = [];
  let config = null;
  let broadcastMessage = '';
  let loading = false;
  let success = '';
  let error = '';
  let selectedUserForBan = null;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      const [usersRes, invitationsRes, configRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getInvitations(),
        adminService.getConfig()
      ]);
      
      users = usersRes.data;
      invitations = invitationsRes.data;
      config = configRes.data;
    } catch (err) {
      error = 'Failed to load data';
      console.error(err);
    }
  }

  async function updateConfig() {
    loading = true;
    error = '';
    success = '';

    try {
      await adminService.updateConfig(config);
      success = 'Configuration updated successfully!';
    } catch (err) {
      error = 'Failed to update configuration';
    } finally {
      loading = false;
    }
  }

  async function toggleBanUser(userId, isBanned) {
    loading = true;
    error = '';
    success = '';

    try {
      const endpoint = isBanned ? `/admin/users/${userId}/unban` : `/admin/users/${userId}/ban`;
      await fetch(endpoint, { method: 'POST', credentials: 'include' });
      await loadData();
      success = `User ${isBanned ? 'unbanned' : 'banned'} successfully!`;
      selectedUserForBan = null;
    } catch (err) {
      error = 'Failed to update user status';
    } finally {
      loading = false;
    }
  }

  async function sendBroadcast() {
    if (!broadcastMessage.trim()) {
      error = 'Please enter a message';
      return;
    }

    loading = true;
    error = '';
    success = '';

    try {
      await adminService.broadcast({ content: broadcastMessage });
      success = 'Broadcast sent successfully!';
      broadcastMessage = '';
    } catch (err) {
      error = 'Failed to send broadcast';
    } finally {
      loading = false;
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleString();
  }
</script>

<div class="admin-panel">
  <div class="status-bar">
    <span class="status-item">SYSTEM: ADMIN</span>
    <span class="status-divider">|</span>
    <span class="status-item">CLEARANCE: UNLIMITED</span>
  </div>

  {#if error}
    <div class="alert error">⚠ {error}</div>
  {/if}

  {#if success}
    <div class="alert success">✓ {success}</div>
  {/if}

  <div class="tabs">
    <button class:active={activeTab === 'users'} on:click={() => activeTab = 'users'}>
      USERS ({users.length})
    </button>
    <button class:active={activeTab === 'invitations'} on:click={() => activeTab = 'invitations'}>
      GRANTS ({invitations.length})
    </button>
    <button class:active={activeTab === 'config'} on:click={() => activeTab = 'config'}>
      CONFIG
    </button>
    <button class:active={activeTab === 'broadcast'} on:click={() => activeTab = 'broadcast'}>
      BROADCAST
    </button>
  </div>

  <div class="tab-content">
    {#if activeTab === 'users'}
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ALIAS</th>
              <th>INSTAGRAM ID</th>
              <th>ADMIN</th>
              <th>STATUS</th>
              <th>REGISTERED</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {#each users as user}
              <tr>
                <td class="alias">@{user.username}</td>
                <td class="monospace">{user.instagramId}</td>
                <td>{user.isAdmin ? '✓' : '—'}</td>
                <td>
                  {#if user.isBanned}
                    <span class="badge banned">BANNED</span>
                  {:else}
                    <span class="badge active">ACTIVE</span>
                  {/if}
                </td>
                <td class="timestamp">{formatDate(user.createdAt)}</td>
                <td>
                  <button 
                    class="action-btn" 
                    on:click={() => toggleBanUser(user.id, user.isBanned)}
                    disabled={loading}
                  >
                    {user.isBanned ? 'RESTORE' : 'BAN'}
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if activeTab === 'invitations'}
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>GRANTER</th>
              <th>RECIPIENT</th>
              <th>STATUS</th>
              <th>ISSUED</th>
              <th>CONFIRMED</th>
            </tr>
          </thead>
          <tbody>
            {#each invitations as inv}
              <tr>
                <td class="alias">@{inv.inviterUsername}</td>
                <td class="alias">@{inv.inviteeUsername}</td>
                <td><span class="indicator indicator-{inv.status}"></span> {inv.status.toUpperCase()}</td>
                <td class="timestamp">{formatDate(inv.createdAt)}</td>
                <td class="timestamp">{inv.acceptedAt ? formatDate(inv.acceptedAt) : '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if activeTab === 'config' && config}
      <div class="config-form">
        <fieldset>
          <legend>EVENT DETAILS</legend>
          <div class="form-group">
            <label for="eventDate">EVENT DATE</label>
            <input id="eventDate" type="datetime-local" bind:value={config.eventDate} />
          </div>
          <div class="form-group">
            <label for="maxCap">MAX CAPACITY</label>
            <input id="maxCap" type="number" bind:value={config.maxParticipants} />
          </div>
          <div class="form-group">
            <label for="releaseDate">COUNT RELEASE DATE</label>
            <input id="releaseDate" type="datetime-local" bind:value={config.memberCountReleaseDate} />
          </div>
        </fieldset>

        <fieldset>
          <legend>TICKET PRICING</legend>
          <div class="form-row">
            <div class="form-group">
              <label for="ticketPrice">TICKET PRICE</label>
              <input id="ticketPrice" type="number" step="0.01" bind:value={config.ticketPrice} />
            </div>
            <div class="form-group">
              <label for="currency">CURRENCY</label>
              <input id="currency" type="text" bind:value={config.currency} placeholder="USD" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>INVITE & DISCOUNT SETTINGS</legend>
          <div class="form-row">
            <div class="form-group">
              <label for="maxInvites">MAX INVITES PER USER</label>
              <input id="maxInvites" type="number" bind:value={config.maxInvitesPerUser} />
            </div>
            <div class="form-group">
              <label for="maxDiscount">MAX DISCOUNT (%) — All Invites Accepted</label>
              <input id="maxDiscount" type="number" step="0.01" bind:value={config.maxDiscountPercent} />
            </div>
          </div>
        </fieldset>

        <button on:click={updateConfig} disabled={loading} class="submit-btn">
          {loading ? 'APPLYING...' : 'APPLY CHANGES'}
        </button>
      </div>
    {:else if activeTab === 'broadcast'}
      <div class="broadcast-section">
        <div class="broadcast-header">SYSTEM BROADCAST</div>
        <textarea 
          bind:value={broadcastMessage} 
          placeholder="ENTER MESSAGE..."
          rows="6"
        />
        <button on:click={sendBroadcast} disabled={loading || !broadcastMessage.trim()} class="submit-btn">
          {loading ? 'TRANSMITTING...' : 'TRANSMIT MESSAGE'}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .admin-panel {
    color: #888;
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

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .tabs button {
    background: #1a1a1a;
    color: #666;
    border: 1px solid #2a2a2a;
    padding: 0.6rem 1rem;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.7rem;
    letter-spacing: 1.5px;
    transition: all 0.15s;
    font-weight: 600;
  }

  .tabs button:hover {
    border-color: #3a3a3a;
    color: #888;
  }

  .tabs button.active {
    background: #8b3a3a;
    color: #d4a574;
    border-color: #8b3a3a;
  }

  .tab-content {
    background: #0d0d0d;
    padding: 0;
    border-radius: 2px;
    box-shadow: inset 0 0 30px rgba(0,0,0,0.5);
    border: 1px solid #2a2a2a;
  }

  .table-container {
    overflow-x: auto;
    padding: 1.5rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 0.8rem 1rem;
    text-align: left;
    border-bottom: 1px solid #1a1a1a;
  }

  th {
    font-size: 0.7rem;
    letter-spacing: 2px;
    font-weight: 700;
    color: #555;
    background: none;
  }

  td {
    color: #888;
    font-size: 0.85rem;
  }

  tr:hover td {
    background: rgba(42, 42, 42, 0.3);
  }

  .alias {
    font-family: monospace;
    letter-spacing: 0.5px;
  }

  .monospace {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    color: #666;
  }

  .timestamp {
    font-size: 0.75rem;
    color: #555;
    font-family: monospace;
  }

  .badge {
    display: inline-block;
    padding: 0.3rem 0.6rem;
    border-radius: 2px;
    font-size: 0.65rem;
    letter-spacing: 1px;
    font-weight: 700;
  }

  .badge.active {
    background: rgba(122, 155, 126, 0.2);
    color: #7a9b7e;
  }

  .badge.banned {
    background: rgba(139, 58, 58, 0.2);
    color: #d4a574;
  }

  .action-btn {
    background: #2a2a2a;
    color: #888;
    border: 1px solid #3a3a3a;
    padding: 0.4rem 0.8rem;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 1px;
    transition: all 0.15s;
  }

  .action-btn:hover:not(:disabled) {
    background: #8b3a3a;
    border-color: #8b3a3a;
    color: #d4a574;
  }

  .action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .indicator {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 0.5rem;
  }

  .indicator-pending {
    background: #666;
  }

  .indicator-accepted {
    background: #8b3a3a;
  }

  .config-form {
    padding: 2rem;
    max-width: 800px;
  }

  fieldset {
    border: 1px solid #2a2a2a;
    border-radius: 2px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    background: rgba(20, 20, 20, 0.5);
  }

  legend {
    padding: 0 0.8rem;
    font-size: 0.7rem;
    letter-spacing: 2px;
    font-weight: 700;
    color: #666;
  }

  .form-group {
    margin-bottom: 1.2rem;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.6rem;
    font-size: 0.7rem;
    letter-spacing: 1px;
    color: #666;
    font-weight: 700;
  }

  .form-group input {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #2a2a2a;
    border-radius: 2px;
    font-size: 0.85rem;
    background: #1a1a1a;
    color: #888;
    font-family: inherit;
  }

  .form-group input:focus {
    outline: none;
    border-color: #3a3a3a;
    background: #0d0d0d;
  }

  .submit-btn {
    background: #2a2a2a;
    color: #888;
    border: 1px solid #3a3a3a;
    padding: 0.8rem 1.5rem;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 2px;
    transition: all 0.15s;
    margin-top: 1rem;
  }

  .submit-btn:hover:not(:disabled) {
    background: #8b3a3a;
    border-color: #8b3a3a;
    color: #d4a574;
  }

  .submit-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .broadcast-section {
    padding: 2rem;
  }

  .broadcast-header {
    font-size: 0.8rem;
    letter-spacing: 3px;
    color: #666;
    margin-bottom: 1.5rem;
    font-weight: 700;
  }

  textarea {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #2a2a2a;
    border-radius: 2px;
    font-size: 0.85rem;
    font-family: inherit;
    resize: vertical;
    margin-bottom: 1rem;
    background: #1a1a1a;
    color: #888;
    min-height: 120px;
  }

  textarea::placeholder {
    color: #4a4a4a;
    letter-spacing: 1px;
  }

  textarea:focus {
    outline: none;
    border-color: #3a3a3a;
    background: #0d0d0d;
  }
</style>
