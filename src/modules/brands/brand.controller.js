const Joi = require("joi");
const { createBrand, listBrands } = require("./brand.service");

const createSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().min(2).required(),
  url: Joi.string().min(2).required(),
  countryId: Joi.string().min(2).required(),
  ownerId: Joi.string().optional(), // SuperAdmin can set explicit owner
});

async function createBrandController(req, res) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const ownerId = value.ownerId || req.user.id;
    const out = await createBrand({ ...value, ownerId });
    res.status(201).json({ data: out });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function listBrandsController(req, res) {
  try {
    const data = await listBrands({ user: req.user });
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { createBrandController, listBrandsController };
