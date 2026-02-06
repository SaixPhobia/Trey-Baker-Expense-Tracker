import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { Role } from "@shared/schema";

const PgSession = connectPgSimple(session);

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  app.use(
    session({
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: "sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "trey-baker-dev-secret-key-2026",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
      },
      proxy: isProduction,
    })
  );

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { username, password, displayName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await storage.getUserCount();
    const role = userCount === 0 ? "Owner" : "Staff";

    const user = await storage.createUserWithRole({
      username,
      password: hashedPassword,
      displayName: displayName || username,
    }, role);

    (req.session as any).userId = user.id;

    res.status(201).json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    (req.session as any).userId = user.id;

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!roles.includes(user.role as Role)) {
      return res.status(403).json({ error: "You don't have permission to do this" });
    }

    next();
  };
}
