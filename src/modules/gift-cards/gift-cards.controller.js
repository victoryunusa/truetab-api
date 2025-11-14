const svc = require("./gift-cards.service");
const {
  purchaseGiftCardSchema,
  redeemGiftCardSchema,
  checkBalanceSchema,
  issueStoreCreditSchema,
  applyStoreCreditSchema,
} = require("./gift-cards.validation");

// Gift Cards

async function purchaseGiftCard(req, res, next) {
  try {
    const { value, error } = purchaseGiftCardSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.map((d) => d.message) });
    }

    const giftCard = await svc.purchaseGiftCard(
      req.tenant.brandId,
      req.user.id,
      value
    );
    res.status(201).json({ data: giftCard });
  } catch (err) {
    next(err);
  }
}

async function checkBalance(req, res, next) {
  try {
    const code = req.params.code;
    const balance = await svc.checkBalance(code);
    res.json({ data: balance });
  } catch (err) {
    next(err);
  }
}

async function redeemGiftCard(req, res, next) {
  try {
    const { value, error } = redeemGiftCardSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.map((d) => d.message) });
    }

    const result = await svc.redeemGiftCard(value.code, value.amount, value.orderId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function getTransactionHistory(req, res, next) {
  try {
    const code = req.params.code;
    const history = await svc.getTransactionHistory(code);
    res.json({ data: history });
  } catch (err) {
    next(err);
  }
}

async function listGiftCards(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await svc.listGiftCards(req.tenant.brandId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Store Credit

async function issueStoreCredit(req, res, next) {
  try {
    const { value, error } = issueStoreCreditSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.map((d) => d.message) });
    }

    const storeCredit = await svc.issueStoreCredit(req.tenant.brandId, value);
    res.status(201).json({ data: storeCredit });
  } catch (err) {
    next(err);
  }
}

async function getCustomerStoreCredit(req, res, next) {
  try {
    const customerId = req.params.customerId;
    const storeCredit = await svc.getStoreCredit(req.tenant.brandId, customerId);
    res.json({ data: storeCredit });
  } catch (err) {
    next(err);
  }
}

async function applyStoreCredit(req, res, next) {
  try {
    const { value, error } = applyStoreCreditSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.map((d) => d.message) });
    }

    const result = await svc.applyStoreCredit(
      req.tenant.brandId,
      value.customerId,
      value.amount,
      value.orderId
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  purchaseGiftCard,
  checkBalance,
  redeemGiftCard,
  getTransactionHistory,
  listGiftCards,
  issueStoreCredit,
  getCustomerStoreCredit,
  applyStoreCredit,
};
