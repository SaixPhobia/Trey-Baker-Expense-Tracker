import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIngredientSchema, insertMenuItemSchema, insertExpenseSchema, insertExpenseCategorySchema, insertOrderSchema, insertMenuItemIngredientSchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth, requireRole } from "./auth";
import bcrypt from "bcryptjs";

function getParamId(req: Request): number {
  return parseInt(req.params.id as string);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ INGREDIENTS ============
  app.get("/api/ingredients", requireAuth, async (req, res) => {
    const ingredients = await storage.getIngredients();
    res.json(ingredients);
  });

  app.post("/api/ingredients", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const parsed = insertIngredientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const ingredient = await storage.createIngredient(parsed.data);
    res.status(201).json(ingredient);
  });

  app.patch("/api/ingredients/:id", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const id = getParamId(req);
    const updated = await storage.updateIngredient(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.json(updated);
  });

  app.delete("/api/ingredients/:id", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const id = getParamId(req);
    await storage.deleteIngredient(id);
    res.status(204).send();
  });

  // ============ MENU ITEMS ============
  app.get("/api/menu-items", requireAuth, async (req, res) => {
    const items = await storage.getMenuItems();
    res.json(items);
  });

  app.post("/api/menu-items", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const parsed = insertMenuItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const item = await storage.createMenuItem(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/menu-items/:id", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const id = getParamId(req);
    const updated = await storage.updateMenuItem(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json(updated);
  });

  app.delete("/api/menu-items/:id", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const id = getParamId(req);
    await storage.deleteMenuItem(id);
    res.status(204).send();
  });

  // ============ EXPENSES ============
  app.get("/api/expenses", requireAuth, async (req, res) => {
    const expenses = await storage.getExpenses();
    res.json(expenses);
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    const parsed = insertExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const expense = await storage.createExpense(parsed.data);
    res.status(201).json(expense);
  });

  app.patch("/api/expenses/:id", requireAuth, async (req, res) => {
    const id = getParamId(req);
    const updated = await storage.updateExpense(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(updated);
  });

  app.delete("/api/expenses/:id", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const id = getParamId(req);
    await storage.deleteExpense(id);
    res.status(204).send();
  });

  // ============ EXPENSE CATEGORIES ============
  app.get("/api/expense-categories", requireAuth, async (req, res) => {
    const categories = await storage.getExpenseCategories();
    res.json(categories);
  });

  app.post("/api/expense-categories", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const parsed = insertExpenseCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const category = await storage.createExpenseCategory(parsed.data);
    res.status(201).json(category);
  });

  app.delete("/api/expense-categories/:id", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const id = getParamId(req);
    await storage.deleteExpenseCategory(id);
    res.status(204).send();
  });

  // ============ ORDERS ============
  app.get("/api/orders", requireAuth, async (req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    const parsed = insertOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const order = await storage.createOrder(parsed.data);
    res.status(201).json(order);
  });

  app.patch("/api/orders/:id", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const id = getParamId(req);
    const updated = await storage.updateOrder(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(updated);
  });

  app.delete("/api/orders/:id", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const id = getParamId(req);
    await storage.deleteOrder(id);
    res.status(204).send();
  });

  // ============ MENU ITEM INGREDIENTS ============
  app.get("/api/menu-items/:id/ingredients", requireAuth, async (req, res) => {
    const id = getParamId(req);
    const items = await storage.getMenuItemIngredients(id);
    res.json(items);
  });

  app.put("/api/menu-items/:id/ingredients", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const menuItemId = getParamId(req);
    const itemsSchema = z.array(z.object({
      ingredientId: z.number(),
      quantityNeeded: z.string(),
    }));
    const parsed = itemsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const items = parsed.data.map(i => ({
      menuItemId,
      ingredientId: i.ingredientId,
      quantityNeeded: i.quantityNeeded,
    }));
    const result = await storage.setMenuItemIngredients(menuItemId, items);
    res.json(result);
  });

  // ============ RECEIPTS ============
  app.get("/api/receipts", requireAuth, async (req, res) => {
    const allReceipts = await storage.getReceipts();
    res.json(allReceipts);
  });

  app.get("/api/receipts/:id", requireAuth, async (req, res) => {
    const id = getParamId(req);
    const receipt = await storage.getReceipt(id);
    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }
    const items = await storage.getReceiptItems(id);
    res.json({ ...receipt, items });
  });

  app.post("/api/receipts", requireAuth, async (req, res) => {
    const bodySchema = z.object({
      items: z.array(z.object({
        menuItemId: z.number().nullable().optional(),
        itemName: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.string(),
      })),
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const userId = (req.session as any).userId;
    const sessionUser = await storage.getUser(userId);
    const createdBy = sessionUser?.displayName || sessionUser?.username || "Staff";

    const serverItems = parsed.data.items.map(i => {
      const lineTotal = (parseFloat(i.unitPrice) * i.quantity).toFixed(2);
      return {
        menuItemId: i.menuItemId ?? null,
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal,
        receiptId: 0,
      };
    });
    const subtotal = serverItems.reduce((s, i) => s + parseFloat(i.lineTotal), 0);
    const total = subtotal;

    const receipt = await storage.createReceipt({
      subtotal: subtotal.toFixed(2),
      tax: "0.00",
      total: total.toFixed(2),
      createdBy,
      status: "Completed",
    }, serverItems);
    res.status(201).json(receipt);
  });

  app.delete("/api/receipts/:id", requireAuth, requireRole("Owner", "Manager"), async (req, res) => {
    const id = getParamId(req);
    await storage.deleteReceipt(id);
    res.status(204).send();
  });

  // ============ PROFILE SETTINGS ============
  app.get("/api/profile", requireAuth, async (req, res) => {
    const settings = await storage.getProfileSettings();
    res.json(settings);
  });

  app.patch("/api/profile", requireAuth, requireRole("Owner"), async (req, res) => {
    const updated = await storage.updateProfileSettings(req.body);
    res.json(updated);
  });

  // ============ TEAM MANAGEMENT ============
  app.get("/api/team", requireAuth, requireRole("Owner"), async (req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      password: u.password,
    })));
  });

  app.patch("/api/team/:id/role", requireAuth, requireRole("Owner"), async (req, res) => {
    const { role } = req.body;
    if (!["Owner", "Manager", "Staff"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const updated = await storage.updateUserRole(req.params.id as string, role);
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      role: updated.role,
    });
  });

  app.delete("/api/team/:id", requireAuth, requireRole("Owner"), async (req, res) => {
    const targetId = req.params.id as string;
    if (targetId === (req.session as any).userId) {
      return res.status(400).json({ error: "Cannot remove yourself" });
    }
    const deleted = await storage.deleteUser(targetId);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(204).end();
  });

  app.patch("/api/team/:id/password", requireAuth, requireRole("Owner"), async (req, res) => {
    const { password } = req.body;
    if (!password || typeof password !== "string" || password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }
    const updated = await storage.updateUserPassword(req.params.id as string, password);
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true });
  });

  // ============ FORGOT PASSWORD ============
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "No account found with that username" });
    }
    if (user.password?.startsWith("$2")) {
      return res.status(400).json({ error: "This account has an encrypted password. Please use the reset option below to set a new one." });
    }
    res.json({ password: user.password });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.status(400).json({ error: "Username and new password are required" });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "No account found with that username" });
    }
    await storage.updateUserPassword(user.id, newPassword);
    res.json({ success: true });
  });

  // ============ CSV EXPORT ============
  app.get("/api/expenses/export", requireAuth, async (req, res) => {
    const expenses = await storage.getExpenses();
    const headers = ["ID", "Date", "Submitted By", "Category", "Description", "Qty", "Unit Cost", "Total", "Status", "Reimbursement"];
    const rows = expenses.map(exp => [
      exp.id,
      new Date(exp.date).toLocaleDateString(),
      exp.submittedBy,
      exp.category,
      exp.description,
      exp.quantity,
      exp.amount,
      (parseFloat(exp.quantity) * parseFloat(exp.amount)).toFixed(2),
      exp.status,
      exp.reimbursement
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
    res.send(csv);
  });

  return httpServer;
}
