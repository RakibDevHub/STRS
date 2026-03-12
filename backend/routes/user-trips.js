module.exports = async (req, res, parsedUrl, path, helpers) => {
  const { getConnection, getRequestBody, sendJSON } = helpers;

  // SAVE TRIP PLAN
  if (path === "/api/user/trip-plans" && req.method === "POST") {
    try {
      const body = await getRequestBody(req);
      const {
        userId,
        planName,
        destinationId,
        hotelId,
        roomId,
        transportId,
        foodCategoryId,
        activityIds,
        travelDate,
        durationDays,
        people,
        hotelCost,
        transportCost,
        foodCost,
        activitiesCost,
        totalCost,
        bookingStatus,
      } = body;

      if (
        !userId ||
        !destinationId ||
        !hotelId ||
        !roomId ||
        !transportId ||
        !foodCategoryId ||
        !travelDate
      ) {
        sendJSON(res, 400, {
          success: false,
          error:
            "Missing required fields. Hotel, transport, food, and date are required.",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const result = await connection.execute(
          `INSERT INTO user_trip_plans (
            user_id, plan_name, destination_id,
            hotel_id, room_id, transport_id, food_category_id, activity_ids,
            travel_date, duration_days, people,
            hotel_cost, transport_cost, food_cost, activities_cost, total_cost,
            booking_status, created_date, last_modified
          ) VALUES (
            :user_id, :plan_name, :destination_id,
            :hotel_id, :room_id, :transport_id, :food_category_id, :activity_ids,
            TO_DATE(:travel_date, 'YYYY-MM-DD'), :duration_days, :people,
            :hotel_cost, :transport_cost, :food_cost, :activities_cost, :total_cost,
            :booking_status, SYSDATE, SYSDATE
          ) RETURNING plan_id INTO :plan_id`,
          {
            user_id: userId,
            plan_name: planName,
            destination_id: destinationId,
            hotel_id: hotelId,
            room_id: roomId,
            transport_id: transportId,
            food_category_id: foodCategoryId,
            activity_ids: activityIds || null,
            travel_date: travelDate,
            duration_days: durationDays,
            people: people,
            hotel_cost: hotelCost || 0,
            transport_cost: transportCost || 0,
            food_cost: foodCost || 0,
            activities_cost: activitiesCost || 0,
            total_cost: totalCost || 0,
            booking_status: bookingStatus || "planned",
            plan_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: true },
        );

        const planId = result.outBinds.plan_id[0];

        sendJSON(res, 201, {
          success: true,
          message: "Trip plan saved successfully",
          plan_id: planId,
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
    } catch (error) {
      console.error("Request error:", error);
      sendJSON(res, 400, { success: false, error: "Invalid request data" });
      return true;
    }
  }

  // GET USER'S TRIP PLANS
  else if (path === "/api/user/trips" && req.method === "GET") {
    const userId = parsedUrl.searchParams.get("userId");

    if (!userId) {
      sendJSON(res, 400, { success: false, error: "User ID required" });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
          tp.plan_id, 
          tp.plan_name, 
          tp.travel_date, 
          tp.duration_days, 
          tp.people,
          tp.hotel_cost, 
          tp.transport_cost, 
          tp.food_cost, 
          tp.activities_cost, 
          tp.total_cost,
          tp.booking_status, 
          tp.created_date,
          tp.activity_ids,
          d.dest_id, 
          d.name as destination_name, 
          d.location, 
          d.image_url,
          b.refund_status,
          b.refund_requested
        FROM user_trip_plans tp
        JOIN destinations d ON tp.destination_id = d.dest_id
        LEFT JOIN bookings b ON tp.plan_id = b.plan_id
        WHERE tp.user_id = :user_id
        ORDER BY 
          CASE tp.booking_status
            WHEN 'planned' THEN 1
            WHEN 'booked' THEN 2
            ELSE 3
          END,
          tp.created_date DESC`,
        [userId],
      );

      const trips = await Promise.all(
        result.rows.map(async (row) => {
          const activityIds = row[12]
            ? row[12].split(",").map((id) => parseInt(id))
            : [];

          let activities = [];
          if (activityIds.length > 0) {
            const binds = {};
            const placeholders = activityIds
              .map((id, index) => {
                binds[`id${index}`] = id;
                return `:id${index}`;
              })
              .join(",");

            const activityResult = await connection.execute(
              `SELECT activity_id, name, cost_per_person
               FROM activities
               WHERE activity_id IN (${placeholders})`,
              binds,
            );

            activities = activityResult.rows.map((r) => ({
              id: r[0],
              name: r[1],
              cost: r[2],
            }));
          }

          const refundStatus = row[17] || null;
          const refundRequested = row[18] || 0;

          let refundDisplay = null;
          if (refundRequested === 1) {
            if (refundStatus === "approved") refundDisplay = "refunded";
            else if (refundStatus === "pending") refundDisplay = "processing";
            else if (refundStatus === "rejected") refundDisplay = "rejected";
          }

          return {
            id: row[0],
            name: row[1],
            travelDate: row[2],
            durationDays: row[3],
            people: row[4],
            costs: {
              hotel: row[5],
              transport: row[6],
              food: row[7],
              activities: row[8],
              total: row[9],
            },
            status: row[10],
            createdAt: row[11],
            activities: activities,
            destination: {
              id: row[13],
              name: row[14],
              location: row[15],
              image: row[16],
            },
            refund: {
              requested: refundRequested === 1,
              status: refundStatus,
              display: refundDisplay,
            },
          };
        }),
      );

      sendJSON(res, 200, { success: true, count: trips.length, trips });
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

  // GET SINGLE TRIP PLAN DETAILS
  else if (path.startsWith("/api/user/trips/") && req.method === "GET") {
    const planId = path.split("/")[4];

    if (!planId) {
      sendJSON(res, 400, { success: false, error: "Plan ID required" });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
        tp.plan_id, tp.plan_name, tp.travel_date, tp.duration_days, tp.people,
        tp.hotel_cost, tp.transport_cost, tp.food_cost, tp.activities_cost, tp.total_cost,
        tp.booking_status, tp.created_date, tp.activity_ids,
        d.dest_id, d.name, d.location, d.description, d.image_url, d.distance_from_dhaka, d.best_time_to_visit,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.rating_id) as review_count,
        h.hotel_id, h.name, h.address, h.phone, h.amenities, h.distance_from_center,
        COALESCE(AVG(hr2.rating), 0) as hotel_avg_rating,
        COUNT(hr2.hotel_rating_id) as hotel_review_count,
        hr.room_id, hr.room_type, hr.bed_type, hr.price_per_night, hr.meals_included,
        tr.transport_id, tr.company, tr.type, tr.price_per_person, 
        tr.departure_time, tr.arrival_time, tr.duration,
        fc.category_id, fc.name, fc.daily_cost_per_person,
        fc.breakfast_cost, fc.lunch_cost, fc.dinner_cost,
        b.refund_status,
        b.refund_requested,
        b.refund_amount,
        b.refund_reason
      FROM user_trip_plans tp
      JOIN destinations d ON tp.destination_id = d.dest_id
      LEFT JOIN ratings r ON d.dest_id = r.dest_id
      LEFT JOIN hotels h ON tp.hotel_id = h.hotel_id
      LEFT JOIN hotel_ratings hr2 ON h.hotel_id = hr2.hotel_id
      LEFT JOIN hotel_rooms hr ON tp.room_id = hr.room_id
      LEFT JOIN transport_options tr ON tp.transport_id = tr.transport_id
      LEFT JOIN food_categories fc ON tp.food_category_id = fc.category_id
      LEFT JOIN bookings b ON tp.plan_id = b.plan_id
      WHERE tp.plan_id = :plan_id
      GROUP BY 
        tp.plan_id, tp.plan_name, tp.travel_date, tp.duration_days, tp.people,
        tp.hotel_cost, tp.transport_cost, tp.food_cost, tp.activities_cost, tp.total_cost,
        tp.booking_status, tp.created_date, tp.activity_ids,
        d.dest_id, d.name, d.location, d.description, d.image_url, d.distance_from_dhaka, d.best_time_to_visit,
        h.hotel_id, h.name, h.address, h.phone, h.amenities, h.distance_from_center,
        hr.room_id, hr.room_type, hr.bed_type, hr.price_per_night, hr.meals_included,
        tr.transport_id, tr.company, tr.type, tr.price_per_person, 
        tr.departure_time, tr.arrival_time, tr.duration,
        fc.category_id, fc.name, fc.daily_cost_per_person,
        fc.breakfast_cost, fc.lunch_cost, fc.dinner_cost,
        b.refund_status, b.refund_requested, b.refund_amount, b.refund_reason`,
        [planId],
      );

      if (result.rows.length === 0) {
        sendJSON(res, 404, { success: false, error: "Trip plan not found" });
        return true;
      }

      const row = result.rows[0];

      // Parse activity IDs
      const activityIds = row[12]
        ? row[12].split(",").map((id) => parseInt(id))
        : [];

      // Get activity details
      let activities = [];
      if (activityIds.length > 0) {
        const binds = {};
        const placeholders = activityIds
          .map((id, index) => {
            binds[`id${index}`] = id;
            return `:id${index}`;
          })
          .join(",");

        const activityResult = await connection.execute(
          `SELECT activity_id, name, description, cost_per_person, duration_hours
         FROM activities
         WHERE activity_id IN (${placeholders})`,
          binds,
        );

        activities = activityResult.rows.map((r) => ({
          id: r[0],
          name: r[1],
          description: r[2],
          cost: r[3],
          duration: r[4],
        }));
      }

      // Get refund information
      const refundStatus = row[49] || null;
      const refundRequested = row[50] || 0;
      const refundAmount = row[51] || null;
      const refundReason = row[52] || null;

      let refundDisplay = null;
      if (refundRequested === 1) {
        if (refundStatus === "approved") refundDisplay = "refunded";
        else if (refundStatus === "pending") refundDisplay = "processing";
        else if (refundStatus === "rejected") refundDisplay = "rejected";
      }

      const trip = {
        id: row[0],
        name: row[1],
        travelDate: row[2],
        durationDays: row[3],
        people: row[4],
        costs: {
          hotel: row[5],
          transport: row[6],
          food: row[7],
          activities: row[8],
          total: row[9],
        },
        status: row[10],
        createdAt: row[11],
        destination: {
          id: row[13],
          name: row[14],
          location: row[15],
          description: row[16],
          image: row[17],
          distance: row[18],
          best_time: row[19],
          rating: parseFloat(row[20] || 0),
          reviewCount: row[21] || 0,
        },
        hotel: row[22]
          ? {
              id: row[22],
              name: row[23],
              address: row[24],
              phone: row[25],
              amenities: row[26] ? row[26].split(",") : [],
              distance: row[27],
              rating: parseFloat(row[28] || 0),
              reviewCount: row[29] || 0,
            }
          : null,
        room: row[30]
          ? {
              id: row[30],
              type: row[31],
              bed: row[32],
              price: row[33],
              meals: row[34],
            }
          : null,
        transport: row[35]
          ? {
              id: row[35],
              company: row[36],
              type: row[37],
              price: row[38],
              departure: row[39],
              arrival: row[40],
              duration: row[41],
            }
          : null,
        food: row[42]
          ? {
              id: row[42],
              name: row[43],
              dailyCost: row[44],
              breakfast: row[45],
              lunch: row[46],
              dinner: row[47],
            }
          : null,
        activities: activities,
        refund: {
          requested: refundRequested === 1,
          status: refundStatus,
          amount: refundAmount,
          reason: refundReason,
          display: refundDisplay,
        },
      };

      sendJSON(res, 200, { success: true, trip });
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

  // UPDATE TRIP PLAN
  else if (path.startsWith("/api/user/trip-plans/") && req.method === "PUT") {
    const planId = path.split("/")[4];

    if (!planId || isNaN(planId)) {
      sendJSON(res, 400, { success: false, error: "Valid Plan ID required" });
      return true;
    }

    try {
      const body = await getRequestBody(req);
      const {
        userId,
        planName,
        destinationId,
        hotelId,
        roomId,
        transportId,
        foodCategoryId,
        activityIds,
        travelDate,
        durationDays,
        people,
        hotelCost,
        transportCost,
        foodCost,
        activitiesCost,
        totalCost,
        bookingStatus,
      } = body;

      if (
        !userId ||
        !destinationId ||
        !hotelId ||
        !roomId ||
        !transportId ||
        !foodCategoryId ||
        !travelDate
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

        const checkResult = await connection.execute(
          `SELECT plan_id FROM user_trip_plans WHERE plan_id = :plan_id AND user_id = :user_id`,
          [planId, userId],
        );

        if (checkResult.rows.length === 0) {
          sendJSON(res, 404, { success: false, error: "Trip plan not found" });
          return true;
        }

        await connection.execute(
          `UPDATE user_trip_plans SET
            plan_name = :plan_name,
            hotel_id = :hotel_id,
            room_id = :room_id,
            transport_id = :transport_id,
            food_category_id = :food_category_id,
            activity_ids = :activity_ids,
            travel_date = TO_DATE(:travel_date, 'YYYY-MM-DD'),
            duration_days = :duration_days,
            people = :people,
            hotel_cost = :hotel_cost,
            transport_cost = :transport_cost,
            food_cost = :food_cost,
            activities_cost = :activities_cost,
            total_cost = :total_cost,
            booking_status = :booking_status,
            last_modified = SYSDATE
          WHERE plan_id = :plan_id`,
          {
            plan_name: planName,
            hotel_id: hotelId,
            room_id: roomId,
            transport_id: transportId,
            food_category_id: foodCategoryId,
            activity_ids: activityIds || null,
            travel_date: travelDate,
            duration_days: durationDays,
            people: people,
            hotel_cost: hotelCost || 0,
            transport_cost: transportCost || 0,
            food_cost: foodCost || 0,
            activities_cost: activitiesCost || 0,
            total_cost: totalCost || 0,
            booking_status: bookingStatus || "planned",
            plan_id: planId,
          },
          { autoCommit: true },
        );

        sendJSON(res, 200, {
          success: true,
          message: "Trip plan updated successfully",
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
    } catch (error) {
      console.error("Request error:", error);
      sendJSON(res, 400, { success: false, error: "Invalid request data" });
      return true;
    }
  }

  // DELETE TRIP PLAN
  else if (path.startsWith("/api/user/trips/") && req.method === "DELETE") {
    const planId = path.split("/")[4];

    if (!planId) {
      sendJSON(res, 400, { success: false, error: "Plan ID required" });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `DELETE FROM user_trip_plans WHERE plan_id = :plan_id`,
        [planId],
        { autoCommit: true },
      );

      if (result.rowsAffected === 0) {
        sendJSON(res, 404, { success: false, error: "Trip plan not found" });
        return true;
      }

      sendJSON(res, 200, {
        success: true,
        message: "Trip plan deleted successfully",
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

  // USER CANCEL TRIP
  else if (path.startsWith("/api/user/trips/") && req.method === "PUT") {
    const planId = path.split("/")[4];

    if (!planId) {
      sendJSON(res, 400, { success: false, error: "Plan ID required" });
      return true;
    }

    try {
      const body = await getRequestBody(req);
      const { status, userId } = body;

      if (!status || !userId) {
        sendJSON(res, 400, {
          success: false,
          error: "Status and User ID required",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();
        await connection.execute(`SET TRANSACTION READ WRITE`);

        const bookingResult = await connection.execute(
          `SELECT 
          b.booking_id, 
          b.status, 
          b.transaction_id,
          b.payment_amount,
          b.hotel_id,
          b.room_id,
          b.transport_id,
          b.people,
          hr.max_guests
        FROM bookings b
        LEFT JOIN hotel_rooms hr ON b.room_id = hr.room_id
        WHERE b.plan_id = :plan_id AND b.user_id = :user_id`,
          [planId, userId],
        );

        const hasBooking = bookingResult.rows.length > 0;

        if (hasBooking) {
          const booking = bookingResult.rows[0];
          const bookingId = booking[0];
          const paymentStatus = booking[1];
          const transactionId = booking[2];
          const totalCost = booking[3];
          const roomId = booking[5];
          const transportId = booking[6];
          const people = booking[7];
          const maxGuests = booking[8] || 1;

          const roomsNeeded = Math.ceil(people / maxGuests);

          if (roomId) {
            await connection.execute(
              `UPDATE hotel_rooms 
             SET available_rooms = available_rooms + :rooms_needed 
             WHERE room_id = :room_id`,
              { rooms_needed: roomsNeeded, room_id: roomId },
              { autoCommit: false },
            );
          }

          if (transportId) {
            await connection.execute(
              `UPDATE transport_options 
             SET available_seats = available_seats + :people 
             WHERE transport_id = :transport_id`,
              { people: people, transport_id: transportId },
              { autoCommit: false },
            );
          }

          if (
            transactionId &&
            (paymentStatus === "pending" || paymentStatus === "confirmed")
          ) {
            await connection.execute(
              `UPDATE bookings 
             SET status = 'cancelled',
                 refund_requested = 1,
                 refund_status = 'pending',
                 refund_amount = :amount
             WHERE booking_id = :booking_id`,
              { amount: totalCost, booking_id: bookingId },
              { autoCommit: false },
            );
          } else {
            await connection.execute(
              `UPDATE bookings SET status = 'cancelled' WHERE booking_id = :booking_id`,
              [bookingId],
              { autoCommit: false },
            );
          }
        }

        await connection.execute(
          `UPDATE user_trip_plans 
         SET booking_status = :status, last_modified = SYSDATE
         WHERE plan_id = :plan_id AND user_id = :user_id`,
          { status: status, plan_id: planId, user_id: userId },
          { autoCommit: false },
        );

        await connection.commit();

        let message = "Trip cancelled successfully";
        if (hasBooking) {
          message +=
            ". " +
            (bookingResult.rows[0][2]
              ? "A refund request has been submitted for your payment."
              : " No payment was associated with this trip.");
        }

        sendJSON(res, 200, {
          success: true,
          message: message,
          refund_requested: hasBooking ? !!bookingResult.rows[0][2] : false,
        });
        return true;
      } catch (dbError) {
        if (connection) await connection.rollback();
        console.error("Database error:", dbError);
        sendJSON(res, 500, {
          success: false,
          error: "Database error: " + dbError.message,
        });
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

  // CREATE BOOKING
  else if (path === "/api/bookings" && req.method === "POST") {
    try {
      const body = await getRequestBody(req);
      const { planId, userId, paymentMethod, transactionId } = body;

      if (!planId || !userId || !paymentMethod || !transactionId) {
        sendJSON(res, 400, {
          success: false,
          error: "Missing required fields",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();
        await connection.execute(`SET TRANSACTION READ WRITE`);

        const planResult = await connection.execute(
          `SELECT 
          tp.plan_id, tp.user_id, tp.destination_id,
          tp.hotel_id, tp.room_id, tp.transport_id,
          tp.travel_date, tp.duration_days, tp.people,
          tp.hotel_cost, tp.transport_cost, tp.total_cost,
          tp.booking_status,
          hr.max_guests as room_max_guests
        FROM user_trip_plans tp
        LEFT JOIN hotel_rooms hr ON tp.room_id = hr.room_id
        WHERE tp.plan_id = :plan_id AND tp.user_id = :user_id`,
          [planId, userId],
          { autoCommit: false },
        );

        if (planResult.rows.length === 0) {
          await connection.rollback();
          sendJSON(res, 404, { success: false, error: "Trip plan not found" });
          return true;
        }

        const plan = planResult.rows[0];
        const people = plan[8];
        const roomMaxGuests = plan[13] || 1;
        const roomsNeeded = Math.ceil(people / roomMaxGuests);

        if (plan[12] === "booked" || plan[12] === "pending") {
          await connection.rollback();
          sendJSON(res, 400, {
            success: false,
            error: "Trip is already booked or pending",
          });
          return true;
        }

        const generateConfirmationNumber = () => {
          const prefix = "BK";
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase();
          return `${prefix}${timestamp}${random}`;
        };

        const confirmationNumber = generateConfirmationNumber();

        if (plan[4]) {
          const roomCheck = await connection.execute(
            `SELECT available_rooms FROM hotel_rooms WHERE room_id = :room_id`,
            [plan[4]],
          );

          if (
            roomCheck.rows.length === 0 ||
            roomCheck.rows[0][0] < roomsNeeded
          ) {
            await connection.rollback();
            sendJSON(res, 400, {
              success: false,
              error: `Not enough rooms available. Need ${roomsNeeded} rooms.`,
            });
            return true;
          }

          await connection.execute(
            `UPDATE hotel_rooms 
           SET available_rooms = available_rooms - :rooms_needed 
           WHERE room_id = :room_id AND available_rooms >= :rooms_needed`,
            { rooms_needed: roomsNeeded, room_id: plan[4] },
            { autoCommit: false },
          );
        }

        if (plan[5]) {
          const seatCheck = await connection.execute(
            `SELECT available_seats FROM transport_options WHERE transport_id = :transport_id`,
            [plan[5]],
          );

          if (seatCheck.rows.length === 0 || seatCheck.rows[0][0] < people) {
            await connection.rollback();
            sendJSON(res, 400, {
              success: false,
              error: `Not enough seats available. Need ${people} seats.`,
            });
            return true;
          }

          await connection.execute(
            `UPDATE transport_options 
           SET available_seats = available_seats - :people 
           WHERE transport_id = :transport_id AND available_seats >= :people`,
            { people: people, transport_id: plan[5] },
            { autoCommit: false },
          );
        }

        const bookingResult = await connection.execute(
          `INSERT INTO bookings (
          plan_id, user_id, destination_id,
          hotel_id, room_id, transport_id,
          travel_date, duration_days, people,
          payment_amount, payment_method, transaction_id,
          status, booking_date, confirmation_number
        ) VALUES (
          :plan_id, :user_id, :destination_id,
          :hotel_id, :room_id, :transport_id,
          :travel_date, :duration_days, :people,
          :payment_amount, :payment_method, :transaction_id,
          'pending', SYSDATE, :confirmation_number
        ) RETURNING booking_id INTO :booking_id`,
          {
            plan_id: plan[0],
            user_id: plan[1],
            destination_id: plan[2],
            hotel_id: plan[3],
            room_id: plan[4],
            transport_id: plan[5],
            travel_date: plan[6],
            duration_days: plan[7],
            people: people,
            payment_amount: Number(plan[9] || 0) + Number(plan[10] || 0),
            payment_method: paymentMethod,
            transaction_id: transactionId,
            confirmation_number: confirmationNumber,
            booking_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: false },
        );

        await connection.execute(
          `UPDATE user_trip_plans 
         SET booking_status = 'pending',
             last_modified = SYSDATE,
             payment_method = :payment_method,
             transaction_id = :transaction_id
         WHERE plan_id = :plan_id`,
          {
            payment_method: paymentMethod,
            transaction_id: transactionId,
            plan_id: planId,
          },
          { autoCommit: false },
        );

        await connection.commit();

        const bookingId = bookingResult.outBinds.booking_id[0];

        sendJSON(res, 201, {
          success: true,
          message: "Booking request submitted. Awaiting admin confirmation.",
          booking_id: bookingId,
          confirmation_number: confirmationNumber,
          status: "pending",
          rooms_needed: roomsNeeded,
        });
        return true;
      } catch (dbError) {
        if (connection) await connection.rollback();
        console.error("Database error:", dbError);
        sendJSON(res, 500, {
          success: false,
          error: "Database error: " + dbError.message,
        });
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

  // GET USER'S BOOKINGS
  else if (path === "/api/bookings" && req.method === "GET") {
    const userId = parsedUrl.searchParams.get("userId");

    if (!userId) {
      sendJSON(res, 400, { success: false, error: "User ID required" });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
          b.booking_id, b.booking_date, b.payment_method, b.transaction_id,
          b.status, b.payment_amount, b.travel_date, b.duration_days, b.people,
          b.confirmation_number,
          d.dest_id, d.name as destination_name, d.location, d.image_url,
          h.hotel_id, h.name as hotel_name,
          hr.room_id, hr.room_type,
          tr.transport_id, tr.company as transport_company, tr.type as transport_type,
          tp.plan_id, tp.plan_name
        FROM bookings b
        JOIN destinations d ON b.destination_id = d.dest_id
        LEFT JOIN hotels h ON b.hotel_id = h.hotel_id
        LEFT JOIN hotel_rooms hr ON b.room_id = hr.room_id
        LEFT JOIN transport_options tr ON b.transport_id = tr.transport_id
        LEFT JOIN user_trip_plans tp ON b.plan_id = tp.plan_id
        WHERE b.user_id = :user_id
        ORDER BY b.booking_date DESC`,
        [userId],
      );

      const bookings = result.rows.map((row) => ({
        id: row[0],
        bookingDate: row[1],
        paymentMethod: row[2],
        transactionId: row[3],
        paymentStatus: row[4],
        totalCost: row[5],
        travelDate: row[6],
        durationDays: row[7],
        people: row[8],
        confirmationNumber: row[9],
        destination: {
          id: row[10],
          name: row[11],
          location: row[12],
          image: row[13],
        },
        hotel: row[14] ? { id: row[14], name: row[15] } : null,
        room: row[16] ? { id: row[16], type: row[17] } : null,
        transport: row[18]
          ? { id: row[18], company: row[19], type: row[20] }
          : null,
        plan: row[21] ? { id: row[21], name: row[22] } : null,
      }));

      sendJSON(res, 200, { success: true, count: bookings.length, bookings });
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
  else if (path.startsWith("/api/bookings/") && req.method === "GET") {
    const bookingId = path.split("/")[3];

    if (!bookingId) {
      sendJSON(res, 400, { success: false, error: "Booking ID required" });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
          b.booking_id, b.booking_date, b.payment_method, b.transaction_id,
          b.status, b.payment_amount, b.travel_date, b.duration_days, b.people,
          b.confirmation_number,
          d.dest_id, d.name, d.location, d.description, d.image_url,
          h.hotel_id, h.name, h.address, h.phone, h.base_rating,
          hr.room_id, hr.room_type, hr.bed_type, hr.price_per_night, hr.meals_included,
          tr.transport_id, tr.company, tr.type, tr.price_per_person,
          tr.departure_time, tr.arrival_time, tr.duration,
          tp.plan_id, tp.plan_name
        FROM bookings b
        JOIN destinations d ON b.destination_id = d.dest_id
        LEFT JOIN hotels h ON b.hotel_id = h.hotel_id
        LEFT JOIN hotel_rooms hr ON b.room_id = hr.room_id
        LEFT JOIN transport_options tr ON b.transport_id = tr.transport_id
        LEFT JOIN user_trip_plans tp ON b.plan_id = tp.plan_id
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
        bookingDate: row[1],
        paymentMethod: row[2],
        transactionId: row[3],
        paymentStatus: row[4],
        totalCost: row[5],
        travelDate: row[6],
        durationDays: row[7],
        people: row[8],
        confirmationNumber: row[9],
        destination: {
          id: row[10],
          name: row[11],
          location: row[12],
          description: row[13],
          image: row[14],
        },
        hotel: row[15]
          ? {
              id: row[15],
              name: row[16],
              address: row[17],
              phone: row[18],
              rating: row[19],
            }
          : null,
        room: row[20]
          ? {
              id: row[20],
              type: row[21],
              bed: row[22],
              price: row[23],
              meals: row[24],
            }
          : null,
        transport: row[25]
          ? {
              id: row[25],
              company: row[26],
              type: row[27],
              price: row[28],
              departure: row[29],
              arrival: row[30],
              duration: row[31],
            }
          : null,
        plan: row[32] ? { id: row[32], name: row[33] } : null,
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

  // CHECK DESTINATION RATING
  else if (path === "/api/ratings/check" && req.method === "GET") {
    const userId = parsedUrl.searchParams.get("userId");
    const destId = parsedUrl.searchParams.get("destId");

    if (!userId || !destId) {
      sendJSON(res, 400, {
        success: false,
        error: "User ID and Destination ID required",
      });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        `SELECT rating_id FROM ratings WHERE user_id = :user_id AND dest_id = :dest_id`,
        [userId, destId],
      );

      sendJSON(res, 200, { success: true, exists: result.rows.length > 0 });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // CHECK HOTEL RATING
  else if (path === "/api/hotel-ratings/check" && req.method === "GET") {
    const userId = parsedUrl.searchParams.get("userId");
    const hotelId = parsedUrl.searchParams.get("hotelId");

    if (!userId || !hotelId) {
      sendJSON(res, 400, {
        success: false,
        error: "User ID and Hotel ID required",
      });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        `SELECT hotel_rating_id FROM hotel_ratings WHERE user_id = :user_id AND hotel_id = :hotel_id`,
        [userId, hotelId],
      );

      sendJSON(res, 200, { success: true, exists: result.rows.length > 0 });
      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // SUBMIT DESTINATION RATING
  else if (path === "/api/ratings" && req.method === "POST") {
    try {
      const body = await getRequestBody(req);
      const { userId, destId, rating, review } = body;

      if (!userId || !destId || !rating) {
        sendJSON(res, 400, {
          success: false,
          error: "Missing required fields",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const checkResult = await connection.execute(
          `SELECT rating_id FROM ratings WHERE user_id = :user_id AND dest_id = :dest_id`,
          [userId, destId],
        );

        if (checkResult.rows.length > 0) {
          await connection.execute(
            `UPDATE ratings SET rating = :rating, review = :review, review_date = SYSDATE 
             WHERE user_id = :user_id AND dest_id = :dest_id`,
            { rating, review, user_id: userId, dest_id: destId },
            { autoCommit: true },
          );
        } else {
          await connection.execute(
            `INSERT INTO ratings (user_id, dest_id, rating, review, review_date)
             VALUES (:user_id, :dest_id, :rating, :review, SYSDATE)`,
            { user_id: userId, dest_id: destId, rating, review },
            { autoCommit: true },
          );
        }

        sendJSON(res, 200, {
          success: true,
          message: "Rating submitted successfully",
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

  // SUBMIT HOTEL RATING
  else if (path === "/api/hotel-ratings" && req.method === "POST") {
    try {
      const body = await getRequestBody(req);
      const { userId, hotelId, rating, review } = body;

      if (!userId || !hotelId || !rating) {
        sendJSON(res, 400, {
          success: false,
          error: "Missing required fields",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        const checkResult = await connection.execute(
          `SELECT hotel_rating_id FROM hotel_ratings WHERE user_id = :user_id AND hotel_id = :hotel_id`,
          [userId, hotelId],
        );

        if (checkResult.rows.length > 0) {
          await connection.execute(
            `UPDATE hotel_ratings SET rating = :rating, review = :review, review_date = SYSDATE 
             WHERE user_id = :user_id AND hotel_id = :hotel_id`,
            { rating, review, user_id: userId, hotel_id: hotelId },
            { autoCommit: true },
          );
        } else {
          await connection.execute(
            `INSERT INTO hotel_ratings (user_id, hotel_id, rating, review, review_date)
             VALUES (:user_id, :hotel_id, :rating, :review, SYSDATE)`,
            { user_id: userId, hotel_id: hotelId, rating, review },
            { autoCommit: true },
          );
        }

        sendJSON(res, 200, {
          success: true,
          message: "Hotel rating submitted successfully",
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

  return false;
};
