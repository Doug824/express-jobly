const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');

const jsToSqlUsers = {
	firstName: 'first_name',
	lastName: 'last_name',
	isAdmin: 'is_admin'
};

describe('test helper function for partial updates to a SQL row', function () {
	test('should require at least one key/value pair', async function () {
		try {
			sqlForPartialUpdate({}, jsToSqlUsers);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
	test('valid request should return appropriate SQL query and list of values', async function () {
		const res = sqlForPartialUpdate({ isAdmin: 'true', firstName: 'ted' }, jsToSqlUsers);
		expect(res).toEqual({
			setCols: `"is_admin"=$1, "first_name"=$2`,
			values: ['true', 'ted']
		});
	});
});