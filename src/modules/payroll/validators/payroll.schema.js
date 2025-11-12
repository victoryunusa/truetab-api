const Joi = require("joi");

const createEmployeeProfileSchema = Joi.object({
  userId: Joi.string().required(),
  employeeNumber: Joi.string().allow("", null),
  payType: Joi.string().valid("HOURLY", "SALARY", "DAILY").default("HOURLY"),
  hourlyRate: Joi.number().precision(2).min(0).allow(null),
  salaryAmount: Joi.number().precision(2).min(0).allow(null),
  overtimeRate: Joi.number().precision(2).min(0).allow(null),
  hireDate: Joi.date().iso().allow(null),
  terminationDate: Joi.date().iso().allow(null),
  taxId: Joi.string().allow("", null),
  bankAccount: Joi.string().allow("", null),
  emergencyContact: Joi.string().allow("", null),
  emergencyPhone: Joi.string().allow("", null),
  notes: Joi.string().allow("", null),
});

const updateEmployeeProfileSchema = Joi.object({
  employeeNumber: Joi.string().allow("", null),
  payType: Joi.string().valid("HOURLY", "SALARY", "DAILY"),
  hourlyRate: Joi.number().precision(2).min(0).allow(null),
  salaryAmount: Joi.number().precision(2).min(0).allow(null),
  overtimeRate: Joi.number().precision(2).min(0).allow(null),
  hireDate: Joi.date().iso().allow(null),
  terminationDate: Joi.date().iso().allow(null),
  isActive: Joi.boolean(),
  taxId: Joi.string().allow("", null),
  bankAccount: Joi.string().allow("", null),
  emergencyContact: Joi.string().allow("", null),
  emergencyPhone: Joi.string().allow("", null),
  notes: Joi.string().allow("", null),
});

const createPayrollPeriodSchema = Joi.object({
  branchId: Joi.string().allow("", null),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  frequency: Joi.string()
    .valid("WEEKLY", "BI_WEEKLY", "MONTHLY", "SEMI_MONTHLY")
    .default("MONTHLY"),
  notes: Joi.string().allow("", null),
});

const updatePayrollPeriodSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  frequency: Joi.string().valid("WEEKLY", "BI_WEEKLY", "MONTHLY", "SEMI_MONTHLY"),
  status: Joi.string().valid(
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "PAID",
    "CANCELLED"
  ),
  notes: Joi.string().allow("", null),
});

const addPayrollItemSchema = Joi.object({
  type: Joi.string()
    .valid(
      "REGULAR_HOURS",
      "OVERTIME",
      "BONUS",
      "DEDUCTION",
      "COMMISSION",
      "TIPS",
      "ADJUSTMENT"
    )
    .required(),
  description: Joi.string().required(),
  amount: Joi.number().precision(2).required(),
  quantity: Joi.number().precision(2).allow(null),
  rate: Joi.number().precision(2).allow(null),
});

const updatePayrollStatusSchema = Joi.object({
  status: Joi.string()
    .valid("DRAFT", "PENDING_APPROVAL", "APPROVED", "PAID", "CANCELLED")
    .required(),
  notes: Joi.string().allow("", null),
});

module.exports = {
  createEmployeeProfileSchema,
  updateEmployeeProfileSchema,
  createPayrollPeriodSchema,
  updatePayrollPeriodSchema,
  addPayrollItemSchema,
  updatePayrollStatusSchema,
};
