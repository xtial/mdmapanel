<script lang="ts">
	export let guild: string;
	import { onMount } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';

	interface User {
		username: string;
		userid: string;
		password: string;
		rank: string;
		guild: string;
		starting_page: string;
	}

	let users: User[] = [];
	let loading = true;
	let error: string | null = null;
	let showAddModal = false;
	let showEditModal = false;
	let showDeleteConfirm = false;
	let searchTerm = '';
	let selectedUser: User | null = null;

	let newUser = {
		username: '',
		userid: '',
		password: '',
		rank: 'member',
		starting_page: 'account_review'
	};

	$: filteredUsers = users.filter(
		(user) =>
			user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.userid.toLowerCase().includes(searchTerm.toLowerCase())
	);

	async function fetchUsers() {
		try {
			const response = await fetch('/api/guild/getGuildCallers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ guild })
			});

			const data = await response.json();
			if (data.success) {
				users = data.users;
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Failed to fetch users';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function initiateDelete(user: User) {
		selectedUser = user;
		showDeleteConfirm = true;
	}

	function initiateEdit(user: User) {
		selectedUser = { ...user };
		showEditModal = true;
	}

	async function removeUser() {
		if (!selectedUser) return;

		try {
			const response = await fetch('/api/guild/removeCaller', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					guild,
					username: selectedUser.username
				})
			});

			const data = await response.json();
			if (data.success) {
				users = users.filter((user) => user.username !== selectedUser?.username);
				showDeleteConfirm = false;
				selectedUser = null;
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Failed to remove user';
			console.error(err);
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		try {
			const response = await fetch('/api/guild/addCaller', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...newUser, guild })
			});

			const data = await response.json();
			if (data.success) {
				users = [...users, data.user];
				showAddModal = false;
				newUser = {
					username: '',
					userid: '',
					password: '',
					rank: 'member',
					starting_page: 'account_review'
				};
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Failed to add user';
			console.error(err);
		}
	}

	async function handleEdit(event: Event) {
		event.preventDefault();
		if (!selectedUser) return;

		try {
			const response = await fetch('/api/guild/updateCaller', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...selectedUser, guild })
			});

			const data = await response.json();
			if (data.success) {
				users = users.map((user) => (user.username === selectedUser?.username ? data.user : user));
				showEditModal = false;
				selectedUser = null;
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Failed to update user';
			console.error(err);
		}
	}

	onMount(fetchUsers);
</script>

<div class="callers-container">
	<div class="intro">
		<div class="header-content">
			<div class="title-section">
				<h1>Users</h1>
				<p>Manage your active users</p>
			</div>
			<div class="search-box">
				<span class="material-icons search-icon">search</span>
				<input type="text" bind:value={searchTerm} placeholder="Search users..." />
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
		<button class="add-button" on:click={() => (showAddModal = true)}>
			<span class="material-icons">person_add</span>
			Add User
		</button>
	</div>

	{#if loading}
		<div class="loading">
			<div class="loader"></div>
			<span>Loading users...</span>
		</div>
	{:else}
		<div class="users-list" transition:fade>
			<table>
				<thead>
					<tr>
						<th>Username</th>
						<th>User ID</th>
						<th>Rank</th>
						<th>Starting Page</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredUsers as user}
						<tr transition:slide>
							<td>{user.username}</td>
							<td>{user.userid}</td>
							<td>
								<span class="rank-badge {user.rank}">
									<span class="material-icons">
										{user.rank === 'admin' ? 'admin_panel_settings' : 'person'}
									</span>
									{user.rank}
								</span>
							</td>
							<td>{user.starting_page}</td>
							<td>
								<div class="action-buttons">
									<button class="icon-button edit" on:click={() => initiateEdit(user)}>
										<span class="material-icons">edit</span>
										Edit
									</button>
									<button class="icon-button delete" on:click={() => initiateDelete(user)}>
										<span class="material-icons">delete</span>
										Remove
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

<!-- Add User Modal -->
{#if showAddModal}
	<div class="modal-backdrop" transition:fade on:click={() => (showAddModal = false)}>
		<div class="modal" transition:scale on:click|stopPropagation>
			<div class="modal-header">
				<h2>
					<span class="material-icons">person_add</span>
					Add New User
				</h2>
				<button class="close-modal" on:click={() => (showAddModal = false)}>
					<span class="material-icons">close</span>
				</button>
			</div>
			<form on:submit={handleSubmit}>
				<div class="form-group">
					<label for="username">Username</label>
					<input type="text" id="username" bind:value={newUser.username} required />
				</div>
				<div class="form-group">
					<label for="userid">User ID</label>
					<input type="text" id="userid" bind:value={newUser.userid} required />
				</div>
				<div class="form-group">
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						bind:value={newUser.password}
						required
						placeholder="Enter password"
					/>
				</div>
				<div class="form-group">
					<label for="rank">Rank</label>
					<select id="rank" bind:value={newUser.rank}>
						<option value="admin">Admin</option>
						<option value="member">Member</option>
					</select>
				</div>
				<div class="form-group">
					<label for="starting_page">Starting Page</label>
					<input type="text" id="starting_page" bind:value={newUser.starting_page} required />
				</div>
				<div class="modal-actions">
					<button type="button" class="secondary" on:click={() => (showAddModal = false)}>
						Cancel
					</button>
					<button type="submit" class="primary">
						<span class="material-icons">add_circle</span>
						Add User
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit User Modal -->
{#if showEditModal && selectedUser}
	<div class="modal-backdrop" transition:fade on:click={() => (showEditModal = false)}>
		<div class="modal" transition:scale on:click|stopPropagation>
			<div class="modal-header">
				<h2>
					<span class="material-icons">edit</span>
					Edit User
				</h2>
				<button class="close-modal" on:click={() => (showEditModal = false)}>
					<span class="material-icons">close</span>
				</button>
			</div>
			<form on:submit={handleEdit}>
				<div class="form-group">
					<label for="edit-username">Username</label>
					<input type="text" id="edit-username" bind:value={selectedUser.username} required />
				</div>
				<div class="form-group">
					<label for="edit-userid">User ID</label>
					<input type="text" id="edit-userid" bind:value={selectedUser.userid} required />
				</div>
				<div class="form-group">
					<label for="edit-password">Password</label>
					<input
						type="password"
						id="edit-password"
						bind:value={selectedUser.password}
						placeholder="Leave empty to keep current password"
					/>
				</div>
				<div class="form-group">
					<label for="edit-rank">Rank</label>
					<select id="edit-rank" bind:value={selectedUser.rank}>
						<option value="admin">Admin</option>
						<option value="member">Member</option>
					</select>
				</div>
				<div class="form-group">
					<label for="edit-starting_page">Starting Page</label>
					<input
						type="text"
						id="edit-starting_page"
						bind:value={selectedUser.starting_page}
						required
					/>
				</div>
				<div class="modal-actions">
					<button type="button" class="secondary" on:click={() => (showEditModal = false)}>
						Cancel
					</button>
					<button type="submit" class="primary">
						<span class="material-icons">save</span>
						Save Changes
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && selectedUser}
	<div class="modal-backdrop" transition:fade on:click={() => (showDeleteConfirm = false)}>
		<div class="modal delete-modal" transition:scale on:click|stopPropagation>
			<div class="modal-header delete">
				<h2>
					<span class="material-icons">warning</span>
					Confirm Deletion
				</h2>
			</div>
			<div class="delete-content">
				<p>Are you sure you want to remove user <strong>{selectedUser.username}</strong>?</p>
				<p class="warning">This action cannot be undone.</p>
			</div>
			<div class="modal-actions">
				<button class="secondary" on:click={() => (showDeleteConfirm = false)}> Cancel </button>
				<button class="danger" on:click={removeUser}>
					<span class="material-icons">delete_forever</span>
					Delete User
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.callers-container {
		padding: 2em;
		max-width: 1400px;
		margin: 0 auto;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2em;
	}

	.title-section h1 {
		font-size: 2em;
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

	.add-button {
		display: flex;
		align-items: center;
		gap: 0.5em;
		background: rgb(56, 35, 155);
		color: white;
		border: none;
		padding: 0.8em 1.5em;
		border-radius: 0.5em;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 1em;
	}

	.add-button:hover {
		background: rgb(66, 45, 165);
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(56, 35, 155, 0.3);
	}

	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
		border-radius: 1em;
		overflow: hidden;
		border: 1px solid rgba(56, 35, 155, 0.3);
	}

	th {
		text-align: left;
		padding: 1.2em;
		background: rgba(15, 19, 29, 0.5);
		color: #888;
		font-weight: normal;
		border-bottom: 1px solid rgba(56, 35, 155, 0.2);
	}

	td {
		padding: 1.2em;
		color: white;
		border-bottom: 1px solid rgba(56, 35, 155, 0.1);
	}

	tr:hover td {
		background: rgba(56, 35, 155, 0.1);
	}

	.rank-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 1em;
		border-radius: 2em;
		font-size: 0.9em;
		text-transform: capitalize;
	}

	.rank-badge.admin {
		background: rgba(56, 35, 155, 0.3);
		color: #8f7ff7;
	}

	.rank-badge.member {
		background: rgba(35, 155, 56, 0.3);
		color: #7ff78f;
	}

	.rank-badge .material-icons {
		font-size: 1.2em;
	}

	.action-buttons {
		display: flex;
		gap: 0.5em;
	}

	.icon-button {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 1em;
		border: none;
		border-radius: 0.5em;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.9em;
	}

	.icon-button.edit {
		background: rgba(56, 35, 155, 0.3);
		color: #8f7ff7;
	}

	.icon-button.delete {
		background: rgba(155, 35, 35, 0.3);
		color: #f77f7f;
	}

	.icon-button:hover {
		transform: translateY(-2px);
		filter: brightness(1.2);
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
		font-size: 1.5em;
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

	.delete-content {
		padding: 1.5em;
		text-align: center;
	}

	.delete-content p {
		color: white;
		margin: 0 0 1em 0;
	}

	.delete-content .warning {
		color: #f77f7f;
		font-size: 0.9em;
	}

	.modal-actions {
		padding: 1.5em;
		display: flex;
		justify-content: flex-end;
		gap: 1em;
		border-top: 1px solid rgba(56, 35, 155, 0.3);
	}

	.modal-actions button {
		padding: 0.8em 1.5em;
		border-radius: 0.5em;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-size: 1em;
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
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
	}

	.secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
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

	.actions {
		margin: 2em 0;
	}
</style>
