const request = require('supertest');
jest.mock('../db');
const app = require('../app');

/* attempt to write these tests using a mock client so no actual interaction with DB is required */

describe('get routes', function () {
	afterEach(() => {
		jest.clearAllMocks();
	});
	test('get route with id should use correct SQL query', async function () {
		let db = createMockDB();
		const req = await request(app).get('/jobs/q/search');
		console.log(req);
		expect(req.statusCode).toEqual(200);
		expect(db.query).toHaveBeenCalledWith(`SELECT id FROM jobs WHERE 1 = 1 ORDER BY title`);
	});
	test('get route with filter should use correct SQL query', async function () {
		let db = createMockDB();
		const req = await request(app).get('/jobs/q/search?minSalary=1000');
		expect(req.statusCode).toEqual(200);
		expect(db.query).toHaveBeenCalledWith(`SELECT salary, id FROM jobs WHERE salary >= 1000 ORDER BY title`);
	});
});

describe('post routes', function () {
	afterEach(() => {
		jest.clearAllMocks();
	});
	test('post route to create company should use correct SQL query', async function () {
		let db = createMockDB(false);
		db.query.mockResolvedValue({
			rows: []
		});
		const req = await request(app)
			.post('/jobs')
			.send({ title: 'anotherTitle', salary: 1000, equity: 0, company_handle: 'something' });
		expect(req.statusCode).toEqual(201);
		expect(db.query).toHaveBeenCalledTimes(2);
		expect(db.query.mock.calls[1][0]).toEqual(
			`INSERT INTO jobs (title, salary, equity, company_handle) VALUES ($1, $2, $3, $4) RETURNING title, salary, equity, company_handle AS "companyHandle"`
		);
	});
});

describe('test patch routes', function () {
	afterEach(() => {
		jest.clearAllMocks();
	});
	test('patch request to DB should use correct SQL', async function () {
		let db = createMockDB();
		const req = await request(app).patch('/jobs/1').send({ salary: 5000 });
		expect(req.statusCode).toEqual(200);
		expect(db.query).toHaveBeenCalledWith(
			`UPDATE jobs SET "salary"=$1 WHERE id = 1 RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
			[5000]
		);
	});
});

describe('test delete routes', function () {
	afterEach(() => {
		jest.clearAllMocks();
	});
	test('delete request to DB should use correct SQL', async function () {
		let db = createMockDB();
		const req = await request(app).delete('/jobs/1');
		expect(req.statusCode).toEqual(200);
		expect(db.query).toHaveBeenCalledWith(`DELETE FROM jobs WHERE id=$1 RETURNING id`, ['1']);
	});
});

function createMockDB(resolveValue = true) {
	let db = require('../db');
	if (resolveValue) {
		db.query.mockResolvedValueOnce({
			rows: [{ title: 'someTitle', salary: 1000, equity: 0, company_handle: 'something' }]
		});
	}
	return db;
}