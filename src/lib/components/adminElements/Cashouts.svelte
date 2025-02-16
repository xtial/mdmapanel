<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	export let guild: string;

	interface Cashout {
		id: number;
		username: string;
		amount: number;
		percentage_cut: number;
		date_registered: string;
		status: string;
	}

	interface Caller {
		username: string;
		userid: string;
	}

	let cashouts: Cashout[] = [];
	let callers: Caller[] = [];
	let loading = true;
	let error: string | null = null;
	let searchTerm = '';
	let showAddModal = false;
	let showDeleteConfirm = false;
	let selectedCashout: Cashout | null = null;
	let showStatusModal = false;
	let selectedStatus = 'pending';

	let newCashout = {
		username: '',
		totalAmount: 0,
		percentage_cut: 20.0,
		amount: 0,
		status: 'pending'
	};

	function getCallerAmount(amount: number, percentage: number): number {
		return Number((amount * (percentage / 100)).toFixed(2));
	}

	$: {
		newCashout.amount = newCashout.totalAmount;
	}

	$: filteredCashouts = cashouts.filter(
		(cashout) =>
			cashout.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cashout.status.toLowerCase().includes(searchTerm.toLowerCase())
	);

	async function fetchCallers() {
		try {
			const response = await fetch('/api/guild/getGuildCallers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ guild })
			});

			const data = await response.json();
			if (data.success) {
				callers = data.users;
			}
		} catch (err) {
			console.error('Error fetching callers:', err);
		}
	}

	async function fetchCashouts() {
		try {
			const response = await fetch(`/api/guild/getCashouts?guild=${guild}`);
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

	async function registerCashout() {
		try {
			const response = await fetch('/api/guild/registerCashout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...newCashout,
					date_registered: new Date().toISOString(),
					guild
				})
			});

			if (response.ok) {
				showAddModal = false;
				newCashout = {
					username: '',
					totalAmount: 0,
					percentage_cut: 20.0,
					amount: 0,
					status: 'pending'
				};
				await fetchCashouts();
			} else {
				error = 'Failed to register cashout';
			}
		} catch (err) {
			error = 'Error registering cashout';
			console.error(err);
		}
	}

	function initiateDelete(cashout: Cashout) {
		selectedCashout = cashout;
		showDeleteConfirm = true;
	}

	async function deleteCashout() {
		if (!selectedCashout) return;

		try {
			const response = await fetch('/api/guild/deleteCashout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: selectedCashout.id,
					guild
				})
			});

			if (response.ok) {
				showDeleteConfirm = false;
				selectedCashout = null;
				await fetchCashouts();
			} else {
				error = 'Failed to delete cashout';
			}
		} catch (err) {
			error = 'Error deleting cashout';
			console.error(err);
		}
	}

	async function updateCashoutStatus(cashout: Cashout, status: string) {
		try {
			const response = await fetch('/api/guild/updateCashout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: cashout.id,
					guild: guild,
					status
				})
			});

			if (response.ok) {
				showStatusModal = false;
				selectedCashout = null;
				await fetchCashouts();
			} else {
				error = 'Failed to update cashout status';
			}
		} catch (err) {
			error = 'Error updating cashout status';
			console.error(err);
		}
	}

	onMount(() => {
		fetchCashouts();
		fetchCallers();
	});
</script>

<div class="cashouts-container">
	<div class="intro">
		<div class="header-content">
			<div class="title-section">
				<h1>Cashouts</h1>
				<p>Manage caller cashouts</p>
			</div>
			<div class="search-box">
				<span class="material-icons search-icon">search</span>
				<input type="text" bind:value={searchTerm} placeholder="Search cashouts..." />
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

	<div class="actions">
		<button class="add-btn" on:click={() => (showAddModal = true)}>
			<span class="material-icons">add</span>
			Register Cashout
		</button>
	</div>

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
						<th>Caller</th>
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
							<td>{cashout.username}</td>
							<td>${getCallerAmount(cashout.amount, cashout.percentage_cut).toLocaleString()}</td>
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
								<div class="action-buttons">
									<button
										class="status-btn {cashout.status.toLowerCase()}"
										on:click={() => {
											selectedCashout = cashout;
											showStatusModal = true;
										}}
									>
										<span class="material-icons">update</span>
										Update Status
									</button>
									<button class="delete-btn" on:click={() => initiateDelete(cashout)}>
										<span class="material-icons">delete</span>
										Delete
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showAddModal}
	<div class="modal-backdrop" transition:fade on:click={() => (showAddModal = false)}>
		<div class="modal" transition:scale on:click|stopPropagation>
			<div class="modal-header">
				<h2>
					<span class="material-icons">payments</span>
					Register Cashout
				</h2>
				<button class="close-modal" on:click={() => (showAddModal = false)}>
					<span class="material-icons">close</span>
				</button>
			</div>

			<form on:submit|preventDefault={registerCashout}>
				<div class="form-group">
					<label for="caller">Caller</label>
					<select id="caller" bind:value={newCashout.username} required>
						<option value="">Select a caller</option>
						{#each callers as caller}
							<option value={caller.username}>{caller.username}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="totalAmount">Total Amount ($)</label>
					<div class="amount-input">
						<span class="currency-symbol">$</span>
						<input
							type="number"
							id="totalAmount"
							bind:value={newCashout.totalAmount}
							min="0"
							step="0.01"
							required
							placeholder="Enter total amount"
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="percentage">Caller's Cut (%)</label>
					<div class="percentage-input">
						<input
							type="number"
							id="percentage"
							bind:value={newCashout.percentage_cut}
							min="0"
							max="100"
							step="0.01"
							required
							placeholder="Enter caller's percentage"
						/>
						<span class="percentage-symbol">%</span>
					</div>
				</div>

				<div class="split-preview">
					<h3>
						<span class="material-icons">calculate</span>
						Split Preview
					</h3>
					<div class="split-amounts">
						<div class="amount-row caller">
							<div class="amount-info">
								<span class="label">Caller's Amount</span>
								<span class="percentage">({newCashout.percentage_cut}%)</span>
							</div>
							<span class="amount"
								>${getCallerAmount(
									newCashout.totalAmount,
									newCashout.percentage_cut
								).toLocaleString('en-US', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})}</span
							>
						</div>
						<div class="amount-row owner">
							<div class="amount-info">
								<span class="label">Your Amount</span>
								<span class="percentage">({(100 - newCashout.percentage_cut).toFixed(2)}%)</span>
							</div>
							<span class="amount"
								>${(
									newCashout.totalAmount -
									getCallerAmount(newCashout.totalAmount, newCashout.percentage_cut)
								).toLocaleString('en-US', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})}</span
							>
						</div>
						<div class="amount-row total">
							<span class="label">Total Amount</span>
							<span class="amount"
								>${newCashout.totalAmount.toLocaleString('en-US', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})}</span
							>
						</div>
					</div>
				</div>

				<div class="modal-actions">
					<button type="button" class="secondary" on:click={() => (showAddModal = false)}>
						Cancel
					</button>
					<button type="submit" class="primary">
						<span class="material-icons">payments</span>
						Register Cashout
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showDeleteConfirm}
	<div class="modal-backdrop" transition:fade on:click={() => (showDeleteConfirm = false)}>
		<div class="modal delete-modal" transition:scale on:click|stopPropagation>
			<div class="modal-header delete">
				<h2>
					<span class="material-icons">warning</span>
					Confirm Delete
				</h2>
				<button class="close-modal" on:click={() => (showDeleteConfirm = false)}>
					<span class="material-icons">close</span>
				</button>
			</div>

			<div class="delete-content">
				<p>Are you sure you want to delete this cashout?</p>
				{#if selectedCashout}
					<div class="cashout-details">
						<p>Caller: {selectedCashout.username}</p>
						<p>Amount: ${selectedCashout.amount}</p>
						<p>Date: {new Date(selectedCashout.date_registered).toLocaleDateString()}</p>
					</div>
				{/if}
				<p class="warning">
					<span class="material-icons">info</span>
					This action cannot be undone.
				</p>
			</div>

			<div class="modal-actions">
				<button class="secondary" on:click={() => (showDeleteConfirm = false)}> Cancel </button>
				<button class="danger" on:click={deleteCashout}>
					<span class="material-icons">delete</span>
					Delete Cashout
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showStatusModal && selectedCashout}
	<div class="modal-backdrop" transition:fade on:click={() => (showStatusModal = false)}>
		<div class="modal status-modal" transition:scale on:click|stopPropagation>
			<div class="modal-header">
				<h2>
					<span class="material-icons">update</span>
					Update Status
				</h2>
				<button class="close-modal" on:click={() => (showStatusModal = false)}>
					<span class="material-icons">close</span>
				</button>
			</div>

			<div class="status-content">
				<div class="cashout-details">
					<p><span class="label">Caller:</span> {selectedCashout.username}</p>
					<p>
						<span class="label">Amount:</span> ${getCallerAmount(
							selectedCashout.amount,
							selectedCashout.percentage_cut
						).toLocaleString()}
					</p>
					<p>
						<span class="label">Current Status:</span>
						<span class="status-badge {selectedCashout.status.toLowerCase()}">
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
						</span>
					</p>
				</div>

				<div class="form-group">
					<label for="newStatus">New Status</label>
					<div class="status-options">
						<button
							class="status-option pending"
							class:active={selectedStatus === 'pending'}
							on:click={() => (selectedStatus = 'pending')}
							type="button"
						>
							<span class="material-icons">schedule</span>
							Pending
						</button>
						<button
							class="status-option completed"
							class:active={selectedStatus === 'completed'}
							on:click={() => (selectedStatus = 'completed')}
							type="button"
						>
							<span class="material-icons">check_circle</span>
							Completed
						</button>
						<button
							class="status-option rejected"
							class:active={selectedStatus === 'rejected'}
							on:click={() => (selectedStatus = 'rejected')}
							type="button"
						>
							<span class="material-icons">error</span>
							Rejected
						</button>
					</div>
				</div>
			</div>

			<div class="modal-actions">
				<button class="secondary" on:click={() => (showStatusModal = false)}> Cancel </button>
				<button
					class="primary"
					on:click={() => updateCashoutStatus(selectedCashout, selectedStatus)}
				>
					<span class="material-icons">save</span>
					Update Status
				</button>
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

	.actions {
		margin: 2em 0;
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
	}

	th {
		color: #888;
		font-weight: normal;
		border-bottom: 1px solid rgba(56, 35, 155, 0.3);
	}

	td {
		color: white;
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

	.delete-btn {
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

	.delete-btn:hover {
		background: rgba(155, 35, 35, 0.3);
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

	.modal-header {
		padding: 1.5em;
		border-bottom: 1px solid rgba(56, 35, 155, 0.3);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header.delete {
		background: rgba(155, 35, 35, 0.1);
	}

	.modal-header h2 {
		color: white;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.close-modal {
		background: none;
		border: none;
		color: #888;
		cursor: pointer;
		padding: 0.5em;
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.close-modal:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	form {
		padding: 2em;
	}

	.form-group {
		margin-bottom: 1.5em;
	}

	.form-group label {
		display: block;
		color: #888;
		margin-bottom: 0.5em;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.8em;
		background: rgba(56, 35, 155, 0.2);
		border: 1px solid #0f131d;
		color: white;
		border-radius: 0.5em;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: rgb(56, 35, 155);
		box-shadow: 0 0 0 2px rgba(56, 35, 155, 0.3);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1em;
		margin-top: 2em;
	}

	.modal-actions button {
		padding: 0.8em 1.5em;
		border-radius: 0.5em;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.primary {
		background: rgb(56, 35, 155);
		color: white;
		border: none;
	}

	.secondary {
		background: transparent;
		border: 1px solid #0f131d;
		color: #888;
	}

	.danger {
		background: rgb(155, 35, 35);
		color: white;
		border: none;
	}

	.primary:hover,
	.danger:hover {
		transform: translateY(-2px);
	}

	.primary:hover {
		background: rgb(66, 45, 165);
	}

	.secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.danger:hover {
		background: rgb(175, 45, 45);
	}

	.delete-content {
		padding: 1.5em;
		text-align: center;
	}

	.cashout-details {
		background: rgba(155, 35, 35, 0.1);
		padding: 1em;
		border-radius: 0.5em;
		margin: 1em 0;
	}

	.cashout-details p {
		margin: 0.5em 0;
		color: #f77f7f;
	}

	.warning {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		color: #f77f7f;
		font-size: 0.9em;
		margin-top: 1em;
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

	.action-buttons {
		display: flex;
		gap: 0.5em;
	}

	.status-btn {
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

	.status-btn.completed {
		background: rgba(35, 155, 56, 0.2);
		color: #7ff78f;
	}

	.status-btn.rejected {
		background: rgba(155, 35, 35, 0.2);
		color: #f77f7f;
	}

	.status-btn:hover {
		transform: translateY(-2px);
		filter: brightness(1.2);
	}

	.status-modal {
		width: 450px;
	}

	.status-content {
		padding: 1.5em;
	}

	.cashout-details {
		background: rgba(56, 35, 155, 0.1);
		padding: 1em;
		border-radius: 0.5em;
		margin-bottom: 1.5em;
	}

	.cashout-details p {
		margin: 0.5em 0;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.cashout-details .label {
		color: #888;
		min-width: 100px;
	}

	.status-options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5em;
		margin-top: 0.5em;
	}

	.status-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5em;
		padding: 1em;
		background: rgba(56, 35, 155, 0.1);
		border: 2px solid transparent;
		border-radius: 0.5em;
		color: #888;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.status-option:hover {
		transform: translateY(-2px);
	}

	.status-option.active {
		border-color: currentColor;
		background: rgba(56, 35, 155, 0.2);
	}

	.status-option.pending {
		color: #f7f77f;
	}

	.status-option.completed {
		color: #7ff78f;
	}

	.status-option.rejected {
		color: #f77f7f;
	}

	.amount-input,
	.percentage-input {
		position: relative;
		display: flex;
		align-items: center;
	}

	.currency-symbol,
	.percentage-symbol {
		position: absolute;
		color: #888;
		pointer-events: none;
	}

	.currency-symbol {
		left: 1em;
	}

	.percentage-symbol {
		right: 1em;
	}

	.amount-input input {
		padding-left: 2em;
	}

	.percentage-input input {
		padding-right: 2em;
	}

	.split-preview {
		background: rgba(56, 35, 155, 0.1);
		border-radius: 0.5em;
		padding: 1.5em;
		margin: 1.5em 0;
	}

	.split-preview h3 {
		margin: 0 0 1em 0;
		color: #888;
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-size: 0.9em;
		font-weight: normal;
	}

	.split-amounts {
		display: flex;
		flex-direction: column;
		gap: 0.8em;
	}

	.amount-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.8em;
		background: rgba(56, 35, 155, 0.1);
		border-radius: 0.3em;
	}

	.amount-info {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.amount-row .label {
		color: #888;
	}

	.amount-row .percentage {
		color: #666;
		font-size: 0.9em;
	}

	.amount-row .amount {
		font-family: monospace;
		font-size: 1.1em;
	}

	.amount-row.caller .amount {
		color: #7ff78f;
	}

	.amount-row.owner .amount {
		color: #7f7ff7;
	}

	.amount-row.total {
		border-top: 1px solid rgba(56, 35, 155, 0.2);
		margin-top: 0.5em;
		padding-top: 1em;
	}

	.amount-row.total .amount {
		color: white;
		font-weight: bold;
	}
</style>
