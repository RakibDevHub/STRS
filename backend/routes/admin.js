module.exports = async (req, res, parsedUrl, path, helpers) => {
  const {
    getConnection,
    getRequestBody,
    sendJSON,
    verifyAdmin,
    parseMultipart,
  } = helpers;

  // DASHBOARD STATS
  if (path === "/api/admin/stats" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const usersResult = await connection.execute(
        `SELECT COUNT(*) FROM users WHERE user_role = 'traveler'`,
      );
      const totalUsers = usersResult.rows[0][0];

      const bookingsResult = await connection.execute(
        `SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'`,
      );
      const totalBookings = bookingsResult.rows[0][0];

      const tripsResult = await connection.execute(
        `SELECT COUNT(*) FROM user_trip_plans`,
      );
      const totalTrips = tripsResult.rows[0][0];

      const revenueResult = await connection.execute(
        `SELECT SUM(payment_amount) FROM bookings WHERE status = 'confirmed'`,
      );
      const totalRevenue = revenueResult.rows[0][0] || 0;

      const recentResult = await connection.execute(
        `SELECT 
          b.booking_id, 
          u.full_name,
          d.name as destination,
          b.booking_date,
          b.payment_amount,
          b.status
        FROM bookings b
        JOIN users u ON b.user_id = u.user_id
        JOIN destinations d ON b.destination_id = d.dest_id
        WHERE ROWNUM <= 5
        ORDER BY b.booking_date DESC`,
      );

      const recentBookings = recentResult.rows.map((row) => ({
        id: row[0],
        userName: row[1],
        destination: row[2],
        date: row[3],
        amount: row[4],
        status: row[5],
      }));

      const popularResult = await connection.execute(
        `SELECT 
          d.name,
          COUNT(b.booking_id) AS booking_count,
          SUM(b.payment_amount) AS revenue
        FROM destinations d
        LEFT JOIN bookings b ON d.dest_id = b.destination_id AND b.status = 'confirmed'
        GROUP BY d.name
        ORDER BY booking_count DESC
        FETCH FIRST 5 ROWS ONLY`,
      );

      const popularDestinations = popularResult.rows.map((row) => ({
        name: row[0],
        bookings: row[1] || 0,
        revenue: row[2] || 0,
        icon: "🏝️",
      }));

      sendJSON(res, 200, {
        success: true,
        stats: {
          totalUsers,
          totalBookings,
          totalTrips,
          totalRevenue,
          recentBookings,
          popularDestinations,
        },
      });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET ALL USERS
  else if (path === "/api/admin/users" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT user_id, full_name, email, phone, created_date, user_role
         FROM users
         ORDER BY created_date DESC`,
      );

      const users = result.rows.map((row) => ({
        id: row[0],
        name: row[1],
        email: row[2],
        phone: row[3],
        joined: row[4],
        role: row[5] || "traveler",
      }));

      sendJSON(res, 200, { success: true, users });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // UPDATE USER ROLE
  else if (
    path.startsWith("/api/admin/users/") &&
    path.endsWith("/role") &&
    req.method === "PUT"
  ) {
    const admin = verifyAdmin(req, res);
    if (!admin) return true;

    const userId = path.split("/")[4];

    try {
      const body = await getRequestBody(req);
      const { role } = body;

      if (!role || !["traveler", "admin"].includes(role)) {
        sendJSON(res, 400, { success: false, error: "Valid role required" });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        await connection.execute(
          `UPDATE users SET user_role = :role WHERE user_id = :user_id`,
          { role, user_id: userId },
          { autoCommit: true },
        );

        sendJSON(res, 200, { success: true, message: "User role updated" });
        return true;
      } catch (dbError) {
        console.error("Database error:", dbError);
        sendJSON(res, 500, { success: false, error: "Database error" });
        return true;
      } finally {
        if (connection) await connection.close();
      }
    } catch (error) {
      sendJSON(res, 400, { success: false, error: "Invalid request" });
      return true;
    }
  }

  // DELETE USER
  else if (
    path.startsWith("/api/admin/users/") &&
    !path.endsWith("/role") &&
    req.method === "DELETE"
  ) {
    const admin = verifyAdmin(req, res);
    if (!admin) return true;

    const userId = path.split("/")[4];

    let connection;
    try {
      connection = await getConnection();

      if (parseInt(userId) === admin.userId) {
        sendJSON(res, 400, {
          success: false,
          error: "Cannot delete your own account",
        });
        return true;
      }

      const result = await connection.execute(
        `DELETE FROM users WHERE user_id = :user_id AND user_role != 'admin'`,
        [userId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, {
          success: false,
          error: "User not found or is admin",
        });
        return true;
      }

      sendJSON(res, 200, { success: true, message: "User deleted" });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET ALL INTERESTS
  else if (path === "/api/admin/interests" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT interest_id, name, icon FROM interests ORDER BY name`,
      );

      const interests = result.rows.map((row) => ({
        id: row[0],
        name: row[1],
        icon: row[2],
      }));

      sendJSON(res, 200, { success: true, interests });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // CREATE INTEREST
  else if (path === "/api/admin/interests" && req.method === "POST") {
    if (!verifyAdmin(req, res)) return true;

    try {
      const body = await getRequestBody(req);
      const { name, icon } = body;

      if (!name || !icon) {
        sendJSON(res, 400, {
          success: false,
          error: "Name and icon are required",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const checkResult = await connection.execute(
          `SELECT interest_id FROM interests WHERE name = :name`,
          [name],
        );

        if (checkResult.rows.length > 0) {
          sendJSON(res, 400, {
            success: false,
            error: "Interest already exists",
          });
          return true;
        }

        const result = await connection.execute(
          `INSERT INTO interests (name, icon) 
           VALUES (:name, :icon) 
           RETURNING interest_id INTO :interest_id`,
          {
            name,
            icon,
            interest_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: true },
        );

        sendJSON(res, 201, {
          success: true,
          message: "Interest created successfully",
          id: result.outBinds.interest_id[0],
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
      sendJSON(res, 400, { success: false, error: "Invalid request data" });
      return true;
    }
  }

  // UPDATE INTEREST
  else if (path.startsWith("/api/admin/interests/") && req.method === "PUT") {
    if (!verifyAdmin(req, res)) return true;

    const interestId = path.split("/")[4];

    try {
      const body = await getRequestBody(req);
      const { name, icon } = body;

      if (!name || !icon) {
        sendJSON(res, 400, {
          success: false,
          error: "Name and icon are required",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const checkResult = await connection.execute(
          `SELECT interest_id FROM interests WHERE name = :name AND interest_id != :interest_id`,
          [name, interestId],
        );

        if (checkResult.rows.length > 0) {
          sendJSON(res, 400, {
            success: false,
            error: "Interest name already exists",
          });
          return true;
        }

        await connection.execute(
          `UPDATE interests SET name = :name, icon = :icon WHERE interest_id = :interest_id`,
          { name, icon, interest_id: interestId },
          { autoCommit: true },
        );

        sendJSON(res, 200, {
          success: true,
          message: "Interest updated successfully",
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
      sendJSON(res, 400, { success: false, error: "Invalid request data" });
      return true;
    }
  }

  // DELETE INTEREST
  else if (
    path.startsWith("/api/admin/interests/") &&
    req.method === "DELETE"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const interestId = path.split("/")[4];

    let connection;
    try {
      connection = await getConnection();

      const checkResult = await connection.execute(
        `SELECT COUNT(*) FROM destination_interests WHERE interest_id = :interest_id`,
        [interestId],
      );

      if (checkResult.rows[0][0] > 0) {
        sendJSON(res, 400, {
          success: false,
          error:
            "Cannot delete interest that is assigned to destinations. Remove it from destinations first.",
        });
        return true;
      }

      const result = await connection.execute(
        `DELETE FROM interests WHERE interest_id = :interest_id`,
        [interestId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, { success: false, error: "Interest not found" });
        return true;
      }

      sendJSON(res, 200, {
        success: true,
        message: "Interest deleted successfully",
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

  // GET ALL DESTINATIONS
  else if (path === "/api/admin/destinations" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const destResult = await connection.execute(
        `SELECT 
          d.dest_id, d.name, d.location, d.description, d.best_time_to_visit, 
          d.image_url, d.distance_from_dhaka
        FROM destinations d
        ORDER BY d.name`,
      );

      const destinations = [];

      for (const row of destResult.rows) {
        const destId = row[0];

        const interestResult = await connection.execute(
          `SELECT i.interest_id, i.name, i.icon
           FROM interests i
           JOIN destination_interests di ON i.interest_id = di.interest_id
           WHERE di.dest_id = :dest_id
           ORDER BY i.name`,
          [destId],
        );

        const interests = interestResult.rows.map((r) => ({
          id: r[0],
          name: r[1],
          icon: r[2],
        }));

        // Get rating info
        const ratingResult = await connection.execute(
          `SELECT COALESCE(AVG(rating), 0), COUNT(*) FROM ratings WHERE dest_id = :dest_id`,
          [destId],
        );

        destinations.push({
          id: destId,
          name: row[1],
          location: row[2],
          description: row[3],
          best_time: row[4],
          image: row[5],
          distance: row[6],
          rating: parseFloat(ratingResult.rows[0][0] || 0),
          reviewCount: ratingResult.rows[0][1] || 0,
          interests: interests,
        });
      }

      sendJSON(res, 200, { success: true, destinations });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // CREATE DESTINATION
  else if (path === "/api/admin/destinations" && req.method === "POST") {
    if (!verifyAdmin(req, res)) return true;

    try {
      const boundary = req.headers["content-type"]?.split("boundary=")[1];
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

          const {
            name,
            location,
            description,
            best_time,
            distance,
            interestIds,
          } = formData.fields;
          const imageFile = formData.files?.image;

          if (!name || !location || !description || !best_time || !distance) {
            sendJSON(res, 400, {
              success: false,
              error: "Missing required fields",
            });
            return;
          }

          const interestIdArray = interestIds
            ? interestIds.split(",").map((id) => parseInt(id))
            : [];
          let imagePath = null;

          if (imageFile) {
            const ext = pathModule.extname(imageFile.filename) || ".jpg";
            const filename = `dest-${Date.now()}${ext}`;
            const uploadDir = pathModule.join(
              __dirname,
              "uploads/destinations",
            );
            const filePath = pathModule.join(uploadDir, filename);

            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }

            fs.writeFileSync(filePath, imageFile.data);
            imagePath = `/destinations/${filename}`;
          }

          let connection;
          try {
            connection = await getConnection();
            await connection.execute(`SET TRANSACTION READ WRITE`);

            const result = await connection.execute(
              `INSERT INTO destinations (
                name, location, description, best_time_to_visit, image_url, distance_from_dhaka
              ) VALUES (
                :name, :location, :description, :best_time, :image_url, :distance
              ) RETURNING dest_id INTO :dest_id`,
              {
                name,
                location,
                description,
                best_time,
                image_url: imagePath,
                distance,
                dest_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
              },
              { autoCommit: false },
            );

            const destId = result.outBinds.dest_id[0];

            for (const interestId of interestIdArray) {
              await connection.execute(
                `INSERT INTO destination_interests (dest_id, interest_id) VALUES (:dest_id, :interest_id)`,
                [destId, interestId],
                { autoCommit: false },
              );
            }

            await connection.commit();

            sendJSON(res, 201, {
              success: true,
              message: "Destination created",
              id: destId,
            });
          } catch (dbError) {
            if (connection) await connection.rollback();
            console.error("Database error:", dbError);
            sendJSON(res, 500, { success: false, error: "Database error" });
          } finally {
            if (connection) await connection.close();
          }
        } catch (parseError) {
          console.error("Parse error:", parseError);
          sendJSON(res, 400, {
            success: false,
            error: "Error parsing form data",
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Request error:", error);
      sendJSON(res, 500, { success: false, error: "Server error" });
      return true;
    }
  }

  // UPDATE DESTINATION
  else if (
    path.startsWith("/api/admin/destinations/") &&
    req.method === "PUT"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const destId = path.split("/")[4];

    try {
      const boundary = req.headers["content-type"]?.split("boundary=")[1];
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

          const {
            name,
            location,
            description,
            best_time,
            distance,
            interestIds,
          } = formData.fields;
          const imageFile = formData.files?.image;

          const interestIdArray = interestIds
            ? interestIds.split(",").map((id) => parseInt(id))
            : [];

          let connection;
          try {
            connection = await getConnection();
            await connection.execute(`SET TRANSACTION READ WRITE`);

            let imagePath = null;
            if (imageFile) {
              const oldResult = await connection.execute(
                `SELECT image_url FROM destinations WHERE dest_id = :dest_id`,
                [destId],
              );

              if (oldResult.rows.length > 0 && oldResult.rows[0][0]) {
                const oldPath = pathModule.join(
                  __dirname,
                  "uploads",
                  oldResult.rows[0][0],
                );
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
              }

              const ext = pathModule.extname(imageFile.filename) || ".jpg";
              const filename = `dest-${Date.now()}${ext}`;
              const uploadDir = pathModule.join(
                __dirname,
                "uploads/destinations",
              );
              const filePath = pathModule.join(uploadDir, filename);

              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }

              fs.writeFileSync(filePath, imageFile.data);
              imagePath = `/destinations/${filename}`;
            }

            let updates = [];
            let binds = { dest_id: destId };

            if (name) {
              updates.push("name = :name");
              binds.name = name;
            }
            if (location) {
              updates.push("location = :location");
              binds.location = location;
            }
            if (description) {
              updates.push("description = :description");
              binds.description = description;
            }
            if (best_time) {
              updates.push("best_time_to_visit = :best_time");
              binds.best_time = best_time;
            }
            if (distance) {
              updates.push("distance_from_dhaka = :distance");
              binds.distance = distance;
            }
            if (imagePath) {
              updates.push("image_url = :image_url");
              binds.image_url = imagePath;
            }

            if (updates.length > 0) {
              const query = `UPDATE destinations SET ${updates.join(", ")} WHERE dest_id = :dest_id`;
              await connection.execute(query, binds, { autoCommit: false });
            }

            await connection.execute(
              `DELETE FROM destination_interests WHERE dest_id = :dest_id`,
              [destId],
              { autoCommit: false },
            );

            for (const interestId of interestIdArray) {
              await connection.execute(
                `INSERT INTO destination_interests (dest_id, interest_id) VALUES (:dest_id, :interest_id)`,
                [destId, interestId],
                { autoCommit: false },
              );
            }

            await connection.commit();

            sendJSON(res, 200, {
              success: true,
              message: "Destination updated",
            });
          } catch (dbError) {
            if (connection) await connection.rollback();
            console.error("Database error:", dbError);
            sendJSON(res, 500, { success: false, error: "Database error" });
          } finally {
            if (connection) await connection.close();
          }
        } catch (parseError) {
          console.error("Parse error:", parseError);
          sendJSON(res, 400, {
            success: false,
            error: "Error parsing form data",
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Request error:", error);
      sendJSON(res, 500, { success: false, error: "Server error" });
      return true;
    }
  }

  // DELETE DESTINATION
  else if (
    path.startsWith("/api/admin/destinations/") &&
    req.method === "DELETE"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const destId = path.split("/")[4];

    let connection;
    try {
      connection = await getConnection();

      const imageResult = await connection.execute(
        `SELECT image_url FROM destinations WHERE dest_id = :dest_id`,
        [destId],
      );

      if (imageResult.rows.length > 0 && imageResult.rows[0][0]) {
        const imagePath = pathModule.join(
          __dirname,
          "uploads",
          imageResult.rows[0][0],
        );
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      const result = await connection.execute(
        `DELETE FROM destinations WHERE dest_id = :dest_id`,
        [destId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, { success: false, error: "Destination not found" });
        return true;
      }

      sendJSON(res, 200, { success: true, message: "Destination deleted" });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET ALL HOTELS
  else if (path === "/api/admin/hotels" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
          h.hotel_id, h.name, h.description, h.address, h.phone,
          h.distance_from_center, h.amenities, h.image_url,
          h.check_in_time, h.check_out_time, h.dest_id,
          hr.room_id, hr.room_type, hr.bed_type, hr.price_per_night,
          hr.max_guests, hr.meals_included, hr.has_ac, hr.available_rooms
        FROM hotels h
        LEFT JOIN hotel_rooms hr ON h.hotel_id = hr.hotel_id
        ORDER BY h.name`,
      );

      const hotelsMap = new Map();

      result.rows.forEach((row) => {
        const hotelId = row[0];

        if (!hotelsMap.has(hotelId)) {
          // Get rating info
          const ratingQuery = `SELECT COALESCE(AVG(rating), 0), COUNT(*) FROM hotel_ratings WHERE hotel_id = :hotel_id`;

          hotelsMap.set(hotelId, {
            id: hotelId,
            name: row[1],
            description: row[2],
            address: row[3],
            phone: row[4],
            distance: row[5],
            amenities: row[6] ? row[6].split(",").map((a) => a.trim()) : [],
            image: row[7],
            check_in_time: row[8] || "12:00 PM",
            check_out_time: row[9] || "11:00 AM",
            dest_id: row[10],
            rooms: [],
          });
        }

        if (row[11]) {
          const hotel = hotelsMap.get(hotelId);
          hotel.rooms.push({
            id: row[11],
            type: row[12],
            bed: row[13],
            price: row[14],
            max_guests: row[15],
            meals: row[16] || "None",
            ac: row[17] === 1,
            available: row[18] || 0,
          });
        }
      });

      // Get ratings for all hotels
      for (const [hotelId, hotel] of hotelsMap) {
        const ratingResult = await connection.execute(
          `SELECT COALESCE(AVG(rating), 0), COUNT(*) FROM hotel_ratings WHERE hotel_id = :hotel_id`,
          [hotelId],
        );
        hotel.rating = parseFloat(ratingResult.rows[0][0] || 0);
        hotel.reviewCount = ratingResult.rows[0][1] || 0;
      }

      const hotels = Array.from(hotelsMap.values());

      sendJSON(res, 200, { success: true, hotels });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // CREATE HOTEL
  else if (path === "/api/admin/hotels" && req.method === "POST") {
    if (!verifyAdmin(req, res)) return true;

    try {
      const boundary = req.headers["content-type"]?.split("boundary=")[1];
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

          const {
            name,
            description,
            address,
            phone,
            distance,
            amenities,
            check_in_time,
            check_out_time,
            dest_id,
          } = formData.fields;
          const imageFile = formData.files?.image;

          if (!name || !address || !phone || !distance || !dest_id) {
            sendJSON(res, 400, {
              success: false,
              error: "Missing required fields",
            });
            return;
          }

          let imagePath = null;

          if (imageFile) {
            const ext = pathModule.extname(imageFile.filename) || ".jpg";
            const filename = `hotel-${Date.now()}${ext}`;
            const uploadDir = pathModule.join(__dirname, "uploads/hotels");
            const filePath = pathModule.join(uploadDir, filename);

            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }

            fs.writeFileSync(filePath, imageFile.data);
            imagePath = `/hotels/${filename}`;
          }

          let connection;
          try {
            connection = await getConnection();

            const result = await connection.execute(
              `INSERT INTO hotels (
                name, description, address, phone, distance_from_center, amenities, image_url, 
                check_in_time, check_out_time, dest_id
              ) VALUES (
                :name, :description, :address, :phone, :distance, :amenities, :image_url, 
                :check_in_time, :check_out_time, :dest_id
              ) RETURNING hotel_id INTO :hotel_id`,
              {
                name,
                description: description || null,
                address,
                phone,
                distance,
                amenities: amenities || null,
                image_url: imagePath,
                check_in_time: check_in_time || "12:00 PM",
                check_out_time: check_out_time || "11:00 AM",
                dest_id,
                hotel_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
              },
              { autoCommit: true },
            );

            sendJSON(res, 201, {
              success: true,
              message: "Hotel created",
              id: result.outBinds.hotel_id[0],
            });
          } catch (dbError) {
            console.error("Database error:", dbError);
            sendJSON(res, 500, { success: false, error: "Database error" });
          } finally {
            if (connection) await connection.close();
          }
        } catch (parseError) {
          console.error("Parse error:", parseError);
          sendJSON(res, 400, {
            success: false,
            error: "Error parsing form data",
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Request error:", error);
      sendJSON(res, 500, { success: false, error: "Server error" });
      return true;
    }
  }

  // UPDATE HOTEL
  else if (path.startsWith("/api/admin/hotels/") && req.method === "PUT") {
    if (!verifyAdmin(req, res)) return true;

    const hotelId = path.split("/")[4];

    try {
      const boundary = req.headers["content-type"]?.split("boundary=")[1];
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

          const {
            name,
            description,
            address,
            phone,
            distance,
            amenities,
            check_in_time,
            check_out_time,
            dest_id,
          } = formData.fields;
          const imageFile = formData.files?.image;

          let connection;
          try {
            connection = await getConnection();

            let imagePath = null;
            if (imageFile) {
              const oldResult = await connection.execute(
                `SELECT image_url FROM hotels WHERE hotel_id = :hotel_id`,
                [hotelId],
              );

              if (oldResult.rows.length > 0 && oldResult.rows[0][0]) {
                const oldPath = pathModule.join(
                  __dirname,
                  "uploads",
                  oldResult.rows[0][0],
                );
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
              }

              const ext = pathModule.extname(imageFile.filename) || ".jpg";
              const filename = `hotel-${Date.now()}${ext}`;
              const uploadDir = pathModule.join(__dirname, "uploads/hotels");
              const filePath = pathModule.join(uploadDir, filename);

              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }

              fs.writeFileSync(filePath, imageFile.data);
              imagePath = `/hotels/${filename}`;
            }

            let updates = [];
            let binds = { hotel_id: hotelId };

            if (name) {
              updates.push("name = :name");
              binds.name = name;
            }
            if (description !== undefined) {
              updates.push("description = :description");
              binds.description = description;
            }
            if (address) {
              updates.push("address = :address");
              binds.address = address;
            }
            if (phone) {
              updates.push("phone = :phone");
              binds.phone = phone;
            }
            if (distance) {
              updates.push("distance_from_center = :distance");
              binds.distance = distance;
            }
            if (amenities !== undefined) {
              updates.push("amenities = :amenities");
              binds.amenities = amenities;
            }
            if (check_in_time) {
              updates.push("check_in_time = :check_in_time");
              binds.check_in_time = check_in_time;
            }
            if (check_out_time) {
              updates.push("check_out_time = :check_out_time");
              binds.check_out_time = check_out_time;
            }
            if (dest_id) {
              updates.push("dest_id = :dest_id");
              binds.dest_id = dest_id;
            }
            if (imagePath) {
              updates.push("image_url = :image_url");
              binds.image_url = imagePath;
            }

            if (updates.length === 0) {
              sendJSON(res, 400, {
                success: false,
                error: "No fields to update",
              });
              return;
            }

            const query = `UPDATE hotels SET ${updates.join(", ")} WHERE hotel_id = :hotel_id`;
            await connection.execute(query, binds, { autoCommit: true });

            sendJSON(res, 200, { success: true, message: "Hotel updated" });
          } catch (dbError) {
            console.error("Database error:", dbError);
            sendJSON(res, 500, { success: false, error: "Database error" });
          } finally {
            if (connection) await connection.close();
          }
        } catch (parseError) {
          console.error("Parse error:", parseError);
          sendJSON(res, 400, {
            success: false,
            error: "Error parsing form data",
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Request error:", error);
      sendJSON(res, 500, { success: false, error: "Server error" });
      return true;
    }
  }

  // DELETE HOTEL
  else if (path.startsWith("/api/admin/hotels/") && req.method === "DELETE") {
    if (!verifyAdmin(req, res)) return true;

    const hotelId = path.split("/")[4];

    let connection;
    try {
      connection = await getConnection();

      const imageResult = await connection.execute(
        `SELECT image_url FROM hotels WHERE hotel_id = :hotel_id`,
        [hotelId],
      );

      if (imageResult.rows.length > 0 && imageResult.rows[0][0]) {
        const imagePath = pathModule.join(
          __dirname,
          "uploads",
          imageResult.rows[0][0],
        );
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      const result = await connection.execute(
        `DELETE FROM hotels WHERE hotel_id = :hotel_id`,
        [hotelId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, { success: false, error: "Hotel not found" });
        return true;
      }

      sendJSON(res, 200, { success: true, message: "Hotel deleted" });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // ADD ROOM TO HOTEL
  else if (
    path.startsWith("/api/admin/hotels/") &&
    path.endsWith("/rooms") &&
    req.method === "POST"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const hotelId = path.split("/")[4];

    try {
      const body = await getRequestBody(req);
      const {
        room_type,
        bed_type,
        price_per_night,
        max_guests,
        meals_included,
        has_ac,
        available_rooms,
      } = body;

      if (
        !room_type ||
        !bed_type ||
        !price_per_night ||
        !max_guests ||
        !available_rooms
      ) {
        sendJSON(res, 400, {
          success: false,
          error: "Missing required fields",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const result = await connection.execute(
          `INSERT INTO hotel_rooms (
            hotel_id, room_type, bed_type, price_per_night, 
            max_guests, meals_included, has_ac, available_rooms
          ) VALUES (
            :hotel_id, :room_type, :bed_type, :price_per_night,
            :max_guests, :meals_included, :has_ac, :available_rooms
          ) RETURNING room_id INTO :room_id`,
          {
            hotel_id: hotelId,
            room_type,
            bed_type,
            price_per_night,
            max_guests,
            meals_included: meals_included || "None",
            has_ac: has_ac ? 1 : 0,
            available_rooms,
            room_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: true },
        );

        sendJSON(res, 201, {
          success: true,
          message: "Room added",
          id: result.outBinds.room_id[0],
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

  // UPDATE ROOM
  else if (
    path.startsWith("/api/admin/hotels/") &&
    path.includes("/rooms/") &&
    req.method === "PUT"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const parts = path.split("/");
    const hotelId = parts[4];
    const roomId = parts[6];

    try {
      const body = await getRequestBody(req);
      const {
        room_type,
        bed_type,
        price_per_night,
        max_guests,
        meals_included,
        has_ac,
        available_rooms,
      } = body;

      let connection;
      try {
        connection = await getConnection();

        const checkResult = await connection.execute(
          `SELECT room_id FROM hotel_rooms WHERE room_id = :room_id AND hotel_id = :hotel_id`,
          [roomId, hotelId],
        );

        if (checkResult.rows.length === 0) {
          sendJSON(res, 404, { success: false, error: "Room not found" });
          return true;
        }

        let updates = [];
        let binds = { room_id: roomId };

        if (room_type) {
          updates.push("room_type = :room_type");
          binds.room_type = room_type;
        }
        if (bed_type) {
          updates.push("bed_type = :bed_type");
          binds.bed_type = bed_type;
        }
        if (price_per_night) {
          updates.push("price_per_night = :price_per_night");
          binds.price_per_night = price_per_night;
        }
        if (max_guests) {
          updates.push("max_guests = :max_guests");
          binds.max_guests = max_guests;
        }
        if (meals_included !== undefined) {
          updates.push("meals_included = :meals_included");
          binds.meals_included = meals_included;
        }
        if (has_ac !== undefined) {
          updates.push("has_ac = :has_ac");
          binds.has_ac = has_ac ? 1 : 0;
        }
        if (available_rooms !== undefined) {
          updates.push("available_rooms = :available_rooms");
          binds.available_rooms = available_rooms;
        }

        if (updates.length === 0) {
          sendJSON(res, 400, { success: false, error: "No fields to update" });
          return true;
        }

        const query = `UPDATE hotel_rooms SET ${updates.join(", ")} WHERE room_id = :room_id`;
        await connection.execute(query, binds, { autoCommit: true });

        sendJSON(res, 200, { success: true, message: "Room updated" });
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

  // DELETE ROOM
  else if (
    path.startsWith("/api/admin/hotels/") &&
    path.includes("/rooms/") &&
    req.method === "DELETE"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const parts = path.split("/");
    const hotelId = parts[4];
    const roomId = parts[6];

    let connection;
    try {
      connection = await getConnection();

      const checkResult = await connection.execute(
        `SELECT room_id FROM hotel_rooms WHERE room_id = :room_id AND hotel_id = :hotel_id`,
        [roomId, hotelId],
      );

      if (checkResult.rows.length === 0) {
        sendJSON(res, 404, { success: false, error: "Room not found" });
        return true;
      }

      const result = await connection.execute(
        `DELETE FROM hotel_rooms WHERE room_id = :room_id`,
        [roomId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, { success: false, error: "Room not found" });
        return true;
      }

      sendJSON(res, 200, { success: true, message: "Room deleted" });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET ALL TRANSPORT
  else if (path === "/api/admin/transport" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
          transport_id, dest_id, type, company, price_per_person, 
          duration, comfort_level, departure_city, available_seats, 
          departure_time, arrival_time
        FROM transport_options
        ORDER BY company`,
      );

      const transport = result.rows.map((row) => ({
        id: row[0],
        dest_id: row[1],
        type: row[2],
        company: row[3],
        price: row[4],
        duration: row[5],
        comfort: row[6],
        from: row[7] || "Dhaka",
        seats: row[8] || 0,
        departure_time: row[9],
        arrival_time: row[10],
      }));

      sendJSON(res, 200, { success: true, transport });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // CREATE TRANSPORT
  else if (path === "/api/admin/transport" && req.method === "POST") {
    if (!verifyAdmin(req, res)) return true;

    try {
      const body = await getRequestBody(req);
      const {
        type,
        company,
        price_per_person,
        duration,
        comfort_level,
        departure_city,
        available_seats,
        departure_time,
        arrival_time,
        dest_id,
      } = body;

      if (
        !type ||
        !company ||
        !price_per_person ||
        !duration ||
        !comfort_level ||
        !dest_id
      ) {
        sendJSON(res, 400, {
          success: false,
          error: "Missing required fields",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const result = await connection.execute(
          `INSERT INTO transport_options (
            dest_id, type, company, price_per_person, duration, 
            comfort_level, departure_city, available_seats, departure_time, arrival_time
          ) VALUES (
            :dest_id, :type, :company, :price, :duration, 
            :comfort, :departure_city, :seats, :departure_time, :arrival_time
          ) RETURNING transport_id INTO :transport_id`,
          {
            dest_id,
            type,
            company,
            price: price_per_person,
            duration,
            comfort: comfort_level,
            departure_city: departure_city || "Dhaka",
            seats: available_seats || 50,
            departure_time: departure_time || null,
            arrival_time: arrival_time || null,
            transport_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: true },
        );

        sendJSON(res, 201, {
          success: true,
          message: "Transport created",
          id: result.outBinds.transport_id[0],
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
      sendJSON(res, 400, { success: false, error: "Invalid request data" });
      return true;
    }
  }

  // UPDATE TRANSPORT
  else if (path.startsWith("/api/admin/transport/") && req.method === "PUT") {
    if (!verifyAdmin(req, res)) return true;

    const transportId = path.split("/")[4];

    try {
      const body = await getRequestBody(req);
      const {
        type,
        company,
        price_per_person,
        duration,
        comfort_level,
        departure_city,
        available_seats,
        departure_time,
        arrival_time,
        dest_id,
      } = body;

      let connection;
      try {
        connection = await getConnection();

        let updates = [];
        let binds = { transport_id: transportId };

        if (type) {
          updates.push("type = :type");
          binds.type = type;
        }
        if (company) {
          updates.push("company = :company");
          binds.company = company;
        }
        if (price_per_person) {
          updates.push("price_per_person = :price");
          binds.price = price_per_person;
        }
        if (duration) {
          updates.push("duration = :duration");
          binds.duration = duration;
        }
        if (comfort_level) {
          updates.push("comfort_level = :comfort");
          binds.comfort = comfort_level;
        }
        if (departure_city !== undefined) {
          updates.push("departure_city = :departure_city");
          binds.departure_city = departure_city;
        }
        if (available_seats !== undefined) {
          updates.push("available_seats = :seats");
          binds.seats = available_seats;
        }
        if (departure_time !== undefined) {
          updates.push("departure_time = :departure_time");
          binds.departure_time = departure_time;
        }
        if (arrival_time !== undefined) {
          updates.push("arrival_time = :arrival_time");
          binds.arrival_time = arrival_time;
        }
        if (dest_id) {
          updates.push("dest_id = :dest_id");
          binds.dest_id = dest_id;
        }

        if (updates.length === 0) {
          sendJSON(res, 400, { success: false, error: "No fields to update" });
          return true;
        }

        const query = `UPDATE transport_options SET ${updates.join(", ")} WHERE transport_id = :transport_id`;
        await connection.execute(query, binds, { autoCommit: true });

        sendJSON(res, 200, { success: true, message: "Transport updated" });
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

  // DELETE TRANSPORT
  else if (
    path.startsWith("/api/admin/transport/") &&
    req.method === "DELETE"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const transportId = path.split("/")[4];

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `DELETE FROM transport_options WHERE transport_id = :transport_id`,
        [transportId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, { success: false, error: "Transport not found" });
        return true;
      }

      sendJSON(res, 200, { success: true, message: "Transport deleted" });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET ALL FOOD CATEGORIES
  else if (path === "/api/admin/food" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT category_id, name, breakfast_cost, lunch_cost, dinner_cost, daily_cost_per_person
         FROM food_categories
         ORDER BY daily_cost_per_person`,
      );

      const foodCategories = result.rows.map((row) => ({
        id: row[0],
        name: row[1],
        breakfast: row[2],
        lunch: row[3],
        dinner: row[4],
        daily: row[5],
      }));

      sendJSON(res, 200, { success: true, foodCategories });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // CREATE FOOD CATEGORY
  else if (path === "/api/admin/food" && req.method === "POST") {
    if (!verifyAdmin(req, res)) return true;

    try {
      const body = await getRequestBody(req);
      const {
        name,
        breakfast_cost,
        lunch_cost,
        dinner_cost,
        daily_cost_per_person,
      } = body;

      if (!name) {
        sendJSON(res, 400, {
          success: false,
          error: "Category name is required",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const result = await connection.execute(
          `INSERT INTO food_categories (name, breakfast_cost, lunch_cost, dinner_cost, daily_cost_per_person)
           VALUES (:name, :breakfast, :lunch, :dinner, :daily)
           RETURNING category_id INTO :category_id`,
          {
            name,
            breakfast: breakfast_cost || 0,
            lunch: lunch_cost || 0,
            dinner: dinner_cost || 0,
            daily: daily_cost_per_person || 0,
            category_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: true },
        );

        sendJSON(res, 201, {
          success: true,
          message: "Food category created",
          id: result.outBinds.category_id[0],
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
      sendJSON(res, 400, { success: false, error: "Invalid request data" });
      return true;
    }
  }

  // UPDATE FOOD CATEGORY
  else if (path.startsWith("/api/admin/food/") && req.method === "PUT") {
    if (!verifyAdmin(req, res)) return true;

    const categoryId = path.split("/")[4];

    try {
      const body = await getRequestBody(req);
      const {
        name,
        breakfast_cost,
        lunch_cost,
        dinner_cost,
        daily_cost_per_person,
      } = body;

      let connection;
      try {
        connection = await getConnection();

        let updates = [];
        let binds = { category_id: categoryId };

        if (name) {
          updates.push("name = :name");
          binds.name = name;
        }
        if (breakfast_cost !== undefined) {
          updates.push("breakfast_cost = :breakfast");
          binds.breakfast = breakfast_cost;
        }
        if (lunch_cost !== undefined) {
          updates.push("lunch_cost = :lunch");
          binds.lunch = lunch_cost;
        }
        if (dinner_cost !== undefined) {
          updates.push("dinner_cost = :dinner");
          binds.dinner = dinner_cost;
        }
        if (daily_cost_per_person !== undefined) {
          updates.push("daily_cost_per_person = :daily");
          binds.daily = daily_cost_per_person;
        }

        if (updates.length === 0) {
          sendJSON(res, 400, { success: false, error: "No fields to update" });
          return true;
        }

        const query = `UPDATE food_categories SET ${updates.join(", ")} WHERE category_id = :category_id`;
        await connection.execute(query, binds, { autoCommit: true });

        sendJSON(res, 200, { success: true, message: "Food category updated" });
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

  // DELETE FOOD CATEGORY
  else if (path.startsWith("/api/admin/food/") && req.method === "DELETE") {
    if (!verifyAdmin(req, res)) return true;

    const categoryId = path.split("/")[4];

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `DELETE FROM food_categories WHERE category_id = :category_id`,
        [categoryId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, {
          success: false,
          error: "Food category not found",
        });
        return true;
      }

      sendJSON(res, 200, { success: true, message: "Food category deleted" });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET ALL ACTIVITIES
  else if (path === "/api/admin/activities" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
          a.activity_id, a.name, a.description, a.cost_per_person, 
          a.duration_hours, a.interest_type, a.image_url, a.dest_id,
          d.name as destination_name
        FROM activities a
        JOIN destinations d ON a.dest_id = d.dest_id
        ORDER BY a.name`,
      );

      const activities = result.rows.map((row) => ({
        id: row[0],
        name: row[1],
        description: row[2],
        cost: row[3],
        duration: row[4],
        interest: row[5],
        image: row[6],
        dest_id: row[7],
        destination_name: row[8],
      }));

      sendJSON(res, 200, { success: true, activities });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // CREATE ACTIVITY
  else if (path === "/api/admin/activities" && req.method === "POST") {
    if (!verifyAdmin(req, res)) return true;

    try {
      const boundary = req.headers["content-type"]?.split("boundary=")[1];
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

          const {
            name,
            description,
            cost_per_person,
            duration_hours,
            interest_type,
            dest_id,
          } = formData.fields;
          const imageFile = formData.files?.image;

          if (
            !name ||
            !description ||
            !cost_per_person ||
            !duration_hours ||
            !interest_type ||
            !dest_id
          ) {
            sendJSON(res, 400, {
              success: false,
              error: "Missing required fields",
            });
            return;
          }

          let imagePath = null;

          if (imageFile) {
            const ext = pathModule.extname(imageFile.filename) || ".jpg";
            const filename = `activity-${Date.now()}${ext}`;
            const uploadDir = pathModule.join(__dirname, "uploads/activities");
            const filePath = pathModule.join(uploadDir, filename);

            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }

            fs.writeFileSync(filePath, imageFile.data);
            imagePath = `/activities/${filename}`;
          }

          let connection;
          try {
            connection = await getConnection();

            const result = await connection.execute(
              `INSERT INTO activities (
                name, description, cost_per_person, duration_hours, 
                interest_type, image_url, dest_id
              ) VALUES (
                :name, :description, :cost, :duration, 
                :interest, :image_url, :dest_id
              ) RETURNING activity_id INTO :activity_id`,
              {
                name,
                description,
                cost: cost_per_person,
                duration: duration_hours,
                interest: interest_type,
                image_url: imagePath,
                dest_id,
                activity_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
              },
              { autoCommit: true },
            );

            sendJSON(res, 201, {
              success: true,
              message: "Activity created",
              id: result.outBinds.activity_id[0],
            });
          } catch (dbError) {
            console.error("Database error:", dbError);
            sendJSON(res, 500, { success: false, error: "Database error" });
          } finally {
            if (connection) await connection.close();
          }
        } catch (parseError) {
          console.error("Parse error:", parseError);
          sendJSON(res, 400, {
            success: false,
            error: "Error parsing form data",
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Request error:", error);
      sendJSON(res, 500, { success: false, error: "Server error" });
      return true;
    }
  }

  // UPDATE ACTIVITY
  else if (path.startsWith("/api/admin/activities/") && req.method === "PUT") {
    if (!verifyAdmin(req, res)) return true;

    const activityId = path.split("/")[4];

    try {
      const boundary = req.headers["content-type"]?.split("boundary=")[1];
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

          const {
            name,
            description,
            cost_per_person,
            duration_hours,
            interest_type,
            dest_id,
          } = formData.fields;
          const imageFile = formData.files?.image;

          let connection;
          try {
            connection = await getConnection();

            let imagePath = null;
            if (imageFile) {
              const oldResult = await connection.execute(
                `SELECT image_url FROM activities WHERE activity_id = :activity_id`,
                [activityId],
              );

              if (oldResult.rows.length > 0 && oldResult.rows[0][0]) {
                const oldPath = pathModule.join(
                  __dirname,
                  "uploads",
                  oldResult.rows[0][0],
                );
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
              }

              const ext = pathModule.extname(imageFile.filename) || ".jpg";
              const filename = `activity-${Date.now()}${ext}`;
              const uploadDir = pathModule.join(
                __dirname,
                "uploads/activities",
              );
              const filePath = pathModule.join(uploadDir, filename);

              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }

              fs.writeFileSync(filePath, imageFile.data);
              imagePath = `/activities/${filename}`;
            }

            let updates = [];
            let binds = { activity_id: activityId };

            if (name) {
              updates.push("name = :name");
              binds.name = name;
            }
            if (description) {
              updates.push("description = :description");
              binds.description = description;
            }
            if (cost_per_person) {
              updates.push("cost_per_person = :cost");
              binds.cost = cost_per_person;
            }
            if (duration_hours) {
              updates.push("duration_hours = :duration");
              binds.duration = duration_hours;
            }
            if (interest_type) {
              updates.push("interest_type = :interest");
              binds.interest = interest_type;
            }
            if (dest_id) {
              updates.push("dest_id = :dest_id");
              binds.dest_id = dest_id;
            }
            if (imagePath) {
              updates.push("image_url = :image_url");
              binds.image_url = imagePath;
            }

            if (updates.length === 0) {
              sendJSON(res, 400, {
                success: false,
                error: "No fields to update",
              });
              return;
            }

            const query = `UPDATE activities SET ${updates.join(", ")} WHERE activity_id = :activity_id`;
            await connection.execute(query, binds, { autoCommit: true });

            sendJSON(res, 200, { success: true, message: "Activity updated" });
          } catch (dbError) {
            console.error("Database error:", dbError);
            sendJSON(res, 500, { success: false, error: "Database error" });
          } finally {
            if (connection) await connection.close();
          }
        } catch (parseError) {
          console.error("Parse error:", parseError);
          sendJSON(res, 400, {
            success: false,
            error: "Error parsing form data",
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Request error:", error);
      sendJSON(res, 500, { success: false, error: "Server error" });
      return true;
    }
  }

  // DELETE ACTIVITY
  else if (
    path.startsWith("/api/admin/activities/") &&
    req.method === "DELETE"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const activityId = path.split("/")[4];

    let connection;
    try {
      connection = await getConnection();

      const imageResult = await connection.execute(
        `SELECT image_url FROM activities WHERE activity_id = :activity_id`,
        [activityId],
      );

      if (imageResult.rows.length > 0 && imageResult.rows[0][0]) {
        const imagePath = pathModule.join(
          __dirname,
          "uploads",
          imageResult.rows[0][0],
        );
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      const result = await connection.execute(
        `DELETE FROM activities WHERE activity_id = :activity_id`,
        [activityId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, { success: false, error: "Activity not found" });
        return true;
      }

      sendJSON(res, 200, { success: true, message: "Activity deleted" });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET ALL BOOKINGS
  else if (path === "/api/admin/bookings" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
          b.booking_id, b.plan_id, b.user_id, u.full_name as user_name, u.email as user_email, u.phone as user_phone,
          b.destination_id, d.name as destination_name, b.hotel_id, h.name as hotel_name,
          b.transport_id, t.company as transport_company, b.travel_date, b.duration_days, b.people,
          b.payment_amount, b.payment_method, b.transaction_id, b.status, b.booking_date, b.confirmation_number,
          b.refund_requested, b.refund_status, b.refund_date, b.refund_amount, b.refund_reason
        FROM bookings b
        JOIN users u ON b.user_id = u.user_id
        JOIN destinations d ON b.destination_id = d.dest_id
        LEFT JOIN hotels h ON b.hotel_id = h.hotel_id
        LEFT JOIN transport_options t ON b.transport_id = t.transport_id
        ORDER BY b.booking_date DESC`,
      );

      const bookings = result.rows.map((row) => ({
        id: row[0],
        planId: row[1],
        userId: row[2],
        userName: row[3],
        userEmail: row[4],
        userPhone: row[5],
        destinationId: row[6],
        destination: row[7],
        hotelId: row[8],
        hotel: row[9],
        transportId: row[10],
        transport: row[11],
        travelDate: row[12],
        durationDays: row[13],
        people: row[14],
        totalCost: row[15],
        paymentMethod: row[16],
        transactionId: row[17],
        status: row[18],
        bookingDate: row[19],
        confirmationNumber: row[20],
        refundRequested: row[21],
        refundStatus: row[22],
        refundDate: row[23],
        refundAmount: row[24],
        refundReason: row[25],
      }));

      sendJSON(res, 200, { success: true, bookings });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET SINGLE BOOKING
  else if (
    path.startsWith("/api/admin/bookings/") &&
    !path.endsWith("/stats") &&
    !path.endsWith("/status") &&
    !path.endsWith("/refund") &&
    req.method === "GET"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const bookingId = path.split("/")[4];

    if (!bookingId || isNaN(bookingId)) {
      sendJSON(res, 400, {
        success: false,
        error: "Valid booking ID required",
      });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
          b.booking_id, b.plan_id, b.user_id, u.full_name, u.email, u.phone,
          b.destination_id, d.name, d.location, b.hotel_id, h.name, h.address, h.phone, h.base_rating,
          b.room_id, hr.room_type, hr.bed_type, hr.price_per_night, hr.meals_included,
          b.transport_id, t.company, t.type, t.price_per_person, t.departure_time, t.arrival_time, t.duration,
          b.travel_date, b.duration_days, b.people, b.payment_amount, b.payment_method, b.transaction_id,
          b.status, b.booking_date, b.confirmation_number,
          b.refund_requested, b.refund_status, b.refund_date, b.refund_amount, b.refund_reason
        FROM bookings b
        JOIN users u ON b.user_id = u.user_id
        JOIN destinations d ON b.destination_id = d.dest_id
        LEFT JOIN hotels h ON b.hotel_id = h.hotel_id
        LEFT JOIN hotel_rooms hr ON b.room_id = hr.room_id
        LEFT JOIN transport_options t ON b.transport_id = t.transport_id
        WHERE b.booking_id = :booking_id`,
        [bookingId],
      );

      if (result.rows.length === 0) {
        sendJSON(res, 404, { success: false, error: "Booking not found" });
        return true;
      }

      const row = result.rows[0];
      const booking = {
        id: row[0],
        planId: row[1],
        userId: row[2],
        userName: row[3],
        userEmail: row[4],
        userPhone: row[5],
        destinationId: row[6],
        destination: row[7],
        destinationLocation: row[8],
        hotelId: row[9],
        hotel: {
          name: row[10],
          address: row[11],
          phone: row[12],
          rating: row[13],
        },
        roomId: row[14],
        room: { type: row[15], bed: row[16], price: row[17], meals: row[18] },
        transportId: row[19],
        transport: {
          company: row[20],
          type: row[21],
          price: row[22],
          departure: row[23],
          arrival: row[24],
          duration: row[25],
        },
        travelDate: row[26],
        durationDays: row[27],
        people: row[28],
        totalCost: row[29],
        paymentMethod: row[30],
        transactionId: row[31],
        status: row[32],
        bookingDate: row[33],
        confirmationNumber: row[34],
        refundRequested: row[35],
        refundStatus: row[36],
        refundDate: row[37],
        refundAmount: row[38],
        refundReason: row[39],
      };

      sendJSON(res, 200, { success: true, booking });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // UPDATE BOOKING STATUS
  else if (
    path.startsWith("/api/admin/bookings/") &&
    path.endsWith("/status") &&
    req.method === "PUT"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const bookingId = path.split("/")[4];

    try {
      const body = await getRequestBody(req);
      const { status } = body;

      if (
        !status ||
        !["confirmed", "failed", "cancelled", "completed"].includes(status)
      ) {
        sendJSON(res, 400, { success: false, error: "Valid status required" });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const bookingResult = await connection.execute(
          `SELECT status, plan_id, hotel_id, room_id, transport_id, people, hr.max_guests
           FROM bookings b
           LEFT JOIN hotel_rooms hr ON b.room_id = hr.room_id
           WHERE b.booking_id = :booking_id`,
          [bookingId],
        );

        if (bookingResult.rows.length === 0) {
          sendJSON(res, 404, { success: false, error: "Booking not found" });
          return true;
        }

        const [
          currentStatus,
          planId,
          hotelId,
          roomId,
          transportId,
          people,
          maxGuests,
        ] = bookingResult.rows[0];
        const roomsNeeded = Math.ceil(people / maxGuests);

        await connection.execute(`SET TRANSACTION READ WRITE`);

        if (
          (status === "failed" || status === "cancelled") &&
          (currentStatus === "pending" || currentStatus === "confirmed")
        ) {
          if (roomId) {
            await connection.execute(
              `UPDATE hotel_rooms SET available_rooms = available_rooms + :rooms_needed WHERE room_id = :room_id`,
              { rooms_needed: roomsNeeded, room_id: roomId },
              { autoCommit: false },
            );
          }

          if (transportId) {
            await connection.execute(
              `UPDATE transport_options SET available_seats = available_seats + :people WHERE transport_id = :transport_id`,
              { people, transport_id: transportId },
              { autoCommit: false },
            );
          }

          if (planId) {
            await connection.execute(
              `UPDATE user_trip_plans SET booking_status = 'cancelled', last_modified = SYSDATE WHERE plan_id = :plan_id`,
              [planId],
              { autoCommit: false },
            );
          }
        }

        if (status === "confirmed" && currentStatus === "pending") {
          if (planId) {
            await connection.execute(
              `UPDATE user_trip_plans SET booking_status = 'booked', booking_date = SYSDATE, last_modified = SYSDATE WHERE plan_id = :plan_id`,
              [planId],
              { autoCommit: false },
            );
          }
        }

        await connection.execute(
          `UPDATE bookings SET status = :status WHERE booking_id = :booking_id`,
          { status, booking_id: bookingId },
          { autoCommit: true },
        );

        sendJSON(res, 200, {
          success: true,
          message: `Booking ${status} successfully`,
        });
        return true;
      } catch (dbError) {
        if (connection) await connection.rollback();
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

  // PROCESS REFUND
  else if (
    path.startsWith("/api/admin/bookings/") &&
    path.endsWith("/refund") &&
    req.method === "PUT"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const bookingId = path.split("/")[4];

    try {
      const body = await getRequestBody(req);
      const { action } = body;

      if (!action || !["approve", "reject"].includes(action)) {
        sendJSON(res, 400, { success: false, error: "Valid action required" });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const status = action === "approve" ? "approved" : "rejected";

        await connection.execute(
          `UPDATE bookings 
           SET refund_status = :status, refund_date = SYSDATE
           WHERE booking_id = :booking_id AND refund_requested = 1 AND refund_status = 'pending'`,
          { status, booking_id: bookingId },
          { autoCommit: true },
        );

        sendJSON(res, 200, {
          success: true,
          message: `Refund ${status} successfully`,
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

  // GET BOOKING STATISTICS
  else if (path === "/api/admin/bookings/stats" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const statusResult = await connection.execute(
        `SELECT status, COUNT(*) as count, SUM(payment_amount) as revenue
         FROM bookings GROUP BY status`,
      );

      const stats = { total: 0, totalRevenue: 0, byStatus: {} };

      statusResult.rows.forEach((row) => {
        const status = row[0] || "pending";
        stats.byStatus[status] = { count: row[1], revenue: row[2] || 0 };
        stats.total += row[1];
        stats.totalRevenue += row[2] || 0;
      });

      const monthlyResult = await connection.execute(
        `SELECT TO_CHAR(booking_date, 'YYYY-MM') as month, COUNT(*) as bookings, SUM(payment_amount) as revenue
         FROM bookings
         WHERE booking_date >= ADD_MONTHS(SYSDATE, -6)
         GROUP BY TO_CHAR(booking_date, 'YYYY-MM')
         ORDER BY month DESC`,
      );

      stats.monthly = monthlyResult.rows.map((row) => ({
        month: row[0],
        bookings: row[1],
        revenue: row[2] || 0,
      }));

      sendJSON(res, 200, { success: true, stats });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET REVENUE STATISTICS
  else if (path === "/api/admin/revenue" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    const range = parsedUrl.searchParams.get("range") || "6months";

    let connection;
    try {
      connection = await getConnection();

      let startDate;
      const today = new Date();
      switch (range) {
        case "30days":
          startDate = new Date(today.setDate(today.getDate() - 30));
          break;
        case "6months":
          startDate = new Date(today.setMonth(today.getMonth() - 6));
          break;
        case "1year":
          startDate = new Date(today.setFullYear(today.getFullYear() - 1));
          break;
        default:
          startDate = null;
      }

      const startDateParam = startDate
        ? startDate.toISOString().split("T")[0]
        : null;

      let overallQuery = `SELECT COUNT(*) as total_bookings, SUM(payment_amount) as total_revenue, AVG(payment_amount) as avg_booking_value
                          FROM bookings WHERE status IN ('confirmed', 'completed')`;
      const overallBinds = [];
      if (startDateParam) {
        overallQuery += ` AND booking_date >= TO_DATE(:start_date, 'YYYY-MM-DD')`;
        overallBinds.push(startDateParam);
      }

      const overallResult = await connection.execute(
        overallQuery,
        overallBinds,
      );
      const totalBookings = overallResult.rows[0][0] || 0;
      const totalRevenue = overallResult.rows[0][1] || 0;
      const avgBookingValue = overallResult.rows[0][2] || 0;

      let monthlyQuery = `SELECT TO_CHAR(booking_date, 'YYYY-MM') as month, COUNT(*) as bookings, SUM(payment_amount) as revenue
                          FROM bookings WHERE status IN ('confirmed', 'completed')`;
      const monthlyBinds = [];
      if (startDateParam) {
        monthlyQuery += ` AND booking_date >= TO_DATE(:start_date, 'YYYY-MM-DD')`;
        monthlyBinds.push(startDateParam);
      }
      monthlyQuery += ` GROUP BY TO_CHAR(booking_date, 'YYYY-MM') ORDER BY month DESC`;

      const monthlyResult = await connection.execute(
        monthlyQuery,
        monthlyBinds,
      );
      const monthlyData = monthlyResult.rows.map((row) => ({
        month: row[0],
        bookings: row[1],
        revenue: row[2] || 0,
      }));

      let destQuery = `SELECT d.name, COUNT(b.booking_id) as bookings, SUM(b.payment_amount) as revenue
                       FROM destinations d
                       LEFT JOIN bookings b ON d.dest_id = b.destination_id AND b.status IN ('confirmed', 'completed')`;
      const destBinds = [];
      if (startDateParam) {
        destQuery += ` AND b.booking_date >= TO_DATE(:start_date, 'YYYY-MM-DD')`;
        destBinds.push(startDateParam);
      }
      destQuery += ` GROUP BY d.name ORDER BY revenue DESC NULLS LAST`;

      const destResult = await connection.execute(destQuery, destBinds);
      const destinationRevenue = destResult.rows.map((row) => ({
        name: row[0],
        bookings: row[1] || 0,
        revenue: row[2] || 0,
      }));

      let statusQuery = `SELECT status, COUNT(*) as count, SUM(payment_amount) as revenue FROM bookings WHERE 1=1`;
      const statusBinds = [];
      if (startDateParam) {
        statusQuery += ` AND booking_date >= TO_DATE(:start_date, 'YYYY-MM-DD')`;
        statusBinds.push(startDateParam);
      }
      statusQuery += ` GROUP BY status`;

      const statusResult = await connection.execute(statusQuery, statusBinds);
      const statusBreakdown = {};
      statusResult.rows.forEach((row) => {
        statusBreakdown[row[0]] = { count: row[1], revenue: row[2] || 0 };
      });

      let topDestQuery = `SELECT d.name, COUNT(b.booking_id) as bookings, SUM(b.payment_amount) as revenue
                          FROM destinations d
                          LEFT JOIN bookings b ON d.dest_id = b.destination_id AND b.status IN ('confirmed', 'completed')`;
      const topDestBinds = [];
      if (startDateParam) {
        topDestQuery += ` AND b.booking_date >= TO_DATE(:start_date, 'YYYY-MM-DD')`;
        topDestBinds.push(startDateParam);
      }
      topDestQuery += ` GROUP BY d.name ORDER BY bookings DESC NULLS LAST FETCH FIRST 5 ROWS ONLY`;

      const topDestResult = await connection.execute(
        topDestQuery,
        topDestBinds,
      );
      const topDestinations = topDestResult.rows.map((row) => ({
        name: row[0],
        bookings: row[1] || 0,
        revenue: row[2] || 0,
      }));

      sendJSON(res, 200, {
        success: true,
        stats: {
          totalRevenue,
          totalBookings,
          averageBookingValue: avgBookingValue,
          monthlyData,
          destinationRevenue,
          statusBreakdown,
          topDestinations,
        },
      });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, {
        success: false,
        error: "Database error: " + dbError.message,
      });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET DESTINATION RATINGS
  else if (path === "/api/admin/ratings/destinations" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT r.rating_id, r.user_id, u.full_name, u.email, r.dest_id, d.name, r.rating, r.review, r.review_date
         FROM ratings r
         JOIN users u ON r.user_id = u.user_id
         JOIN destinations d ON r.dest_id = d.dest_id
         ORDER BY r.review_date DESC`,
      );

      const ratings = result.rows.map((row) => ({
        id: row[0],
        userId: row[1],
        userName: row[2],
        userEmail: row[3],
        destinationId: row[4],
        itemName: row[5],
        rating: row[6],
        review: row[7],
        date: row[8],
      }));

      const total = ratings.length;
      const average =
        total > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach((r) => distribution[r.rating]++);

      sendJSON(res, 200, {
        success: true,
        ratings,
        stats: { total, average, distribution },
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

  // DELETE DESTINATION RATING
  else if (
    path.startsWith("/api/admin/ratings/destinations/") &&
    req.method === "DELETE"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const ratingId = path.split("/")[5];

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `DELETE FROM ratings WHERE rating_id = :rating_id`,
        [ratingId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, { success: false, error: "Rating not found" });
        return true;
      }

      sendJSON(res, 200, { success: true, message: "Rating deleted" });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET HOTEL RATINGS
  else if (path === "/api/admin/ratings/hotels" && req.method === "GET") {
    if (!verifyAdmin(req, res)) return true;

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT hr.hotel_rating_id, hr.user_id, u.full_name, u.email, hr.hotel_id, h.name, hr.rating, hr.review, hr.review_date
         FROM hotel_ratings hr
         JOIN users u ON hr.user_id = u.user_id
         JOIN hotels h ON hr.hotel_id = h.hotel_id
         ORDER BY hr.review_date DESC`,
      );

      const ratings = result.rows.map((row) => ({
        id: row[0],
        userId: row[1],
        userName: row[2],
        userEmail: row[3],
        hotelId: row[4],
        itemName: row[5],
        rating: row[6],
        review: row[7],
        date: row[8],
      }));

      const total = ratings.length;
      const average =
        total > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach((r) => distribution[r.rating]++);

      sendJSON(res, 200, {
        success: true,
        ratings,
        stats: { total, average, distribution },
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

  // DELETE HOTEL RATING
  else if (
    path.startsWith("/api/admin/ratings/hotels/") &&
    req.method === "DELETE"
  ) {
    if (!verifyAdmin(req, res)) return true;

    const ratingId = path.split("/")[5];

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `DELETE FROM hotel_ratings WHERE hotel_rating_id = :rating_id`,
        [ratingId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, { success: false, error: "Rating not found" });
        return true;
      }

      sendJSON(res, 200, { success: true, message: "Hotel rating deleted" });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  return false;
};
