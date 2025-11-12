const walletService = require('./wallet.service');

async function getSummary(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId } = req.query;

    const summary = await walletService.getWalletSummary(brandId, branchId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

async function getTransactions(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId, type, limit = 50, offset = 0 } = req.query;

    const transactions = await walletService.getTransactionHistory({
      brandId,
      branchId,
      type,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
}

async function requestPayout(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId, amount, bankAccountId, method } = req.body;

    const payout = await walletService.requestPayout({
      brandId,
      branchId,
      amount,
      bankAccountId,
      method,
    });

    res.status(201).json({
      success: true,
      data: payout,
      message: 'Payout requested successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function getPayouts(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId, status, limit = 50, offset = 0 } = req.query;

    const payouts = await walletService.getPayouts({
      brandId,
      branchId,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    next(error);
  }
}

async function cancelPayout(req, res, next) {
  try {
    const { payoutId } = req.params;

    const payout = await walletService.cancelPayout(payoutId);

    res.json({
      success: true,
      data: payout,
      message: 'Payout cancelled',
    });
  } catch (error) {
    next(error);
  }
}

async function processPayout(req, res, next) {
  try {
    const { payoutId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'BRAND_OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to process payouts',
      });
    }

    const payout = await walletService.processPayout(payoutId);

    res.json({
      success: true,
      data: payout,
      message: 'Payout processed successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
  getTransactions,
  requestPayout,
  getPayouts,
  cancelPayout,
  processPayout,
};
