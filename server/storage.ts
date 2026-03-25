import { 
  type User, type InsertUser,
  type Ingredient, type InsertIngredient,
  type MenuItem, type InsertMenuItem,
  type Expense, type InsertExpense,
  type ExpenseCategory, type InsertExpenseCategory,
  type ProfileSettings, type InsertProfileSettings,
  type Order, type InsertOrder,
  type MenuItemIngredient, type InsertMenuItemIngredient,
  type Receipt, type InsertReceipt,
  type ReceiptItem, type InsertReceiptItem,
  type ProductionLog, type InsertProductionLog,
  type ContractOrder, type InsertContractOrder,
  users, ingredients, menuItems, expenses, expenseCategories, profileSettings, orders,
  menuItemIngredients, receipts, receiptItems, productionLogs, contractOrders
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithRole(user: InsertUser, role: string): Promise<User>;
  getUserCount(): Promise<number>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateUserPassword(id: string, hashedPassword: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  getIngredients(): Promise<Ingredient[]>;
  getIngredient(id: number): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined>;
  deleteIngredient(id: number): Promise<boolean>;
  
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  
  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory>;
  deleteExpenseCategory(id: number): Promise<boolean>;

  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  deductIngredients(menuItemId: number, batchQty: number): Promise<{ ingredientId: number; deducted: number; remaining: string; cost: number }[]>;
  getAllMenuItemIngredients(): Promise<MenuItemIngredient[]>;
  createProductionLog(log: InsertProductionLog): Promise<ProductionLog>;
  getProductionLogs(): Promise<ProductionLog[]>;
  getStats(): Promise<{ inventoryValue: number; totalProduced: number }>;
  getCurrentStock(): Promise<{ menuItemId: number; menuItemName: string; basePrice: string; produced: number; sold: number; inStock: number }[]>;
  getMenuItemIngredients(menuItemId: number): Promise<MenuItemIngredient[]>;
  setMenuItemIngredients(menuItemId: number, items: InsertMenuItemIngredient[]): Promise<MenuItemIngredient[]>;

  getReceipts(): Promise<Receipt[]>;
  getReceipt(id: number): Promise<Receipt | undefined>;
  createReceipt(receipt: InsertReceipt, items: InsertReceiptItem[]): Promise<Receipt & { items: ReceiptItem[] }>;
  deleteReceipt(id: number): Promise<boolean>;
  getReceiptItems(receiptId: number): Promise<ReceiptItem[]>;

  getProfileSettings(): Promise<ProfileSettings>;
  updateProfileSettings(settings: Partial<InsertProfileSettings>): Promise<ProfileSettings>;
  getReports(): Promise<{
    summary: { totalRevenue: number; totalIngredientCost: number; totalExpenses: number; netProfit: number };
    receiptRows: { id: number; date: string; createdBy: string; total: string; commission: string }[];
  }>;

  getContractOrders(): Promise<ContractOrder[]>;
  getContractOrder(id: number): Promise<ContractOrder | undefined>;
  createContractOrder(order: InsertContractOrder): Promise<ContractOrder>;
  updateContractOrder(id: number, order: Partial<InsertContractOrder>): Promise<ContractOrder | undefined>;
  deleteContractOrder(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      password: insertUser.password,
      displayName: insertUser.displayName || insertUser.username,
    }).returning();
    return user;
  }

  async createUserWithRole(insertUser: InsertUser, role: string): Promise<User> {
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      password: insertUser.password,
      displayName: insertUser.displayName || insertUser.username,
      role,
    }).returning();
    return user;
  }

  async getUserCount(): Promise<number> {
    const result = await db.select().from(users);
    return result.length;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    return !!deleted;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<boolean> {
    const [updated] = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id)).returning();
    return !!updated;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getIngredients(): Promise<Ingredient[]> {
    return db.select().from(ingredients);
  }

  async getIngredient(id: number): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, id));
    return ingredient;
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [created] = await db.insert(ingredients).values(ingredient).returning();
    return created;
  }

  async updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const [updated] = await db.update(ingredients).set(ingredient).where(eq(ingredients.id, id)).returning();
    return updated;
  }

  async deleteIngredient(id: number): Promise<boolean> {
    await db.delete(ingredients).where(eq(ingredients.id, id));
    return true;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return db.select().from(menuItems);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(menuItems).values(item).returning();
    return created;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(menuItems).set(item).where(eq(menuItems.id, id)).returning();
    return updated;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
    return true;
  }

  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(expense).returning();
    return created;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return updated;
  }

  async deleteExpense(id: number): Promise<boolean> {
    await db.delete(expenses).where(eq(expenses.id, id));
    return true;
  }

  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return db.select().from(expenseCategories);
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    const [created] = await db.insert(expenseCategories).values(category).returning();
    return created;
  }

  async deleteExpenseCategory(id: number): Promise<boolean> {
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
    return true;
  }

  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.date));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(order).where(eq(orders.id, id)).returning();
    return updated;
  }

  async deleteOrder(id: number): Promise<boolean> {
    await db.delete(orders).where(eq(orders.id, id));
    return true;
  }

  async getAllMenuItemIngredients(): Promise<MenuItemIngredient[]> {
    return db.select().from(menuItemIngredients);
  }

  async createProductionLog(log: InsertProductionLog): Promise<ProductionLog> {
    const [created] = await db.insert(productionLogs).values(log).returning();
    return created;
  }

  async getProductionLogs(): Promise<ProductionLog[]> {
    return db.select().from(productionLogs).orderBy(desc(productionLogs.loggedAt));
  }

  async getCurrentStock(): Promise<{ menuItemId: number; menuItemName: string; basePrice: string; produced: number; sold: number; inStock: number }[]> {
    const allItems = await db.select().from(menuItems);
    const allLogs = await db.select().from(productionLogs);
    const allReceiptItems = await db.select().from(receiptItems);

    const producedMap: Record<number, number> = {};
    for (const log of allLogs) {
      producedMap[log.menuItemId] = (producedMap[log.menuItemId] || 0) + log.quantity;
    }

    const soldMap: Record<number, number> = {};
    for (const ri of allReceiptItems) {
      if (ri.menuItemId != null) {
        soldMap[ri.menuItemId] = (soldMap[ri.menuItemId] || 0) + ri.quantity;
      }
    }

    return allItems
      .filter(item => producedMap[item.id] > 0)
      .map(item => {
        const produced = producedMap[item.id] || 0;
        const sold = soldMap[item.id] || 0;
        const inStock = Math.max(0, produced - sold);
        return { menuItemId: item.id, menuItemName: item.name, basePrice: item.basePrice, produced, sold, inStock };
      })
      .sort((a, b) => b.inStock - a.inStock);
  }

  async getStats(): Promise<{ inventoryValue: number; totalProduced: number }> {
    const ings = await db.select().from(ingredients);
    const inventoryValue = ings.reduce((sum, i) => sum + parseFloat(i.quantity) * parseFloat(i.costPerUnit), 0);
    const [row] = await db.select({ total: sql<string>`coalesce(sum(quantity), 0)` }).from(productionLogs);
    const totalProduced = parseInt(row?.total ?? "0");
    return { inventoryValue, totalProduced };
  }

  async deductIngredients(menuItemId: number, batchQty: number): Promise<{ ingredientId: number; deducted: number; remaining: string; cost: number }[]> {
    const links = await db.select().from(menuItemIngredients).where(eq(menuItemIngredients.menuItemId, menuItemId));
    const results = [];
    for (const link of links) {
      const deducted = parseFloat(link.quantityNeeded) * batchQty;
      const [ing] = await db.select().from(ingredients).where(eq(ingredients.id, link.ingredientId));
      if (ing) {
        const newQty = Math.max(0, parseFloat(ing.quantity) - deducted);
        const cost = deducted * parseFloat(ing.costPerUnit);
        await db.update(ingredients).set({ quantity: newQty.toFixed(2) }).where(eq(ingredients.id, ing.id));
        results.push({ ingredientId: ing.id, deducted, remaining: newQty.toFixed(2), cost });
      }
    }
    return results;
  }

  async getMenuItemIngredients(menuItemId: number): Promise<MenuItemIngredient[]> {
    return db.select().from(menuItemIngredients).where(eq(menuItemIngredients.menuItemId, menuItemId));
  }

  async setMenuItemIngredients(menuItemId: number, items: InsertMenuItemIngredient[]): Promise<MenuItemIngredient[]> {
    await db.delete(menuItemIngredients).where(eq(menuItemIngredients.menuItemId, menuItemId));
    if (items.length === 0) return [];
    const created = await db.insert(menuItemIngredients).values(items).returning();
    return created;
  }

  async getReceipts(): Promise<Receipt[]> {
    return db.select().from(receipts).orderBy(desc(receipts.date));
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, id));
    return receipt;
  }

  async createReceipt(receipt: InsertReceipt, items: InsertReceiptItem[]): Promise<Receipt & { items: ReceiptItem[] }> {
    const [created] = await db.insert(receipts).values(receipt).returning();
    const createdItems = items.length > 0
      ? await db.insert(receiptItems).values(items.map(i => ({ ...i, receiptId: created.id }))).returning()
      : [];
    return { ...created, items: createdItems };
  }

  async deleteReceipt(id: number): Promise<boolean> {
    await db.delete(receiptItems).where(eq(receiptItems.receiptId, id));
    await db.delete(receipts).where(eq(receipts.id, id));
    return true;
  }

  async getReceiptItems(receiptId: number): Promise<ReceiptItem[]> {
    return db.select().from(receiptItems).where(eq(receiptItems.receiptId, receiptId));
  }

  async getProfileSettings(): Promise<ProfileSettings> {
    const [settings] = await db.select().from(profileSettings);
    if (!settings) {
      const [created] = await db.insert(profileSettings).values({}).returning();
      return created;
    }
    return settings;
  }

  async getReports() {
    const allReceipts = await db.select().from(receipts).orderBy(desc(receipts.date));
    const allLogs = await db.select().from(productionLogs);
    const allExpenseRows = await db.select().from(expenses);

    const paidReceipts = allReceipts.filter(r => !r.isEmployeeMeal);
    const totalRevenue = paidReceipts.reduce((s, r) => s + parseFloat(r.total), 0);
    const totalIngredientCost = allLogs.reduce((s, l) => s + parseFloat(l.ingredientCost), 0);
    const totalExpenses = allExpenseRows.reduce((s, e) => s + parseFloat(e.total), 0);
    const netProfit = totalRevenue - totalIngredientCost - totalExpenses;

    return {
      summary: { totalRevenue, totalIngredientCost, totalExpenses, netProfit },
      receiptRows: allReceipts.map(r => ({
        id: r.id,
        date: r.date instanceof Date ? r.date.toISOString() : String(r.date),
        createdBy: r.createdBy,
        total: r.total,
        commission: (parseFloat(r.total) * 0.4).toFixed(2),
        isEmployeeMeal: r.isEmployeeMeal,
      })),
    };
  }

  async updateProfileSettings(settings: Partial<InsertProfileSettings>): Promise<ProfileSettings> {
    const existing = await this.getProfileSettings();
    const [updated] = await db.update(profileSettings).set(settings).where(eq(profileSettings.id, existing.id)).returning();
    return updated;
  }

  async getContractOrders(): Promise<ContractOrder[]> {
    return db.select().from(contractOrders).orderBy(desc(contractOrders.createdAt));
  }

  async getContractOrder(id: number): Promise<ContractOrder | undefined> {
    const [order] = await db.select().from(contractOrders).where(eq(contractOrders.id, id));
    return order;
  }

  async createContractOrder(order: InsertContractOrder): Promise<ContractOrder> {
    const [created] = await db.insert(contractOrders).values(order).returning();
    return created;
  }

  async updateContractOrder(id: number, order: Partial<InsertContractOrder>): Promise<ContractOrder | undefined> {
    const [updated] = await db.update(contractOrders).set(order).where(eq(contractOrders.id, id)).returning();
    return updated;
  }

  async deleteContractOrder(id: number): Promise<boolean> {
    await db.delete(contractOrders).where(eq(contractOrders.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
