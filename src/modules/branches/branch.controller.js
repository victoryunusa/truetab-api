const Joi = require("joi");
const { createBranch, listBranches } = require("./branch.service");

const createSchema = Joi.object({
  name: Joi.string().min(2).required(),
  brandId: Joi.string().min(2).required(),
  countryId: Joi.string().min(2).required(),
  location: Joi.string().allow("", null),
});

async function createBranchController(req, res) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const out = await createBranch({ brandId: req.tenant.brandId, ...value });
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
