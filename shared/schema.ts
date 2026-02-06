import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Ingredients table - for tracking ingredient costs
export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull(), // kg, liters, dozen, etc.
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // Flour, Dairy, Eggs, Sugar, etc.
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({ id: true });
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;

// Menu Items table - bakery products
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // Bread, Pastry, Cake, etc.
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// Expense Categories table
export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({ id: true });
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("Pending"), // Pending, Approved
  reimbursement: text("reimbursement").notNull().default("No"), // No, Requested, Reimbursed
  submittedBy: text("submitted_by").notNull().default(""),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, date: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Profile settings table
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

// Users table (kept for future auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
