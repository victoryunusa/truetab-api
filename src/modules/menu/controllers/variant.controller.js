const {
  createVariantSchema,
  updateVariantSchema,
  branchOverrideSchema,
} = require("../validators/variant.schema");
const svc = require("../services/variant.service");

async function listForItem(req, res) {
  const data = await svc.listForItem(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
  });
  res.json({ data });
}

async function createForItem(req, res) {
  const { value, error } = createVariantSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.createForItem(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    ...value,
  });
  res.status(201).json({ data });
}

async function update(req, res) {
  const { value, error } = updateVariantSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.update(req.params.variantId, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    ...value,
  });
  res.json({ data });
}

async function remove(req, res) {
  await svc.remove(req.params.variantId, { 
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId 
  });
  res.status(204).send();
}

async function listBranchOverrides(req, res) {
  const data = await svc.listBranchOverrides(req.params.variantId, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
  });
  res.json({ data });
}

async function upsertBranchOverride(req, res) {
  const { value, error } = branchOverrideSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.upsertBranchOverride(
    req.params.variantId,
    req.params.branchId,
    { 
      brandId: req.tenant.brandId, 
      branchIdContext: req.tenant.branchId,
      ...value 
    }
  );
  res.json({ data });
}

async function deleteBranchOverride(req, res) {
  await svc.deleteBranchOverride(req.params.variantId, req.params.branchId, {
    brandId: req.tenant.brandId,
    branchIdContext: req.tenant.branchId,
  });
  res.status(204).send();
}

// link modifier groups to variant
async function linkModifierGroups(req, res) {
  const { linkGroupsSchema } = require("../validators/modifier.schema");
  const { value, error } = linkGroupsSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.linkModifierGroups(req.params.variantId, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    groupIds: value.groupIds,
  });
  res.json({ data });
}

module.exports = {
  listForItem,
  createForItem,
  update,
  remove,
  listBranchOverrides,
  upsertBranchOverride,
  deleteBranchOverride,
  linkModifierGroups,
};
