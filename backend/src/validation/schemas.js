const { z } = require('zod');

const toTrimmed = (value) => String(value ?? '').trim();
const toUpper = (value) => toTrimmed(value).toUpperCase();

const productWriteSchema = z.object({
  id: z.string().min(1).max(50),
  categoryKey: z.string().min(1).max(50),
  categoryLabel: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional().default(''),
  imageUrl: z.string().max(16_000_000).optional().default(''),
  sizeLabel: z.string().max(100).optional().default(''),
  stockLabel: z.string().max(100).optional().default('Còn hàng'),
  price: z.number().int().positive(),
  quantity: z.number().int().min(0).default(0),
});

const userCreateSchema = z.object({
  name: z.string().min(1).max(150),
});

const userUpdateSchema = z.object({
  name: z.string().min(1).max(150),
  role: z.enum(['admin', 'customer', 'staff']).optional(),
  phone: z.string().regex(/^0\d{9}$/).optional(),
});

const offerWriteSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional().default(''),
  badge: z.string().max(100).optional().default(''),
  discountType: z.enum(['percent', 'fixed']).default('percent'),
  discountValue: z.number().int().min(0).default(0),
  minOrder: z.number().int().min(0).default(0),
  expiryDate: z.string().optional().nullable(),
});

const voucherWriteSchema = z.object({
  code: z.string().min(2).max(50).transform(toUpper),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().int().positive(),
  minOrder: z.number().int().min(0).default(0),
  categoryKey: z.string().max(50).optional().default('all'),
  expiryDate: z.string().optional().nullable(),
});

const voucherValidateSchema = z.object({
  code: z.string().min(2).max(50).transform(toUpper),
  orderAmount: z.number().int().min(0).default(0),
});

const orderStatusSchema = z.object({
  status: z.enum(['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã huỷ']),
});

const orderCreateSchema = z.object({
  fullName: z.string().min(1).max(150),
  phone: z.string().regex(/^0\d{9}$/),
  address: z.string().min(1).max(2000),
  note: z.string().max(2000).optional().default(''),
  paymentMethod: z.enum(['cod', 'bank', 'vnpay']).default('cod'),
  voucherCode: z.string().max(50).optional().default(''),
  promotionTitle: z.string().max(255).optional().default(''),
  discountAmount: z.number().int().min(0).default(0),
});

const parseBody = (schema, payload) => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues?.[0]?.message || 'Dữ liệu đầu vào không hợp lệ.',
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
};

module.exports = {
  parseBody,
  productWriteSchema,
  userCreateSchema,
  userUpdateSchema,
  offerWriteSchema,
  voucherWriteSchema,
  voucherValidateSchema,
  orderCreateSchema,
  orderStatusSchema,
};
