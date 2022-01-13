'use strict';
/** Database setup for jobly. */
const { Client } = require('pg');
const { getDatabaseUri } = require('./config');
require('dotenv').config();

let db;

if (process.env.NODE_ENV === 'production') {
	db = new Client({
		connectionString: getDatabaseUri(),
		ssl: {
			rejectUnauthorized: false
		}
	});
} else {
	db = new Client({
		connectionString: getDatabaseUri()
	});
}

module.exports = db;