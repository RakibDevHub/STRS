const http = require("http");
const url = require("url");
const oracledb = require("oracledb");
const crypto = require("crypto");
const fs = require("fs");
const pathModule = require("path");
require("dotenv").config();

const PORT = 5000;

// Import route modules
const authRoutes = require("./routes/auth");
const publicRoutes = require("./routes/public");
const userTripRoutes = require("./routes/user-trips");
const adminRoutes = require("./routes/admin");

// ==================== HELPER FUNCTIONS ====================

async function getConnection() {
  try {
    const connection = await oracledb.getConnection({
      user: process.env.DB_USER || "tourism_user",
      password: process.env.DB_PASSWORD || "tourism123",
      connectionString:
        process.env.DB_CONNECTION_STRING || "localhost:1521/XEPDB1",
    });
    return connection;
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return { salt, hash };
}

function verifyPassword(password, hash, salt) {
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return hash === verifyHash;
}

function generateToken(userId, email, role) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      email,
      role,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }),
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", process.env.TOKEN_SECRET || "your-secret-key")
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split(".");
    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.TOKEN_SECRET || "211010231211010243211010236",
      )
      .update(`${header}.${payload}`)
      .digest("base64url");
    if (signature !== expectedSignature) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (decoded.exp < Date.now()) return null;
    return decoded;
  } catch (error) {
    return null;
  }
}

function verifyAdmin(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    sendJSON(res, 401, { success: false, error: "No token provided" });
    return false;
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded || decoded.role !== "admin") {
    sendJSON(res, 403, { success: false, error: "Access denied. Admin only." });
    return false;
  }

  return true;
}

function parseMultipart(buffer, boundary) {
  const result = { fields: {}, files: {} };
  const fullContent = buffer.toString("binary");
  const parts = fullContent.split(`--${boundary}`);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part || part.trim() === "" || part === "--\r\n") continue;

    const headerEndIndex = part.indexOf("\r\n\r\n");
    if (headerEndIndex === -1) continue;

    const headersStr = part.substring(0, headerEndIndex);
    let contentStr = part.substring(headerEndIndex + 4);

    if (contentStr.endsWith("\r\n")) {
      contentStr = contentStr.substring(0, contentStr.length - 2);
    }

    const headers = headersStr.split("\r\n");
    let fieldName = null;
    let filename = null;
    let contentType = null;

    for (const header of headers) {
      const dispositionMatch = header.match(
        /Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/i,
      );
      if (dispositionMatch) {
        fieldName = dispositionMatch[1];
        filename = dispositionMatch[2];
      }

      const contentTypeMatch = header.match(/Content-Type: ([^\r\n]+)/i);
      if (contentTypeMatch) {
        contentType = contentTypeMatch[1];
      }
    }

    if (!fieldName) continue;

    if (filename) {
      const fileBuffer = Buffer.from(contentStr, "binary");
      result.files[fieldName] = {
        filename: filename,
        contentType: contentType || "application/octet-stream",
        data: fileBuffer,
      };
    } else {
      result.fields[fieldName] = contentStr;
    }
  }

  return result;
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function parseURL(req) {
  return new URL(req.url, `http://${req.headers.host}`);
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// ==================== CREATE SERVER ====================
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = parseURL(req);
  const path = parsedUrl.pathname;

  // STATIC FILE SERVING
  if (
    path.startsWith("/destinations/") ||
    path.startsWith("/hotels/") ||
    path.startsWith("/users/")
  ) {
    const filePath = pathModule.join(__dirname, "uploads", path);

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.writeHead(404);
        res.end("Image not found");
        return;
      }

      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          res.writeHead(500);
          res.end("Error loading image");
          return;
        }

        const ext = pathModule.extname(filePath).toLowerCase();
        const contentType =
          {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
          }[ext] || "image/jpeg";

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      });
    });
    return;
  }

  // TEST ROUTE
  if (path === "/" && req.method === "GET") {
    sendJSON(res, 200, { message: "Smart Tourism API", status: "running" });
    return;
  }

  // TEST DATABASE
  else if (path === "/api/test" && req.method === "GET") {
    let connection;
    try {
      connection = await getConnection();
      await connection.close();
      sendJSON(res, 200, { success: true, message: "Database connected" });
    } catch (error) {
      sendJSON(res, 500, { success: false, error: error.message });
    }
    return;
  }

  // ==================== ROUTES ====================
  
  // Auth routes
  if (await authRoutes(req, res, parsedUrl, path, {
    getConnection, hashPassword, verifyPassword, generateToken, verifyToken,
    getRequestBody, sendJSON, parseMultipart, verifyAdmin
  })) return;

  // Public routes
  if (await publicRoutes(req, res, parsedUrl, path, {
    getConnection, getRequestBody, sendJSON
  })) return;

  // User trip routes
  if (await userTripRoutes(req, res, parsedUrl, path, {
    getConnection, getRequestBody, sendJSON, verifyToken
  })) return;

  // Admin routes
  if (await adminRoutes(req, res, parsedUrl, path, {
    getConnection, getRequestBody, sendJSON, verifyAdmin, parseMultipart
  })) return;

  // 404
  sendJSON(res, 404, { error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

getConnection()
  .then((conn) => {
    console.log("✅ Database connected");
    conn.close();
  })
  .catch(() => console.log("❌ Database connection failed"));