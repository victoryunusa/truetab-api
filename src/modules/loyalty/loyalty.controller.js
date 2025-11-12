const {
  createLoyaltyProgram,
  listLoyaltyPrograms,
  getLoyaltyProgramById,
  updateLoyaltyProgram,
  deleteLoyaltyProgram,
  createLoyaltyTier,
  updateLoyaltyTier,
  deleteLoyaltyTier,
  enrollCustomer,
  getCustomerLoyalty,
  earnPoints,
  redeemPoints,
  adjustPoints,
  getCustomerTransactions,
  createLoyaltyReward,
  listLoyaltyRewards,
  updateLoyaltyReward,
  deleteLoyaltyReward,
} = require("./loyalty.service");

const {
  createProgramSchema,
  updateProgramSchema,
  createTierSchema,
  updateTierSchema,
  enrollCustomerSchema,
  adjustPointsSchema,
  earnPointsSchema,
  redeemPointsSchema,
  createRewardSchema,
  updateRewardSchema,
  searchSchema,
} = require("./loyalty.validation");

// ============= LOYALTY PROGRAMS =============

async function createProgramController(req, res) {
  try {
    const { value, error } = createProgramSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    const program = await createLoyaltyProgram({
      brandId: req.tenant.brandId,
      ...value,
    });

    res.status(201).json({
      message: "Loyalty program created successfully",
      data: program,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function listProgramsController(req, res) {
  try {
    const { value, error } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: "Validation failed", details: error.details });
    }

    const result = await listLoyaltyPrograms({
      brandId: req.tenant.brandId,
      ...value,
    });

    res.json({
      message: "Loyalty programs retrieved successfully",
      data: result.programs,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getProgramController(req, res) {
  try {
    const program = await getLoyaltyProgramById({
      programId: req.params.id,
      brandId: req.tenant.brandId,
    });

    res.json({
      message: "Loyalty program retrieved successfully",
      data: program,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function updateProgramController(req, res) {
  try {
    const { value, error } = updateProgramSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Validation failed", details: error.details });
    }

    const program = await updateLoyaltyProgram({
      programId: req.params.id,
      brandId: req.tenant.brandId,
      ...value,
    });

    res.json({
      message: "Loyalty program updated successfully",
      data: program,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteProgramController(req, res) {
  try {
    const result = await deleteLoyaltyProgram({
      programId: req.params.id,
      brandId: req.tenant.brandId,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ============= LOYALTY TIERS =============

async function createTierController(req, res) {
  try {
    const { value, error } = createTierSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Validation failed", details: error.details });
    }

    const tier = await createLoyaltyTier(value);

    res.status(201).json({
      message: "Loyalty tier created successfully",
      data: tier,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateTierController(req, res) {
  try {
    const { value, error } = updateTierSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Validation failed", details: error.details });
    }

    const tier = await updateLoyaltyTier({
      tierId: req.params.tierId,
      programId: req.params.id,
      ...value,
    });

    res.json({
      message: "Loyalty tier updated successfully",
      data: tier,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteTierController(req, res) {
  try {
    const result = await deleteLoyaltyTier({
      tierId: req.params.tierId,
      programId: req.params.id,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ============= CUSTOMER LOYALTY =============

async function enrollCustomerController(req, res) {
  try {
    const { value, error } = enrollCustomerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Validation failed", details: error.details });
    }

    const loyalty = await enrollCustomer({
      brandId: req.tenant.brandId,
      ...value,
    });

    res.status(201).json({
      message: "Customer enrolled successfully",
      data: loyalty,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getCustomerLoyaltyController(req, res) {
  try {
    const loyalty = await getCustomerLoyalty({
      customerId: req.params.customerId,
      brandId: req.tenant.brandId,
    });

    res.json({
      message: "Customer loyalty retrieved successfully",
      data: loyalty,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function earnPointsController(req, res) {
  try {
    const { value, error } = earnPointsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Validation failed", details: error.details });
    }

    const transaction = await earnPoints({
      programId: req.params.id,
      ...value,
    });

    res.status(201).json({
      message: "Points earned successfully",
      data: transaction,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function redeemPointsController(req, res) {
  try {
    const { value, error } = redeemPointsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Validation failed", details: error.details });
    }

    const transaction = await redeemPoints({
      programId: req.params.id,
      ...value,
    });

    res.status(201).json({
      message: "Points redeemed successfully",
      data: transaction,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function adjustPointsController(req, res) {
  try {
    const { value, error } = adjustPointsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Validation failed", details: error.details });
    }

    const transaction = await adjustPoints({
      customerId: req.params.customerId,
      programId: req.params.id,
      ...value,
    });

    res.json({
      message: "Points adjusted successfully",
      data: transaction,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getCustomerTransactionsController(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await getCustomerTransactions({
      customerId: req.params.customerId,
      brandId: req.tenant.brandId,
      limit,
      offset,
    });

    res.json({
      message: "Transactions retrieved successfully",
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

// ============= LOYALTY REWARDS =============

async function createRewardController(req, res) {
  try {
    const { value, error } = createRewardSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Validation failed", details: error.details });
    }

    const reward = await createLoyaltyReward(value);

    res.status(201).json({
      message: "Loyalty reward created successfully",
      data: reward,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function listRewardsController(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;

    const result = await listLoyaltyRewards({
      programId: req.params.id,
      isActive,
      limit,
      offset,
    });

    res.json({
      message: "Loyalty rewards retrieved successfully",
      data: result.rewards,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateRewardController(req, res) {
  try {
    const { value, error } = updateRewardSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Validation failed", details: error.details });
    }

    const reward = await updateLoyaltyReward({
      rewardId: req.params.rewardId,
      programId: req.params.id,
      ...value,
    });

    res.json({
      message: "Loyalty reward updated successfully",
      data: reward,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteRewardController(req, res) {
  try {
    const result = await deleteLoyaltyReward({
      rewardId: req.params.rewardId,
      programId: req.params.id,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createProgramController,
  listProgramsController,
  getProgramController,
  updateProgramController,
  deleteProgramController,
  createTierController,
  updateTierController,
  deleteTierController,
  enrollCustomerController,
  getCustomerLoyaltyController,
  earnPointsController,
  redeemPointsController,
  adjustPointsController,
  getCustomerTransactionsController,
  createRewardController,
  listRewardsController,
  updateRewardController,
  deleteRewardController,
};
