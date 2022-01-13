const { BadRequestError } = require('../expressError');

// THIS NEEDS SOME GREAT DOCUMENTATION.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	//dataToUpdate takes an object, and jsToSql takes an object where keys are JS version of the column and values are the SQL version, i.e. 'firstName': 'first_name'
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError('No data');

	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`);

	//return an an object with two values - setCols is used for the SQL query, and values is for the corresponding values in the prepared statement
	return {
		setCols: cols.join(', '),
		values: Object.values(dataToUpdate)
	};
}

module.exports = { sqlForPartialUpdate };
