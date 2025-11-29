const {
  createItemSchema,
  updateItemSchema,
  attachCategoriesSchema,
  i18nSchema,
} = require("../validators/item.schema");
const svc = require("../services/item.service");

async function list(req, res) {
  const data = await svc.list({ 
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId 
  });
  res.json({ data });
}

async function create(req, res) {
  const { value, error } = createItemSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.create({ 
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    ...value 
  });
  res.status(201).json({ data });
}

async function get(req, res) {
  const data = await svc.get(req.params.id, { 
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId 
  });
  res.json({ data });
}

async function update(req, res) {
  const { value, error } = updateItemSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.update(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    ...value,
  });
  res.json({ data });
}

async function remove(req, res) {
  await svc.remove(req.params.id, { 
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId 
  });
  res.status(204).send();
}

// categories
async function attachCategories(req, res) {
  const { value, error } = attachCategoriesSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.attachCategories(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    categoryIds: value.categoryIds,
  });
  res.json({ data });
}

async function listCategories(req, res) {
  const data = await svc.listCategories(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
  });
  res.json({ data });
}

async function detachCategory(req, res) {
  await svc.detachCategory(req.params.id, req.params.categoryId, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
  });
  res.status(204).send();
}

// i18n
async function upsertI18n(req, res) {
  const { value, error } = i18nSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.upsertI18n(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    ...value,
  });
  res.json({ data });
}

async function getI18n(req, res) {
  const data = await svc.getI18n(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
  });
  res.json({ data });
}

async function deleteI18n(req, res) {
  await svc.deleteI18n(req.params.id, req.params.locale, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
  });
  res.status(204).send();
}

// link modifier groups to item
async function linkModifierGroups(req, res) {
  const { linkGroupsSchema } = require("../validators/modifier.schema");
  const { value, error } = linkGroupsSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.linkModifierGroups(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    ...value,
  });
  res.json({ data });
}

module.exports = {
  list,
  create,
  get,
  update,
  remove,
  attachCategories,
  listCategories,
  detachCategory,
  upsertI18n,
  getI18n,
  deleteI18n,
  linkModifierGroups,
};
