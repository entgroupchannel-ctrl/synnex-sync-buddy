import { z } from "zod";

export const orderItemInputSchema = z.object({
  order_id: z.string().uuid(),
  product_sku: z.string().trim().min(1).max(120),
  product_name: z.string().trim().min(1).max(500).nullable(),
  product_image_url: z.string().trim().max(2_000).nullable(),
  distributor: z.string().trim().min(1).max(120),
  unit_price: z.number().finite().nonnegative(),
  quantity: z.number().int().positive().max(999),
  subtotal: z.number().finite().nonnegative(),
  category: z.string().trim().max(120).nullable(),
});

export const insertOrderItemsSchema = z.object({
  items: z.array(orderItemInputSchema).min(1).max(200),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;