<script lang="ts">
	export let username;
	export let guild;
	import { onMount } from 'svelte';
	import axios from 'axios';
	import md5 from 'md5';

	let qrCodeUrl: string | null = null;
	const uid = '11111'; // Replace with your user ID
	const uname = 'user name'; // Replace with your user name
	const salt = 'your_salt'; // Replace with your salt
	const developerToken = '7GQMN33bxTiEg6XNaXP7MapOobN9M6VjfjUYsUW-zzjLxQ_Il59JtPH3NmXwHFN9'; // Replace with your Lovense developer token

	onMount(async () => {
		try {
			const utoken = md5(uid + salt);
			const response = await axios.post('https://api.lovense-api.com/api/lan/getQrCode', {
				token: developerToken,
				uid: uid,
				uname: uname,
				utoken: utoken,
				v: 2
			});

			if (response.data && response.data.result && response.data.data.qr) {
				qrCodeUrl = response.data.data.qr;
			} else {
				console.error('QR code not found in response:', response.data);
			}
		} catch (error) {
			console.error('Error generating QR code:', error);
		}
	});
</script>

<div class="account">
	<div class="intro">
		<p>You are able to manage your account here.</p>
		<h1 class="white">My Account</h1>
	</div>
	<div class="holder">
		<div class="container">
			<h2 class="white">Account Details</h2>
			<p>Your account details are displayed here.</p>
			<div class="details">
				<div class="element">
					<p>Username</p>
					<h3 class="white">{username}</h3>
				</div>
				<div class="element">
					<p>Belongs to guild</p>
					<h3 class="white">{guild}</h3>
				</div>
				<div class="element">
					<p>Rank</p>
					<h3 class="white">Caller</h3>
				</div>
			</div>
		</div>
		<div class="container">
			<h2 class="white">Change your password</h2>
			<p>Change the password of your account here.</p>
			<label>Current Password</label>
			<input type="password" />
			<label>New Password</label>
			<input type="password" />
			<button>Change Password</button>
		</div>
		<div class="container">
			<h2 class="white">Connect Lovense</h2>
			<p>Connect any Lovense toy of your choice here.</p>
			<p>Scan the QR code to proceed.</p>
			<div class="qr-code">
				{#if qrCodeUrl}
					<img src={qrCodeUrl} alt="QR Code" />
				{:else}
					<p>Loading QR Code...</p>
				{/if}
			</div>
			<button>Test Vibration</button>
		</div>
	</div>
</div>

<style>
	.holder {
		display: flex;
		gap: 1em;
	}

	.details .element {
		border-bottom: 1px solid #0f131d;
		padding: 1em;
	}

	.intro {
		padding-bottom: 1em;
		border-bottom: 1px solid #0f131d;
		margin-bottom: 2em;
	}

	.container {
		display: flex;
		flex-direction: column;
		padding: 1em;
		border-radius: 1em;
		margin-top: 1em;
		gap: 1em;

		border: 1px solid #0f131d;
		background: rgb(56, 35, 155);
		background: linear-gradient(45deg, rgba(56, 35, 155, 0.2) 0%, #0e0d15 60%);
	}
</style>
