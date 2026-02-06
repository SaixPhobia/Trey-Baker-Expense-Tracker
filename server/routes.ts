import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIngredientSchema, insertMenuItemSchema, insertExpenseSchema, insertExpenseCategorySchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ INGREDIENTS ============
  app.get("/api/ingredients", async (req, res) => {
    const ingredients = await storage.getIngredients();
    res.json(ingredients);
  });

  app.post("/api/ingredients", async (req, res) => {
    const parsed = insertIngredientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const ingredient = await storage.createIngredient(parsed.data);
    res.status(201).json(ingredient);
  });

  app.patch("/api/ingredients/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateIngredient(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.json(updated);
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteIngredient(id);
    res.status(204).send();
  });

  // ============ MENU ITEMS ============
  app.get("/api/menu-items", async (req, res) => {
    const items = await storage.getMenuItems();
    res.json(items);
  });

  app.post("/api/menu-items", async (req, res) => {
    const parsed = insertMenuItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const item = await storage.createMenuItem(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/menu-items/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateMenuItem(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json(updated);
  });

  app.delete("/api/menu-items/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMenuItem(id);
    res.status(204).send();
  });

  // ============ EXPENSES ============
  app.get("/api/expenses", async (req, res) => {
    const expenses = await storage.getExpenses();
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    const parsed = insertExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const expense = await storage.createExpense(parsed.data);
    res.status(201).json(expense);
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateExpense(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(updated);
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteExpense(id);
    res.status(204).send();
  });

  // ============ EXPENSE CATEGORIES ============
  app.get("/api/expense-categories", async (req, res) => {
    const categories = await storage.getExpenseCategories();
    res.json(categories);
  });

  app.post("/api/expense-categories", async (req, res) => {
    const parsed = insertExpenseCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const category = await storage.createExpenseCategory(parsed.data);
    res.status(201).json(category);
  });

  app.delete("/api/expense-categories/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteExpenseCategory(id);
    res.status(204).send();
  });

  // ============ PROFILE SETTINGS ============
  app.get("/api/profile", async (req, res) => {
    const settings = await storage.getProfileSettings();
    res.json(settings);
  });

  app.patch("/api/profile", async (req, res) => {
    const updated = await storage.updateProfileSettings(req.body);
    res.json(updated);
  });

  // ============ CSV EXPORT ============
  app.get("/api/expenses/export", async (req, res) => {
    const expenses = await storage.getExpenses();
    const headers = ["ID", "Date", "Category", "Description", "Amount", "Status", "Reimbursement"];
    const rows = expenses.map(exp => [
      exp.id,
      new Date(exp.date).toLocaleDateString(),
      exp.category,
      exp.description,
      exp.amount,
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
