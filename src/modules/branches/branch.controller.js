const Joi = require('joi');
const { createBranch, listBranches } = require('./branch.service');

const createSchema = Joi.object({
  name: Joi.string().min(2).required(),
  countryId: Joi.string().min(2).optional(),
  location: Joi.string().allow('', null),
});

async function createBranchController(req, res) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(422).json({
        error: error.details.map(d => ({
          field: d.context.key,
          message: d.message,
        })),
      });
    }

    const out = await createBranch({
      brandId: req.tenant.brandId,
      creatorUserId: req.user.id, // auto-link creator to branch
      ...value,
    });

    res.status(201).json({ data: out });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function listBranchesController(req, res) {
  try {
    const data = await listBranches({ brandId: req.tenant.brandId });
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { createBranchController, listBranchesController };
