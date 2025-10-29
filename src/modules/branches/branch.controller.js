const Joi = require('joi');
const {
  createBranch,
  listBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchUsers,
  getBranchStats,
} = require('./branch.service');

const createSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  countryId: Joi.string().uuid().optional(),
  location: Joi.string().max(500).allow('', null),
});

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  countryId: Joi.string().uuid().optional(),
  location: Joi.string().max(500).allow('', null).optional(),
  currency: Joi.string().length(3).optional(), // ISO currency code
  defaultBillType: Joi.string().valid('FINE_DINE', 'QUICK_BILL').optional(),
});

async function createBranchController(req, res) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(422).json({
        error: error.details.map(d => ({
          field: d.path[0],
          message: d.message,
        })),
      });
    }

    const out = await createBranch({
      brandId: req.tenant.brandId,
      creatorUserId: req.user.id,
      ...value,
    });

    res.status(201).json({
      success: true,
      data: out,
      message: 'Branch created successfully',
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message,
    });
  }
}

async function listBranchesController(req, res) {
  try {
    const includeUsers = req.query.includeUsers === 'true';
    const data = await listBranches({
      brandId: req.tenant.brandId,
      includeUsers,
    });

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message,
    });
  }
}

async function getBranchController(req, res) {
  try {
    const { branchId } = req.params;

    const branch = await getBranchById(branchId);

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    // Check if branch belongs to user's brand
    if (branch.brandId !== req.tenant.brandId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this branch',
      });
    }

    res.json({
      success: true,
      data: branch,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message,
    });
  }
}

async function updateBranchController(req, res) {
  try {
    const { branchId } = req.params;

    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(422).json({
        success: false,
        error: error.details.map(d => ({
          field: d.path[0],
          message: d.message,
        })),
      });
    }

    // Verify branch exists and belongs to user's brand
    const existingBranch = await getBranchById(branchId);
    if (!existingBranch || existingBranch.brandId !== req.tenant.brandId) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    const updatedBranch = await updateBranch(branchId, value);

    res.json({
      success: true,
      data: updatedBranch,
      message: 'Branch updated successfully',
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message,
    });
  }
}

async function deleteBranchController(req, res) {
  try {
    const { branchId } = req.params;

    // Verify branch exists and belongs to user's brand
    const existingBranch = await getBranchById(branchId);
    if (!existingBranch || existingBranch.brandId !== req.tenant.brandId) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    await deleteBranch(branchId);

    res.json({
      success: true,
      message: 'Branch deleted successfully',
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message,
    });
  }
}

async function getBranchUsersController(req, res) {
  try {
    const { branchId } = req.params;

    // Verify branch exists and belongs to user's brand
    const existingBranch = await getBranchById(branchId);
    if (!existingBranch || existingBranch.brandId !== req.tenant.brandId) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    const users = await getBranchUsers(branchId);

    res.json({
      success: true,
      data: users,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message,
    });
  }
}

async function getBranchStatsController(req, res) {
  try {
    const stats = await getBranchStats(req.tenant.brandId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message,
    });
  }
}

module.exports = {
  createBranchController,
  listBranchesController,
  getBranchController,
  updateBranchController,
  deleteBranchController,
  getBranchUsersController,
  getBranchStatsController,
};
