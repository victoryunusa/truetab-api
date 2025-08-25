const recipeItemService = require("../services/recipe-item.service");
const {
  createRecipeItemSchema,
  updateRecipeItemSchema,
  batchUpdateRecipeItemsSchema,
} = require("../validators/recipe.schema");

async function list(req, res) {
  try {
    const data = await recipeItemService.list(req.params.recipeId, {
      brandId: req.tenant.brandId,
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
    const { value, error } = createRecipeItemSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const data = await recipeItemService.create(req.params.recipeId, {
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
    const data = await recipeItemService.get(req.params.id, {
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
    const { value, error } = updateRecipeItemSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const data = await recipeItemService.update(req.params.id, {
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
    await recipeItemService.remove(req.params.id, {
      brandId: req.tenant.brandId,
    });
    
    res.status(204).send();
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Server error" });
  }
}

async function batchUpdate(req, res) {
  try {
    const { value, error } = batchUpdateRecipeItemsSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const data = await recipeItemService.batchUpdate(req.params.recipeId, {
      brandId: req.tenant.brandId,
      items: value.items,
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
  batchUpdate,
};
