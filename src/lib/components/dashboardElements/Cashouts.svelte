<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	export let guild: string;
	export let username: string;

	interface Cashout {
		id: number;
		amount: number;
		percentage_cut: number;
		date_registered: string;
		status: string;
	}

	let cashouts: Cashout[] = [];
	let loading = true;
	let error: string | null = null;
	let searchTerm = '';
	let showDetailsModal = false;
	let selectedCashout: Cashout | null = null;

	$: filteredCashouts = cashouts.filter((cashout) =>
		cashout.status.toLowerCase().includes(searchTerm.toLowerCase())
	);

	function getCallerAmount(amount: number, percentage: number): number {
		return Number((amount * (percentage / 100)).toFixed(2));
	}

	function showDetails(cashout: Cashout) {
		selectedCashout = cashout;
		showDetailsModal = true;
	}

	async function fetchCashouts() {
		try {
			const response = await fetch(
				`/api/guild/getCallerCashouts?guild=${guild}&username=${username}`
			);
			const data = await response.json();

			if (data.success) {
				cashouts = data.cashouts;
			} else {
				error = data.error;
			}
			loading = false;
		} catch (err) {
			error = 'Failed to fetch cashouts';
			console.error(err);
			loading = false;
		}
	}

	onMount(() => {
		fetchCashouts();
	});
</script>

<div class="cashouts-container">
	<div class="intro">
		<div class="header-content">
			<div class="title-section">
				<h1>My Cashouts</h1>
				<p>Track your earnings and payment status</p>
			</div>
			<div class="search-box">
				<span class="material-icons search-icon">search</span>
				<input type="text" bind:value={searchTerm} placeholder="Search by status..." />
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
			<span>Loading cashouts...</span>
		</div>
	{:else}
		<div class="table-container" transition:fade>
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Amount</th>
						<th>Date</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredCashouts as cashout}
						<tr transition:slide>
							<td>{cashout.id}</td>
							<td class="amount">
								${getCallerAmount(cashout.amount, cashout.percentage_cut).toLocaleString()}
							</td>
							<td>{new Date(cashout.date_registered).toLocaleDateString()}</td>
							<td>
								<div class="status-badge {cashout.status.toLowerCase()}">
									<span class="material-icons">
										{#if cashout.status === 'completed'}
											check_circle
										{:else if cashout.status === 'pending'}
											schedule
										{:else}
											error
										{/if}
									</span>
									{cashout.status}
								</div>
							</td>
							<td>
								<button class="view-btn" on:click={() => showDetails(cashout)}>
									<span class="material-icons">visibility</span>
									View Details
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showDetailsModal && selectedCashout}
	<div class="modal-backdrop" transition:fade on:click={() => (showDetailsModal = false)}>
		<div class="modal" transition:scale on:click|stopPropagation>
			<div class="modal-header">
				<h2>
					<span class="material-icons">receipt_long</span>
					Cashout Details
				</h2>
				<button class="close-modal" on:click={() => (showDetailsModal = false)}>
					<span class="material-icons">close</span>
				</button>
			</div>

			<div class="modal-content">
				<div class="detail-row">
					<span class="label">Amount</span>
					<span class="value"
						>${getCallerAmount(
							selectedCashout.amount,
							selectedCashout.percentage_cut
						).toLocaleString()}</span
					>
				</div>
				<div class="detail-row">
					<span class="label">Date</span>
					<span class="value">{new Date(selectedCashout.date_registered).toLocaleDateString()}</span
					>
				</div>
				<div class="detail-row">
					<span class="label">Status</span>
					<div class="status-badge {selectedCashout.status.toLowerCase()}">
						<span class="material-icons">
							{#if selectedCashout.status === 'completed'}
								check_circle
							{:else if selectedCashout.status === 'pending'}
								schedule
							{:else}
								error
							{/if}
						</span>
						{selectedCashout.status}
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="close-btn" on:click={() => (showDetailsModal = false)}> Close </button>
			</div>
		</div>
	</div>
{/if}

<style>
	.cashouts-container {
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
		pointer-events: none;
	}

	.search-box input {
		width: 100%;
		padding: 0.8em 1em 0.8em 3em;
		background: rgb(56, 35, 155);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
		border: 1px solid #0f131d;
		color: white;
		border-radius: 0.5em;
		transition: all 0.3s ease;
	}

	.search-box input:focus {
		outline: none;
		border-color: rgba(56, 35, 155, 0.6);
		box-shadow: 0 0 0 2px rgba(56, 35, 155, 0.2);
	}

	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		background: rgb(56, 35, 155);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
		border: 1px solid #0f131d;
		border-radius: 1em;
		overflow: hidden;
	}

	th,
	td {
		padding: 1em;
		text-align: left;
		border-bottom: 1px solid rgba(56, 35, 155, 0.2);
	}

	th {
		color: #8b8b8b;
		font-weight: normal;
		font-size: 0.9em;
	}

	td {
		color: white;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.amount {
		font-family: monospace;
		color: #7ff78f;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 1em;
		border-radius: 2em;
		font-size: 0.9em;
	}

	.status-badge.completed {
		background: rgba(35, 155, 56, 0.2);
		color: #7ff78f;
	}

	.status-badge.pending {
		background: rgba(155, 155, 35, 0.2);
		color: #f7f77f;
	}

	.status-badge.rejected {
		background: rgba(155, 35, 35, 0.2);
		color: #f77f7f;
	}

	.view-btn {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 1em;
		background: rgba(56, 35, 155, 0.2);
		border: none;
		border-radius: 0.5em;
		color: #7f7ff7;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.view-btn:hover {
		background: rgba(56, 35, 155, 0.3);
		transform: translateY(-2px);
	}

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: #1a1f2e;
		border-radius: 1em;
		width: 90%;
		max-width: 500px;
		overflow: hidden;
		border: 1px solid #0f131d;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5em;
		background: rgb(56, 35, 155);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
		border-bottom: 1px solid #0f131d;
	}

	.modal-header h2 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: white;
		font-size: 1.2em;
	}

	.modal-content {
		padding: 1.5em;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1em;
		background: rgba(56, 35, 155, 0.1);
		border-radius: 0.5em;
		margin-bottom: 0.5em;
	}

	.detail-row .label {
		color: #8b8b8b;
	}

	.detail-row .value {
		color: white;
	}

	.modal-footer {
		padding: 1.5em;
		display: flex;
		justify-content: flex-end;
		border-top: 1px solid #0f131d;
	}

	.close-btn {
		padding: 0.8em 1.5em;
		background: rgba(56, 35, 155, 0.2);
		border: none;
		border-radius: 0.5em;
		color: #7f7ff7;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.close-btn:hover {
		background: rgba(56, 35, 155, 0.3);
		transform: translateY(-2px);
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
