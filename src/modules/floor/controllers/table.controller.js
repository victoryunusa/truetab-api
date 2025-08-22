const {
  createTableSchema,
  updateTableSchema,
} = require("../validators/table.schema");
const svc = require("../services/table.service");
const QRCode = require("qrcode");

// Generate a deep link for the online ordering site (adjust domain as needed)
function tableDeepLink({ brandId, branchId, tableCode }) {
  // example: https://order.yourdomain.com/{brand}/{branch}/t/{code}
  return `${process.env.ORDERING_BASE_URL || "https://order.example.com"}/${brandId}/${branchId}/t/${tableCode}`;
}

async function list(req, res) {
  try {
    const data = await svc.list({ branchId: req.tenant.branchId });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function get(req, res) {
  try {
    const data = await svc.get(req.params.id, {
      branchId: req.tenant.branchId,
    });
    res.json({ data });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

async function create(req, res) {
  try {
    const { value, error } = createTableSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const branchId = value.branchId || req.tenant.branchId;
    const out = await svc.create({
      brandId: req.tenant.brandId,
      branchId,
      name: value.name,
      capacity: value.capacity,
      zoneId: value.zoneId || null,
    });
    res.status(201).json({ data: out });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function update(req, res) {
  try {
    const { value, error } = updateTableSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const out = await svc.update(req.params.id, {
      brandId: req.tenant.brandId,
      branchId: req.tenant.branchId,
      ...value,
    });
    res.json({ data: out });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function remove(req, res) {
  try {
    await svc.remove(req.params.id, { branchId: req.tenant.branchId });
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// On-demand QR code for the table deep link (returns PNG as data URL)
async function qrCode(req, res) {
  try {
    const t = await svc.get(req.params.id, { branchId: req.tenant.branchId });
    const link = tableDeepLink({
      brandId: req.tenant.brandId,
      branchId: req.tenant.branchId,
      tableCode: t.code,
    });
    const dataUrl = await QRCode.toDataURL(link, { width: 512, margin: 1 });
    res.json({ data: { link, qrcodeDataUrl: dataUrl } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = { list, get, create, update, remove, qrCode };
