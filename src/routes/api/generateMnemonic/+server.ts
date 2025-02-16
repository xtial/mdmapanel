import { json } from '@sveltejs/kit';
import * as bip39 from 'bip39';

export async function GET() {
	// Generate a mnemonic
	const mnemonic = bip39.generateMnemonic();

	// Return the mnemonic as JSON
	return json({ mnemonic });
}
