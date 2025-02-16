<script lang="ts">
	// STYLE IMPORTS
	import '$lib/components/titleAnimation.sass';
	import '$lib/components/loginBackground.css';

	import { goto } from '$app/navigation';

	import bootstrap from '$lib/images/bootstrap.svg';
	import Narc from '$lib/images/narc.png';

	let userName = $state('');
	let passWord = $state('');

	let invalidCredentials = ['yea', 'yea'];

	let invalidLoginBool = $state(false);
	let currentErrorMessage = $state('');
	let errorMessages = [
		'Nope, not quite. Try again, champ!',
		'Uh-oh! Your username and password don’t get along.',
		'Whoops! That didn’t work. Did you forget your password?',
		'Looks like your login went on vacation. Try again!'
	];
	let errorMsgIndex = 0;

	async function handleLogin(event: SubmitEvent) {
		event.preventDefault();
		console.log('USER: ' + userName);
		console.log('PASS: ' + passWord);

		const response = await fetch('/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userName, passWord })
		});

		if (response.ok) {
			const { token } = await response.json();
			localStorage.setItem('authToken', token);
			goto('/dashboard');
		} else {
			const { error } = await response.json();

			if (errorMsgIndex > errorMessages.length - 1) {
				errorMsgIndex = 0;
				currentErrorMessage = errorMessages[errorMessages.length - 1];
			}

			currentErrorMessage = errorMessages[errorMsgIndex];
			errorMsgIndex++;

			invalidCredentials = [userName, passWord];
		}
	}

	$effect(() => {
		if (userName) {
			if (!invalidCredentials.includes(userName)) {
				console.log('sigma');
				if (currentErrorMessage !== '') {
					currentErrorMessage = '';
				}
			}
		}
		if (passWord) {
			if (!invalidCredentials.includes(passWord)) {
				if (currentErrorMessage !== '') {
					currentErrorMessage = '';
				}
			}
		}
	});
</script>

<div class="contentbox">
	<div class="el"></div>
	<div class="loginbox">
		<div class="titleBox">
			<h2>Welcome To</h2>
			<div class="logo">
				<img src={bootstrap} height="40px" width="40px" />
				<h1 class="white">Eulen.</h1>
			</div>
		</div>
		<div class="loginform">
			<form on:submit={handleLogin}>
				<label>Username</label>
				<input bind:value={userName} placeholder="Your Username" type="text" />
				<label>Password</label>
				<input bind:value={passWord} placeholder="Your Password" type="password" />
				{#if currentErrorMessage !== ''}
					<p class="redText">{currentErrorMessage}</p>
				{/if}
				<button type="submit">Login</button>
			</form>
		</div>
		<p>Panel Version: <span class="darkText">1.0.1</span></p>
	</div>
</div>

<style>
	.logo {
		display: flex;
		flex-direction: row;
		gap: 0.5em;
		margin-top: 0.5em;
		margin-bottom: 2em;
	}

	.contentbox {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
		width: 100%;
	}

	.loginbox {
		position: fixed;
		width: 20em;
		padding: 4em;
		border: 3px solid #1c1d20;
		background-color: #111214;
		color: white;
		border-radius: 1em;
	}

	.loginbox label {
		color: rgb(106, 106, 106);
	}

	.loginbox button {
		margin-bottom: 1em;
	}

	.loginbox p {
		margin-top: 0.5em;
		color: rgb(106, 106, 106);
	}

	.loginbox .redText {
		color: rgb(255, 94, 94);
	}

	.loginform form {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.loginform button {
		margin-top: 1em;
	}

	.titleBox {
		margin-bottom: 1em;
	}
</style>
