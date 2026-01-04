<script>
  import { onMount } from 'svelte';
  import { user, isAuthenticated, isLoading } from './stores/auth.js';
  import { authService } from './services/api.js';
  import Login from './components/Login.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import AdminPanel from './components/AdminPanel.svelte';

  let currentView = 'login';

  onMount(async () => {
    try {
      const response = await authService.checkStatus();
      if (response.data.authenticated) {
        $user = response.data.user;
        $isAuthenticated = true;
        currentView = $user.isAdmin ? 'admin' : 'dashboard';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      $isLoading = false;
    }
  });

  function handleLogout() {
    authService.logout().then(() => {
      $user = null;
      $isAuthenticated = false;
      currentView = 'login';
    });
  }

  function switchView(view) {
    currentView = view;
  }
</script>

<main>
  {#if $isLoading}
    <div class="loading">Loading...</div>
  {:else if !$isAuthenticated}
    <Login />
  {:else}
    <nav class="navbar">
      <div class="nav-content">
        <h1>Event Pyramide</h1>
        <div class="nav-actions">
          <span class="user-info">
            {$user.username}
            {#if $user.isAdmin}
              <span class="admin-badge">ADMIN</span>
            {/if}
          </span>
          {#if $user.isAdmin}
            <button on:click={() => switchView('dashboard')}>Dashboard</button>
            <button on:click={() => switchView('admin')}>Admin Panel</button>
          {/if}
          <button on:click={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>

    <div class="container">
      {#if currentView === 'dashboard'}
        <Dashboard />
      {:else if currentView === 'admin'}
        <AdminPanel />
      {/if}
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto Condensed', sans-serif;
    background: #1a1a1a;
    background-image: 
      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.1) 2px, rgba(0,0,0,.1) 4px),
      linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
    min-height: 100vh;
    color: #a0a0a0;
  }

  main {
    min-height: 100vh;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    color: #666;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-family: monospace;
  }

  .navbar {
    background: rgba(13, 13, 13, 0.98);
    backdrop-filter: blur(10px);
    padding: 0.75rem 0;
    border-bottom: 1px solid #2a2a2a;
  }

  .nav-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-content h1 {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 3px;
    font-weight: 700;
  }

  .nav-actions {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .user-info {
    font-weight: 400;
    color: #666;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .admin-badge {
    background: #8b3a3a;
    color: #d4a574;
    padding: 0.15rem 0.4rem;
    border-radius: 2px;
    font-size: 0.7rem;
    margin-left: 0.5rem;
    letter-spacing: 1px;
  }

  button {
    background: #2a2a2a;
    color: #888;
    border: 1px solid #3a3a3a;
    padding: 0.4rem 0.9rem;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.15s;
  }

  button:hover {
    background: #8b3a3a;
    border-color: #8b3a3a;
    color: #d4a574;
  }

  .container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 2rem;
  }
</style>
