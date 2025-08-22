const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { uploadBase64Image } = require("../../../lib/cloudinary");
const Joi = require("joi");

const schema = Joi.object({
  base64: Joi.string().required(), // data:image/png;base64,....
});

async function uploadItemImage(req, res) {
  const { value, error } = schema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });

  const item = await prisma.menuItem.findFirst({
    where: { id: req.params.id, brandId: req.tenant.brandId },
  });
  if (!item) return res.status(404).json({ error: "Item not found" });

  const url = await uploadBase64Image(
    value.base64,
    `brands/${req.tenant.brandId}/menu`
  );
  const updated = await prisma.menuItem.update({
    where: { id: item.id },
    data: { imageUrl: url },
  });
  res.json({ data: updated });
}

module.exports = { uploadItemImage };
