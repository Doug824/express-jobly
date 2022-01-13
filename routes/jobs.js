const jsonschema = require('jsonschema');
const express = require('express');
const { ensureLoggedIn, adminOnly } = require('../middleware/auth');
const Job = require('../models/job');
const { BadRequestError } = require('../expressError');

const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobUpdate.json');

const router = new express.Router();

//get all jobs in database (optionally can pass in filters in query string)
router.get('/q/search', async function (req, res, next) {
	try {
		const jobs = await Job.findAll(req.query);
		return res.json({ jobs });
	} catch (err) {
		return next(err);
	}
});

router.get('/:id', async function (req, res, next) {
	try {
		const job = await Job.get(id);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

router.post('/', async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, jobNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}
		const job = await Job.create(req.body);
		return res.status(201).json({ job });
	} catch (err) {
		return next(err);
	}
});

router.patch('/:id', async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, jobUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}
		const job = await Job.update(req.params.id, req.body);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

router.delete('/:id', async function (req, res, next) {
	try {
		await Job.remove(req.params.id);
		return res.json({ deleted: req.params.id });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;