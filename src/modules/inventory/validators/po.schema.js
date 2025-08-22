const Joi = require("joi");

const createPOSchema = Joi.object({
  supplierId: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().precision(3).positive().required(),
        unitCost: Joi.number().precision(2).positive().required(),
      })
    )
    .min(1)
    .required(),
});

const receivePOSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().required(),
        receivedQty: Joi.number().precision(3).min(0).required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = {
  createPOSchema,
  receivePOSchema,
};
