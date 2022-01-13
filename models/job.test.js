const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

db.connect();

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe('create', function () {
	test('should create company successfully', async function () {
		const res = await Job.create({ title: 'shitmuncher', salary: 50000, equity: 0, company_handle: 'c1' });
		expect(res).toEqual;
	});
	test('should fail with duplicate job', async function () {
		try {
			await Job.create({
				title: 'king of the peasants',
				salary: '100000',
				equity: '1',
				company_handle: 'c2'
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError);
		}
	});
});

describe('find all', function () {
	test('should return all jobs by default', async function () {
		const res = await Job.findAll();
		expect(res).toEqual([
			{
				id: expect.any(Number)
			}
		]);
	});
});

describe('update', function () {
	test('should update successfully', async function () {
		const id = await db.query(`SELECT id FROM jobs WHERE company_handle = 'c2' AND title='king of the peasants'`);
		const res = await Job.update(id.rows[0].id, { title: 'emperor of the peasants' });
	});
});