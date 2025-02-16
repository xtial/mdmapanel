<script lang="ts">
	import '$lib/components/titleAnimation.sass';

	import Overview from '$lib/components/dashboardElements/Overview.svelte';
	import Dashboard from '$lib/components/dashboardElements/Dashboard.svelte';
	import Mailer from '$lib/components/dashboardElements/Mailer.svelte';
	import Settings from '$lib/components/dashboardElements/Settings.svelte';
	import Account from '$lib/components/dashboardElements/Account.svelte';
	import Domains from '$lib/components/dashboardElements/Domains.svelte';
	import Cashouts from '$lib/components/dashboardElements/Cashouts.svelte';
	import SMSPage from '$lib/components/dashboardElements/SMSPage.svelte';
	import Routing from '$lib/components/dashboardElements/Routing.svelte';
	import bootstrap from '$lib/images/bootstrap.svg';
	import Narc from '$lib/images/narc.png';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { jwtDecode } from 'jwt-decode';
	import { fade } from 'svelte/transition';

	let selectedElement = $state('lol');
	let authToken;
	let username = $state('Guest');
	let guild = $state('');
	let loading = $state(true);

	async function fetchGuild() {
		try {
			const response = await fetch(`/api/guild/getGuild?username=${username}`);
			const data = await response.json();
			guild = data.guild;
		} catch (error) {
			console.error('Error fetching guild:', error);
		}
	}

	function setElement(element: string) {
		selectedElement = element;
	}

	function handleLogout() {
		goto('/logout');
	}

	onMount(async () => {
		authToken = localStorage.getItem('authToken');
		if (authToken) {
			try {
				const decodedToken = jwtDecode(authToken);
				username = decodedToken.userName;
				await fetchGuild();
			} catch (error) {
				console.error('Error decoding token:', error);
				goto('/login');
			}
		} else {
			goto('/login');
		}

		setTimeout(() => {
			selectedElement = 'Overview';
			loading = false;
		}, 4000);
	});
</script>

{#if loading}
	<div class="loading-screen {loading ? '' : 'hidden'}" transition:fade>
		<div class="loadingLogo">
			<img src={bootstrap} alt="Logo" />
			<div class="loading-text">
				<h1>Eulen<span class="accent">.</span></h1>
				<p class="user-badge">DASHBOARD</p>
			</div>
		</div>
	</div>
{/if}

<div class="dashboard-container">
	<div class="sidebar">
		<div class="logo-section">
			<img src={bootstrap} alt="Logo" />
			<div class="brand">
				<h1>Eulen<span class="accent">.</span></h1>
				<div class="user-tag">{username}</div>
			</div>
		</div>

		<div class="navigation-section">
			<div class="nav-group">
				<h3>
					<span class="material-icons">dashboard</span>
					Main Panel
				</h3>
				<div class="nav-items">
					<button
						class="nav-item"
						class:active={selectedElement === 'Overview'}
						on:click={() => setElement('Overview')}
					>
						<span class="material-icons">home</span>
						Overview
					</button>

					<button
						class="nav-item"
						class:active={selectedElement === 'Dashboard'}
						on:click={() => setElement('Dashboard')}
					>
						<span class="material-icons">analytics</span>
						Dashboard
					</button>

					<button
						class="nav-item"
						class:active={selectedElement === 'Routing'}
						on:click={() => setElement('Routing')}
					>
						<span class="material-icons">sync_alt</span>
						Routing
					</button>

					<button
						class="nav-item"
						class:active={selectedElement === 'Cashouts'}
						on:click={() => setElement('Cashouts')}
					>
						<span class="material-icons">payments</span>
						Cashouts
					</button>

					<button
						class="nav-item"
						class:active={selectedElement === 'Domains'}
						on:click={() => setElement('Domains')}
					>
						<span class="material-icons">language</span>
						Domains
					</button>
				</div>
			</div>

			<div class="nav-group">
				<h3>
					<span class="material-icons">chat</span>
					Outreach Tools
				</h3>
				<div class="nav-items">
					<button
						class="nav-item"
						class:active={selectedElement === 'Mailer'}
						on:click={() => setElement('Mailer')}
					>
						<span class="material-icons">mail</span>
						Mailer
					</button>

					<button
						class="nav-item"
						class:active={selectedElement === 'SMSPage'}
						on:click={() => setElement('SMSPage')}
					>
						<span class="material-icons">sms</span>
						SMS
					</button>
				</div>
			</div>

			<div class="nav-group">
				<h3>
					<span class="material-icons">manage_accounts</span>
					Account
				</h3>
				<div class="nav-items">
					<button
						class="nav-item"
						class:active={selectedElement === 'Settings'}
						on:click={() => setElement('Settings')}
					>
						<span class="material-icons">settings</span>
						Settings
					</button>

					<button
						class="nav-item"
						class:active={selectedElement === 'myAccount'}
						on:click={() => setElement('myAccount')}
					>
						<span class="material-icons">person</span>
						My Account
					</button>

					<button class="nav-item logout" on:click={handleLogout}>
						<span class="material-icons">logout</span>
						Logout
					</button>
				</div>
			</div>
		</div>
	</div>

	<main class="content-area">
		<div class="content-container" in:fade>
			{#if selectedElement === 'Overview'}
				<Overview {username} {guild} />
			{:else if selectedElement === 'Dashboard'}
				<Dashboard {username} {guild} />
			{:else if selectedElement === 'myAccount'}
				<Account {username} {guild} />
			{:else if selectedElement === 'Settings'}
				<Settings {username} {guild} />
			{:else if selectedElement === 'Domains'}
				<Domains {username} {guild} />
			{:else if selectedElement === 'Cashouts'}
				<Cashouts {username} {guild} />
			{:else if selectedElement === 'Mailer'}
				<Mailer {username} {guild} />
			{:else if selectedElement === 'SMSPage'}
				<SMSPage {username} {guild} />
			{:else if selectedElement === 'Routing'}
				<Routing {username} {guild} />
			{/if}
		</div>
	</main>
</div>

<style>
	.dashboard-container {
		display: flex;
		min-height: 100vh;
		background: linear-gradient(130deg, rgba(14, 13, 21, 0.99) 0%, rgba(56, 35, 155, 0.05) 100%);
	}

	.sidebar {
		width: 280px;
		background: linear-gradient(180deg, rgba(14, 13, 21, 0.97) 0%, rgba(56, 35, 155, 0.08) 100%);
		border-right: 1px solid rgba(98, 71, 218, 0.2);
		padding: 2em;
		display: flex;
		flex-direction: column;
		gap: 3em;
		position: relative;
		backdrop-filter: blur(10px);
	}

	.logo-section {
		display: flex;
		align-items: center;
		gap: 1em;
		padding-bottom: 1.5em;
		border-bottom: 1px solid rgba(98, 71, 218, 0.15);
	}

	.logo-section img {
		width: 40px;
		height: 40px;
		filter: drop-shadow(0 0 8px rgba(98, 71, 218, 0.3));
		transition: all 0.3s ease;
	}

	.brand {
		display: flex;
		flex-direction: column;
	}

	.brand h1 {
		font-size: 1.5em;
		color: white;
		margin: 0;
		line-height: 1;
	}

	.accent {
		color: rgba(98, 71, 218, 1);
	}

	.user-tag {
		font-size: 0.8em;
		color: rgba(98, 71, 218, 0.8);
		letter-spacing: 0.05em;
		background: rgba(98, 71, 218, 0.1);
		padding: 0.3em 0.8em;
		border-radius: 1em;
		border: 1px solid rgba(98, 71, 218, 0.2);
		margin-top: 0.3em;
	}

	.navigation-section {
		display: flex;
		flex-direction: column;
		gap: 2em;
	}

	.nav-group h3 {
		font-size: 0.75em;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #8b8b8b;
		margin: 0 0 1em 0;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.nav-group h3 .material-icons {
		font-size: 1.2em;
		color: rgba(98, 71, 218, 0.8);
	}

	.nav-items {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.8em;
		padding: 1em 1.2em;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 0.8em;
		color: #8b8b8b;
		font-size: 0.9em;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		text-align: left;
	}

	.nav-item:hover {
		color: white;
		background: rgba(98, 71, 218, 0.1);
		border-color: rgba(98, 71, 218, 0.2);
		transform: translateX(0.5em);
	}

	.nav-item.active {
		color: white;
		background: linear-gradient(90deg, rgba(98, 71, 218, 0.15), rgba(14, 13, 21, 0.3));
		border: 1px solid rgba(98, 71, 218, 0.3);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.2);
		transform: translateX(0.5em);
	}

	.nav-item .material-icons {
		font-size: 1.2em;
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.9), rgba(56, 35, 155, 0.9));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		transition: all 0.3s ease;
	}

	.nav-item:hover .material-icons {
		filter: drop-shadow(0 0 8px rgba(98, 71, 218, 0.4));
		transform: scale(1.1);
	}

	.logout {
		margin-top: 1em;
		border-top: 1px solid rgba(98, 71, 218, 0.1);
		padding-top: 1.5em;
	}

	.logout .material-icons {
		color: #ff4444 !important;
		background: linear-gradient(45deg, #ff4444, #ff3232);
		-webkit-background-clip: text;
	}

	.logout:hover {
		color: #ff4444;
		background: rgba(255, 68, 68, 0.05);
		border-color: rgba(255, 68, 68, 0.2);
	}

	.content-area {
		flex: 1;
		padding: 2em;
		overflow-y: auto;
	}

	.content-container {
		max-width: 1600px;
		margin: 0 auto;
	}

	/* Loading Screen */
	.loading-screen {
		position: fixed;
		inset: 0;
		background: linear-gradient(130deg, rgba(14, 13, 21, 0.99) 0%, rgba(56, 35, 155, 0.1) 100%);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.loadingLogo {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.loadingLogo img {
		width: 60px;
		height: 60px;
		animation: pulse 2s infinite;
		filter: drop-shadow(0 0 12px rgba(98, 71, 218, 0.4));
	}

	.loading-text h1 {
		font-size: 2.5em;
		color: white;
		margin: 0;
	}

	.user-badge {
		font-size: 0.8em;
		color: rgba(98, 71, 218, 0.8);
		letter-spacing: 0.2em;
		margin: 0;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1) rotate(0deg);
			filter: drop-shadow(0 0 12px rgba(98, 71, 218, 0.4));
		}
		50% {
			transform: scale(1.1) rotate(180deg);
			filter: drop-shadow(0 0 20px rgba(98, 71, 218, 0.6));
		}
	}

	/* Custom Scrollbar */
	.content-area::-webkit-scrollbar {
		width: 6px;
	}

	.content-area::-webkit-scrollbar-track {
		background: rgba(14, 13, 21, 0.2);
	}

	.content-area::-webkit-scrollbar-thumb {
		background: rgba(98, 71, 218, 0.2);
		border-radius: 3px;
		transition: all 0.3s ease;
	}

	.content-area::-webkit-scrollbar-thumb:hover {
		background: rgba(98, 71, 218, 0.4);
	}
</style>
