const bankAccountService = require('./bank-account.service');

async function list(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId } = req.query;

    const accounts = await bankAccountService.getBankAccounts(brandId, branchId);

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const { brandId } = req.user;
    const {
      branchId,
      accountName,
      accountNumber,
      bankName,
      bankCode,
      routingNumber,
      swiftCode,
      iban,
      currency,
      isDefault,
    } = req.body;

    const account = await bankAccountService.addBankAccount({
      brandId,
      branchId,
      accountName,
      accountNumber,
      bankName,
      bankCode,
      routingNumber,
      swiftCode,
      iban,
      currency,
      isDefault,
    });

    res.status(201).json({
      success: true,
      data: account,
      message: 'Bank account added successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    const { id } = req.params;

    const account = await bankAccountService.getBankAccount(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found',
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const account = await bankAccountService.updateBankAccount(id, updates);

    res.json({
      success: true,
      data: account,
      message: 'Bank account updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;

    await bankAccountService.deleteBankAccount(id);

    res.json({
      success: true,
      message: 'Bank account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function setDefault(req, res, next) {
  try {
    const { id } = req.params;

    const account = await bankAccountService.setDefaultBankAccount(id);

    res.json({
      success: true,
      data: account,
      message: 'Default bank account updated',
    });
  } catch (error) {
    next(error);
  }
}

async function verify(req, res, next) {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    // Check if user is admin
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'BRAND_OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to verify bank accounts',
      });
    }

    const account = await bankAccountService.verifyBankAccount(id, isVerified);

    res.json({
      success: true,
      data: account,
      message: `Bank account ${isVerified ? 'verified' : 'unverified'}`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create,
  get,
  update,
  remove,
  setDefault,
  verify,
};
