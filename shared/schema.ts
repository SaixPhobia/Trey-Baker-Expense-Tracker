import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, serial, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({ id: true });
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({ id: true });
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("Pending"),
  reimbursement: text("reimbursement").notNull().default("No"),
  submittedBy: text("submitted_by").notNull().default(""),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, date: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  itemName: text("item_name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("Pending"),
  submittedBy: text("submitted_by").notNull().default(""),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, date: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const menuItemIngredients = pgTable("menu_item_ingredients", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull(),
  ingredientId: integer("ingredient_id").notNull(),
  quantityNeeded: decimal("quantity_needed", { precision: 10, scale: 2 }).notNull(),
});

export const insertMenuItemIngredientSchema = createInsertSchema(menuItemIngredients).omit({ id: true });
export type InsertMenuItemIngredient = z.infer<typeof insertMenuItemIngredientSchema>;
export type MenuItemIngredient = typeof menuItemIngredients.$inferSelect;

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  createdBy: text("created_by").notNull().default(""),
  status: text("status").notNull().default("Completed"),
  isEmployeeMeal: boolean("is_employee_meal").notNull().default(false),
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({ id: true, date: true });
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;

export const receiptItems = pgTable("receipt_items", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id").notNull(),
  menuItemId: integer("menu_item_id"),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
});

export const insertReceiptItemSchema = createInsertSchema(receiptItems).omit({ id: true });
export type InsertReceiptItem = z.infer<typeof insertReceiptItemSchema>;
export type ReceiptItem = typeof receiptItems.$inferSelect;

export const productionLogs = pgTable("production_logs", {
  id: serial("id").primaryKey(),
  batchId: text("batch_id"),
  menuItemId: integer("menu_item_id").notNull(),
  menuItemName: text("menu_item_name").notNull(),
  quantity: integer("quantity").notNull(),
  ingredientCost: decimal("ingredient_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  saleAmount: decimal("sale_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  loggedBy: text("logged_by").notNull().default(""),
});

export const insertProductionLogSchema = createInsertSchema(productionLogs).omit({ id: true, loggedAt: true });
export type InsertProductionLog = z.infer<typeof insertProductionLogSchema>;
export type ProductionLog = typeof productionLogs.$inferSelect;

export const contractOrders = pgTable("contract_orders", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  items: text("items").notNull(),
  quantityPerDelivery: text("quantity_per_delivery").notNull().default(""),
  lineItems: text("line_items").notNull().default("[]"),
  frequency: text("frequency").notNull().default("Weekly"),
  pricePerDelivery: decimal("price_per_delivery", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("Active"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContractOrderSchema = createInsertSchema(contractOrders).omit({ id: true, createdAt: true });
export type InsertContractOrder = z.infer<typeof insertContractOrderSchema>;
export type ContractOrder = typeof contractOrders.$inferSelect;

export const profileSettings = pgTable("profile_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Jean Dupont"),
  email: text("email").notNull().default("jean@treybaker.com"),
  role: text("role").notNull().default("Owner"),
  bakeryName: text("bakery_name").notNull().default("Trey Baker"),
  phone: text("phone").notNull().default("(555) 123-4567"),
  emailExpenses: text("email_expenses").notNull().default("true"),
  emailLowStock: text("email_low_stock").notNull().default("true"),
  emailWeeklyReport: text("email_weekly_report").notNull().default("false"),
  pushApprovals: text("push_approvals").notNull().default("true"),
  pushNewOrders: text("push_new_orders").notNull().default("false"),
});

export const insertProfileSettingsSchema = createInsertSchema(profileSettings).omit({ id: true });
export type InsertProfileSettings = z.infer<typeof insertProfileSettingsSchema>;
export type ProfileSettings = typeof profileSettings.$inferSelect;

export const ROLES = ["Owner", "Manager", "Staff"] as const;
export type Role = typeof ROLES[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull().default(""),
  role: text("role").notNull().default("Staff"),
  isOriginalOwner: boolean("is_original_owner").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  displayName: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});
