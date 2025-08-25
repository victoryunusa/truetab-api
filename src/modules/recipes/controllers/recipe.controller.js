const recipeService = require("../services/recipe.service");
const {
  createRecipeSchema,
  updateRecipeSchema,
  duplicateRecipeSchema,
} = require("../validators/recipe.schema");

async function list(req, res) {
  try {
    const { itemId, variantId, isActive } = req.query;
    
    const data = await recipeService.list({
      brandId: req.tenant.brandId,
      itemId,
      variantId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    });
    
    res.json({ data });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Server error" });
  }
}

async function create(req, res) {
  try {
    const { value, error } = createRecipeSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const data = await recipeService.create({
      brandId: req.tenant.brandId,
      ...value,
    });

    res.status(201).json({ data });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Server error" });
  }
}

async function get(req, res) {
  try {
    const data = await recipeService.get(req.params.id, {
      brandId: req.tenant.brandId,
    });
    
    res.json({ data });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Server error" });
  }
}

async function update(req, res) {
  try {
    const { value, error } = updateRecipeSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const data = await recipeService.update(req.params.id, {
      brandId: req.tenant.brandId,
      ...value,
    });

    res.json({ data });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Server error" });
  }
}

async function remove(req, res) {
  try {
    await recipeService.remove(req.params.id, {
      brandId: req.tenant.brandId,
    });
    
    res.status(204).send();
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Server error" });
  }
}

async function duplicate(req, res) {
  try {
    const { value, error } = duplicateRecipeSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const data = await recipeService.duplicate(req.params.id, {
      brandId: req.tenant.brandId,
      ...value,
    });

    res.status(201).json({ data });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Server error" });
  }
}

async function calculateCost(req, res) {
  try {
    const data = await recipeService.calculateCost(req.params.id, {
      brandId: req.tenant.brandId,
    });
    
    res.json({ data });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Server error" });
  }
}

module.exports = {
  list,
  create,
  get,
  update,
  remove,
  duplicate,
  calculateCost,
};
