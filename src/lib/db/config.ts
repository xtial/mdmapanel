import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'mdmapanel',
	password: 'postgres',
	port: 5432
});
