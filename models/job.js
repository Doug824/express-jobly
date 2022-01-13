const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

class Job {
	/* 
    add, update, or delete a job to/from DB based on data passed in
    */

	static async create({ title, salary, equity, company_handle }) {
		const duplicateCheck = await db.query(`SELECT id FROM jobs WHERE title=$1 AND company_handle=$2`, [
			title,
			company_handle
		]);
		if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate job: ${title} for ${company_handle}`);

		const result = await db.query(
			`INSERT INTO jobs (title, salary, equity, company_handle) VALUES ($1, $2, $3, $4) RETURNING title, salary, equity, company_handle AS "companyHandle"`,
			[title, salary, equity, company_handle]
		);
		const job = result.rows[0];
		return job;
	}

	//find all jobs - accepts optional filter parameters as query string

	static async findAll(filterParams = []) {
		const filter = Object.keys(filterParams).length === 0 ? '' : Job.buildWhereClause(filterParams);
		let selectClause = filter.selectStatement || '';
		const whereClause = filter.whereStatement || '1 = 1';
		if (selectClause != '') selectClause += ', ';
		const jobsRes = await db.query(`SELECT ${selectClause}id FROM jobs WHERE ${whereClause} ORDER BY title`);
		return jobsRes.rows;
	}

	static async get(id) {
		const job = await db.query(`SELECT title, salary, equity, company_handle FROM jobs WHERE id = $1`, [id]);
		if (!job.rows[0]) throw new NotFoundError(`No job found with id ${id}`);
		return job.rows[0];
	}

	//used for patch requests that may not contain all rows in an update
	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			title: 'title',
			salary: 'salary',
			equity: 'equity'
		});
		const querySql = `UPDATE jobs SET ${setCols} WHERE id = ${id} RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
		const result = await db.query(querySql, [...values]);

		const job = result.rows[0];
		if (!job) throw new NotFoundError(`No job found for id ${id}`);
		return job;
	}

	/** Delete given company from database; returns undefined
	 *
	 * Throws NotFoundError if company not found.
	 **/

	static async remove(id) {
		const result = await db.query(`DELETE FROM jobs WHERE id=$1 RETURNING id`, [id]);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job found for id ${id}`);
	}

	static buildWhereClause(filterParams) {
		//takes in an object with optional query string parameters, and returns a dynamic WHERE clause to add to SQL query
		const { title = null, minSalary = null, maxSalary = null } = filterParams;
		const clauses = {
			title: `title ILIKE '%${title}%'`,
			minSalary: `salary >= ${minSalary}`,
			maxSalary: `salary <= ${maxSalary}`
		};
		const returnArray = Object.entries(filterParams)
			.filter(([key, val]) => val != null)
			.map(([key, val]) => clauses[key]);
		const selectStatement = Object.entries(filterParams)
			.filter(([key, val]) => val !== null)
			.map(([key, val]) => (['minSalary', 'maxSalary'].includes(key) ? 'salary' : key));
		return { selectStatement: selectStatement.join(' , '), whereStatement: returnArray.join(' AND ') };
	}
}

// CREATE TABLE jobs (
//     id SERIAL PRIMARY KEY,
//     title TEXT NOT NULL,
//     salary INTEGER CHECK (salary >= 0),
//     equity NUMERIC CHECK (equity <= 1.0),
//     company_handle VARCHAR(25) NOT NULL
//       REFERENCES companies ON DELETE CASCADE
//   );

module.exports = Job;