'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for companies. */

class Company {
	/** Create a company (from data), update db, return new company data.
	 *
	 * data should be { handle, name, description, numEmployees, logoUrl }
	 *
	 * Returns { handle, name, description, numEmployees, logoUrl }
	 *
	 * Throws BadRequestError if company already in database.
	 * */

	static async create({ handle, name, description, numEmployees, logoUrl }) {
		const duplicateCheck = await db.query(
			`SELECT handle
           FROM companies
           WHERE handle = $1`,
			[handle]
		);

		if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate company: ${handle}`);

		const result = await db.query(
			`INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
			[handle, name, description, numEmployees, logoUrl]
		);
		const company = result.rows[0];

		return company;
	}

	/** Find all companies.
	 *
	 * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
	 * */

	static async findAll(filterParams = []) {
		const filter = Object.keys(filterParams).length === 0 ? '' : Company.buildWhereClause(filterParams);
		let selectClause = filter.selectStatement || '';
		const whereClause = filter.whereStatement || '1 = 1';
		if (selectClause.includes(',')) selectClause += ',';
		const companiesRes = await db.query(
			`SELECT handle,
                  ${selectClause}
                  description,
                  logo_url AS "logoUrl"
           FROM companies
		   WHERE
           ${whereClause}
           ORDER BY name`
		);
		return companiesRes.rows;
	}

	/** Given a company handle, return data about company.
	 *
	 * Returns { handle, name, description, numEmployees, logoUrl, jobs }
	 *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
	 *
	 * Throws NotFoundError if not found.
	 **/

	static async get(handle) {
		const companyRes = await db.query(
			`SELECT DISTINCT c.handle, j.title AS "jobTitle", j.id AS "jobId", c.name, c.description, c.num_employees AS "numEmployees", c.logo_url AS "logoUrl" FROM companies c LEFT JOIN jobs j ON j.company_handle=c.handle WHERE handle = $1`,
			[handle]
		);

		const company = companyRes.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);
		const jobs = companyRes.rows.filter(val => [val.jobId, val.jobTitle]);
		let uniqueJobs = [...new Set(jobs)];
		const filteredCompanies = {
			handle: companyRes.rows[0].handle,
			name: companyRes.rows[0].name,
			description: companyRes.rows[0].description,
			logoUrl: companyRes.rows[0].logoUrl,
			numEmployees: companyRes.rows[0].numEmployees
		};
		return {
			company: filteredCompanies,
			positions: uniqueJobs
		};
	}

	/** Update company data with `data`.
	 *
	 * This is a "partial update" --- it's fine if data doesn't contain all the
	 * fields; this only changes provided ones.
	 *
	 * Data can include: {name, description, numEmployees, logoUrl}
	 *
	 * Returns {handle, name, description, numEmployees, logoUrl}
	 *
	 * Throws NotFoundError if not found.
	 */

	static async update(handle, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			numEmployees: 'num_employees',
			logoUrl: 'logo_url'
		});
		const handleVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
		const result = await db.query(querySql, [...values, handle]);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	/** Delete given company from database; returns undefined
	 *
	 * Throws NotFoundError if company not found.
	 **/

	static async remove(handle) {
		const result = await db.query(
			`DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
			[handle]
		);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);
	}

	static buildWhereClause(filterParams) {
		//takes in an object with optional query string parameters, and returns a dynamic WHERE clause to add to SQL query
		const { name = null, minEmployees = null, maxEmployees = null } = filterParams;
		const clauses = {
			name: `name ILIKE '%${name}%'`,
			minEmployees: `num_employees >= ${minEmployees}`,
			maxEmployees: `num_employees <= ${maxEmployees}`
		};
		const returnArray = Object.entries(filterParams)
			.filter(([key, val]) => val != null)
			.map(([key, val]) => clauses[key]);
		const selectStatement = Object.entries(filterParams)
			.filter(([key, val]) => val !== null)
			.map(([key, val]) => (['minEmployees', 'maxEmployees'].includes(key) ? 'num_employees' : key));
		return { selectStatement: selectStatement.join(' , '), whereStatement: returnArray.join(' AND ') };
	}
}

module.exports = Company;