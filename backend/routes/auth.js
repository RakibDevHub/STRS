module.exports = async (req, res, parsedUrl, path, helpers) => {
  const {
    getConnection,
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    getRequestBody,
    sendJSON,
    parseMultipart,
    pathModule,
    fs,
  } = helpers;

  // REGISTER
  if (path === "/api/register" && req.method === "POST") {
    try {
      const body = await getRequestBody(req);
      const { full_name, email, password, phone } = body;

      if (!full_name || !email || !password) {
        sendJSON(res, 400, {
          success: false,
          error: "Name, email and password are required",
        });
        return true;
      }

      if (password.length < 6) {
        sendJSON(res, 400, {
          success: false,
          error: "Password must be at least 6 characters",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const checkResult = await connection.execute(
          `SELECT email FROM users WHERE email = :email`,
          [email],
        );

        if (checkResult.rows.length > 0) {
          sendJSON(res, 400, {
            success: false,
            error: "Email already registered",
          });
          return true;
        }

        const { salt, hash } = hashPassword(password);

        const result = await connection.execute(
          `INSERT INTO users (full_name, email, password, salt, phone, created_date, user_role) 
           VALUES (:full_name, :email, :password, :salt, :phone, SYSDATE, 'traveler')
           RETURNING user_id INTO :user_id`,
          {
            full_name,
            email,
            password: hash,
            salt,
            phone: phone || null,
            user_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: true },
        );

        sendJSON(res, 201, {
          success: true,
          message: "User registered successfully",
          userId: result.outBinds.user_id[0],
        });
        return true;
      } catch (dbError) {
        console.error("Database error:", dbError);
        sendJSON(res, 500, { success: false, error: "Database error" });
        return true;
      } finally {
        if (connection) await connection.close();
      }
    } catch (error) {
      sendJSON(res, 400, { success: false, error: "Invalid request data" });
      return true;
    }
  }

  // LOGIN
  else if (path === "/api/login" && req.method === "POST") {
    try {
      const body = await getRequestBody(req);
      const { email, password } = body;

      if (!email || !password) {
        sendJSON(res, 400, {
          success: false,
          error: "Email and password are required",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const result = await connection.execute(
          `SELECT user_id, full_name, email, phone, password, salt, user_role 
           FROM users WHERE email = :email`,
          [email],
        );

        if (result.rows.length === 0) {
          sendJSON(res, 401, {
            success: false,
            error: "Invalid email or password",
          });
          return true;
        }

        const user = result.rows[0];
        const storedHash = user[4];
        const salt = user[5];

        if (!verifyPassword(password, storedHash, salt)) {
          sendJSON(res, 401, {
            success: false,
            error: "Invalid email or password",
          });
          return true;
        }

        const token = generateToken(user[0], user[2], user[6]);

        sendJSON(res, 200, {
          success: true,
          message: "Login successful",
          token,
          user: {
            id: user[0],
            name: user[1],
            email: user[2],
            phone: user[3],
            role: user[6],
          },
        });
        return true;
      } catch (dbError) {
        console.error("Database error:", dbError);
        sendJSON(res, 500, { success: false, error: "Database error" });
        return true;
      } finally {
        if (connection) await connection.close();
      }
    } catch (error) {
      sendJSON(res, 400, { success: false, error: "Invalid request data" });
      return true;
    }
  }

  // VERIFY TOKEN
  else if (path === "/api/verify" && req.method === "POST") {
    try {
      const body = await getRequestBody(req);
      const { token } = body;

      if (!token) {
        sendJSON(res, 401, { success: false, error: "No token provided" });
        return true;
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        sendJSON(res, 401, {
          success: false,
          error: "Invalid or expired token",
        });
        return true;
      }

      sendJSON(res, 200, { success: true, user: decoded });
      return true;
    } catch (error) {
      console.error("Verify error:", error);
      sendJSON(res, 400, { success: false, error: "Invalid request" });
      return true;
    }
  }

  // GET USER PROFILE
  else if (path.startsWith("/api/users/") && req.method === "GET") {
    const userId = path.split("/")[3];

    if (!userId) {
      sendJSON(res, 400, { success: false, error: "User ID required" });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();

      const userResult = await connection.execute(
        `SELECT user_id, full_name, email, phone, created_date, user_image, user_role
         FROM users WHERE user_id = :user_id`,
        [userId],
      );

      if (userResult.rows.length === 0) {
        sendJSON(res, 404, { success: false, error: "User not found" });
        return true;
      }

      const user = userResult.rows[0];

      const userData = {
        id: user[0],
        name: user[1],
        email: user[2],
        phone: user[3],
        joined: user[4],
        userImage: user[5],
        role: user[6],
      };

      // Get trip statistics
      const tripStats = await connection.execute(
        `SELECT 
          COUNT(*) as total_trips,
          SUM(CASE WHEN booking_status = 'booked' AND travel_date < SYSDATE THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN booking_status = 'booked' AND travel_date >= SYSDATE THEN 1 ELSE 0 END) as upcoming,
          SUM(CASE WHEN booking_status = 'planned' THEN 1 ELSE 0 END) as draft_plans,
          SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_plans
        FROM user_trip_plans
        WHERE user_id = :user_id`,
        [userId],
      );

      const stats = tripStats.rows[0] || [0, 0, 0, 0, 0];

      const userStats = {
        totalTrips: stats[0] || 0,
        completed: stats[1] || 0,
        upcoming: stats[2] || 0,
        draftPlans: stats[3] || 0,
        cancelledPlans: stats[4] || 0,
      };

      sendJSON(res, 200, {
        success: true,
        user: { ...userData, stats: userStats },
      });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // UPDATE USER PROFILE
  else if (
    path.startsWith("/api/users/") &&
    req.method === "PUT" &&
    !path.includes("/password")
  ) {
    const userId = path.split("/")[3];

    if (!userId) {
      sendJSON(res, 400, { success: false, error: "User ID required" });
      return true;
    }

    try {
      const body = await getRequestBody(req);
      const { full_name, email, phone } = body;

      let connection;
      try {
        connection = await getConnection();

        if (email) {
          const checkResult = await connection.execute(
            `SELECT user_id FROM users WHERE email = :email AND user_id != :user_id`,
            [email, userId],
          );
          if (checkResult.rows.length > 0) {
            sendJSON(res, 400, {
              success: false,
              error: "Email already in use",
            });
            return true;
          }
        }

        let updates = [];
        let binds = { user_id: userId };

        if (full_name) {
          updates.push("full_name = :full_name");
          binds.full_name = full_name;
        }
        if (email) {
          updates.push("email = :email");
          binds.email = email;
        }
        if (phone !== undefined) {
          updates.push("phone = :phone");
          binds.phone = phone || null;
        }

        if (updates.length === 0) {
          sendJSON(res, 400, { success: false, error: "No fields to update" });
          return true;
        }

        const query = `UPDATE users SET ${updates.join(", ")} WHERE user_id = :user_id`;
        await connection.execute(query, binds, { autoCommit: true });

        sendJSON(res, 200, {
          success: true,
          message: "Profile updated successfully",
        });
        return true;
      } catch (dbError) {
        console.error("Database error:", dbError);
        sendJSON(res, 500, { success: false, error: "Database error" });
        return true;
      } finally {
        if (connection) await connection.close();
      }
    } catch (error) {
      sendJSON(res, 400, { success: false, error: "Invalid request data" });
      return true;
    }
  }

  // CHANGE PASSWORD
  else if (
    path.startsWith("/api/users/") &&
    req.method === "PUT" &&
    path.includes("/password")
  ) {
    const userId = path.split("/")[3];

    if (!userId) {
      sendJSON(res, 400, { success: false, error: "User ID required" });
      return true;
    }

    try {
      const body = await getRequestBody(req);
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        sendJSON(res, 400, {
          success: false,
          error: "Current password and new password required",
        });
        return true;
      }

      if (newPassword.length < 6) {
        sendJSON(res, 400, {
          success: false,
          error: "New password must be at least 6 characters",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const result = await connection.execute(
          `SELECT password, salt FROM users WHERE user_id = :user_id`,
          [userId],
        );

        if (result.rows.length === 0) {
          sendJSON(res, 404, { success: false, error: "User not found" });
          return true;
        }

        const [storedHash, salt] = result.rows[0];

        if (!verifyPassword(currentPassword, storedHash, salt)) {
          sendJSON(res, 401, {
            success: false,
            error: "Current password is incorrect",
          });
          return true;
        }

        const { salt: newSalt, hash: newHash } = hashPassword(newPassword);

        await connection.execute(
          `UPDATE users SET password = :password, salt = :salt WHERE user_id = :user_id`,
          { password: newHash, salt: newSalt, user_id: userId },
          { autoCommit: true },
        );

        sendJSON(res, 200, {
          success: true,
          message: "Password changed successfully",
        });
        return true;
      } catch (dbError) {
        console.error("Database error:", dbError);
        sendJSON(res, 500, { success: false, error: "Database error" });
        return true;
      } finally {
        if (connection) await connection.close();
      }
    } catch (error) {
      sendJSON(res, 400, { success: false, error: "Invalid request data" });
      return true;
    }
  }

  // UPLOAD USER IMAGE
  else if (path === "/api/users/upload-image" && req.method === "POST") {
    try {
      const contentType = req.headers["content-type"] || "";
      const boundary = contentType.split("boundary=")[1];

      if (!boundary) {
        sendJSON(res, 400, { success: false, error: "Invalid content type" });
        return true;
      }

      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", async () => {
        try {
          const fullBody = Buffer.concat(chunks);
          const formData = parseMultipart(fullBody, boundary);

          const imageFile = formData.files?.image;
          const userId = formData.fields?.userId;

          if (!imageFile) {
            sendJSON(res, 400, {
              success: false,
              error: "Image file is required",
            });
            return;
          }

          if (!userId) {
            sendJSON(res, 400, {
              success: false,
              error: "User ID is required",
            });
            return;
          }

          const validTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
          ];
          if (!validTypes.includes(imageFile.contentType)) {
            sendJSON(res, 400, { success: false, error: "Invalid file type" });
            return;
          }

          if (imageFile.data.length > 5 * 1024 * 1024) {
            sendJSON(res, 400, {
              success: false,
              error: "File too large. Max 5MB",
            });
            return;
          }

          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 8);
          const ext = pathModule.extname(imageFile.filename) || ".jpg";
          const filename = `user-${userId}-${timestamp}-${random}${ext}`;

          const uploadDir = pathModule.join(__dirname, "uploads/users");
          const filePath = pathModule.join(uploadDir, filename);

          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          let connection;
          try {
            connection = await getConnection();

            const currentResult = await connection.execute(
              `SELECT user_image FROM users WHERE user_id = :user_id`,
              [userId],
            );

            if (currentResult.rows.length > 0) {
              const oldImagePath = currentResult.rows[0][0];
              if (oldImagePath) {
                const oldFilePath = pathModule.join(
                  __dirname,
                  "uploads",
                  oldImagePath,
                );
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
              }
            }

            fs.writeFileSync(filePath, imageFile.data);
            const imagePath = `/users/${filename}`;

            await connection.execute(
              `UPDATE users SET user_image = :image_path WHERE user_id = :user_id`,
              { image_path: imagePath, user_id: userId },
              { autoCommit: true },
            );

            sendJSON(res, 200, {
              success: true,
              message: "Image uploaded successfully",
              imagePath,
            });
          } catch (dbError) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            console.error("Database error:", dbError);
            sendJSON(res, 500, { success: false, error: "Database error" });
          } finally {
            if (connection) await connection.close();
          }
        } catch (parseError) {
          console.error("Parse error:", parseError);
          sendJSON(res, 400, { success: false, error: "Error parsing upload" });
        }
      });
      return true;
    } catch (error) {
      console.error("Upload error:", error);
      sendJSON(res, 500, { success: false, error: "Server error" });
      return true;
    }
  }

  // REMOVE USER IMAGE
  else if (path === "/api/users/remove-image" && req.method === "POST") {
    try {
      const body = await getRequestBody(req);
      const { userId } = body;

      if (!userId) {
        sendJSON(res, 400, { success: false, error: "User ID required" });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const result = await connection.execute(
          `SELECT user_image FROM users WHERE user_id = :user_id`,
          [userId],
        );

        if (result.rows.length === 0) {
          sendJSON(res, 404, { success: false, error: "User not found" });
          return true;
        }

        const currentImage = result.rows[0][0];

        if (currentImage) {
          const filePath = pathModule.join(__dirname, "uploads", currentImage);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await connection.execute(
          `UPDATE users SET user_image = NULL WHERE user_id = :user_id`,
          [userId],
          { autoCommit: true },
        );

        sendJSON(res, 200, {
          success: true,
          message: "Image removed successfully",
        });
        return true;
      } catch (dbError) {
        console.error("Database error:", dbError);
        sendJSON(res, 500, { success: false, error: "Database error" });
        return true;
      } finally {
        if (connection) await connection.close();
      }
    } catch (error) {
      console.error("Request error:", error);
      sendJSON(res, 400, { success: false, error: "Invalid request" });
      return true;
    }
  }

  return false;
};
