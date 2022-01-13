'use strict';

const request = require('supertest');
const db = require('../db.js');

const app = require('../app');
const User = require('../models/user');

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u4Token
} = require('./_testCommon');
console.log('current env is ' + process.env.NODE_ENV);
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe('POST /users', function () {
	test('works for users: create non-admin', async function () {
		const resp = await request(app)
			.post('/users')
			.send({
				username: 'u-new',
				firstName: 'First-new',
				lastName: 'Last-newL',
				password: 'password-new',
				email: 'new@email.com',
				isAdmin: false
			})
			.set('authorization', `Bearer ${u4Token}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			user: {
				username: 'u-new',
				firstName: 'First-new',
				lastName: 'Last-newL',
				email: 'new@email.com',
				isAdmin: false
			},
			token: expect.any(String)
		});
	});

	test('works for users: create admin', async function () {
		const resp = await request(app)
			.post('/users')
			.send({
				username: 'u-new',
				firstName: 'First-new',
				lastName: 'Last-newL',
				password: 'password-new',
				email: 'new@email.com',
				isAdmin: true
			})
			.set('authorization', `Bearer ${u4Token}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			user: {
				username: 'u-new',
				firstName: 'First-new',
				lastName: 'Last-newL',
				email: 'new@email.com',
				isAdmin: true
			},
			token: expect.any(String)
		});
	});

	test('unauth for anon', async function () {
		const resp = await request(app).post('/users').send({
			username: 'u-new',
			firstName: 'First-new',
			lastName: 'Last-newL',
			password: 'password-new',
			email: 'new@email.com',
			isAdmin: true
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request if missing data', async function () {
		const resp = await request(app)
			.post('/users')
			.send({
				username: 'u-new'
			})
			.set('authorization', `Bearer ${u4Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request if invalid data', async function () {
		const resp = await request(app)
			.post('/users')
			.send({
				username: 'u-new',
				firstName: 'First-new',
				lastName: 'Last-newL',
				password: 'password-new',
				email: 'not-an-email',
				isAdmin: true
			})
			.set('authorization', `Bearer ${u4Token}`);
		expect(resp.statusCode).toEqual(400);
	});
	test('applying for jobs works', async function () {
		const jobId = await db.query(`SELECT id FROM jobs LIMIT 1`);
		const resp = await request(app).post(`/users/u1/jobs/${jobId.rows[0].id}`);
		expect(resp.body).toEqual({ appliedFor: expect.any(Number) });
	});
});

/************************************** GET /users */

describe('GET /users', function () {
	test('works for users', async function () {
		const resp = await request(app).get('/users').set('authorization', `Bearer ${u4Token}`);
		expect(resp.body).toEqual({
			users: [
				{
					username: 'u1',
					firstName: 'U1F',
					lastName: 'U1L',
					email: 'user1@user.com',
					isAdmin: false
				},
				{
					username: 'u2',
					firstName: 'U2F',
					lastName: 'U2L',
					email: 'user2@user.com',
					isAdmin: false
				},
				{
					username: 'u3',
					firstName: 'U3F',
					lastName: 'U3L',
					email: 'user3@user.com',
					isAdmin: false
				},
				{ email: 'user4@user.com', firstName: 'U4F', isAdmin: true, lastName: 'U4L', username: 'u4' }
			]
		});
	});

	test('unauth for anon', async function () {
		const resp = await request(app).get('/users');
		expect(resp.statusCode).toEqual(401);
	});

	test('fails: test next() handler', async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query('DROP TABLE users CASCADE');
		const resp = await request(app).get('/users').set('authorization', `Bearer ${u4Token}`);
		expect(resp.statusCode).toEqual(500);
	});
});

/************************************** GET /users/:username */

describe('GET /users/:username', function () {
	test('works for users', async function () {
		const resp = await request(app).get(`/users/u1`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			user: {
				username: 'u1',
				firstName: 'U1F',
				lastName: 'U1L',
				email: 'user1@user.com',
				isAdmin: false
			}
		});
	});

	test('unauth for anon', async function () {
		const resp = await request(app).get(`/users/u1`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found if user not found', async function () {
		const resp = await request(app).get(`/users/nope`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /users/:username */

describe('PATCH /users/:username', () => {
	test('works for users', async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: 'New'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			user: {
				username: 'u1',
				firstName: 'New',
				lastName: 'U1L',
				email: 'user1@user.com',
				isAdmin: false
			}
		});
	});

	test('unauth for anon', async function () {
		const resp = await request(app).patch(`/users/u1`).send({
			firstName: 'New'
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('not found if no such user', async function () {
		const resp = await request(app)
			.patch(`/users/nope`)
			.send({
				firstName: 'Nope'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});

	test('bad request if invalid data', async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: 42
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('works: set new password', async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				password: 'new-password'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			user: {
				username: 'u1',
				firstName: 'U1F',
				lastName: 'U1L',
				email: 'user1@user.com',
				isAdmin: false
			}
		});
		const isSuccessful = await User.authenticate('u1', 'new-password');
		expect(isSuccessful).toBeTruthy();
	});

	test('works: apply for job', async function () {
		const resp = await app.post('/users/u1/jobs/1', async function (req, res, next) {
			expect(resp.body).toEqual({
				appliedFor: 1
			});
		});
	});
});

/************************************** DELETE /users/:username */

describe('DELETE /users/:username', function () {
	test('works for users', async function () {
		const resp = await request(app).delete(`/users/u1`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.body).toEqual({ deleted: 'u1' });
	});

	test('unauth for anon', async function () {
		const resp = await request(app).delete(`/users/u1`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found if user missing', async function () {
		const resp = await request(app).delete(`/users/nope`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});