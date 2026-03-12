module.exports = async (req, res, parsedUrl, path, helpers) => {
  const { getConnection, getRequestBody, sendJSON } = helpers;

  // GET ALL DESTINATIONS
  if (path === "/api/destinations" && req.method === "GET") {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        `SELECT 
          d.dest_id, 
          d.name, 
          d.location, 
          d.description, 
          d.best_time_to_visit, 
          d.image_url, 
          d.distance_from_dhaka,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(r.rating_id) as review_count
        FROM destinations d
        LEFT JOIN ratings r ON d.dest_id = r.dest_id
        GROUP BY 
          d.dest_id, 
          d.name, 
          d.location, 
          d.description, 
          d.best_time_to_visit, 
          d.image_url, 
          d.distance_from_dhaka
        ORDER BY avg_rating DESC`,
      );

      const destinations = result.rows.map((row) => ({
        id: row[0],
        name: row[1],
        location: row[2],
        description: row[3],
        best_time: row[4],
        image: row[5],
        distance: row[6],
        rating: parseFloat(row[7] || 0),
        reviewCount: row[8] || 0,
      }));

      sendJSON(res, 200, { success: true, destinations });
      return true;
    } catch (error) {
      console.error("Database error:", error);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET SINGLE DESTINATION
  else if (
    path.startsWith("/api/destinations/") &&
    !path.includes("/hotels") &&
    !path.includes("/transport") &&
    !path.includes("/activities") &&
    req.method === "GET"
  ) {
    const destId = path.split("/")[3];
    if (!destId) {
      sendJSON(res, 400, { success: false, error: "Destination ID required" });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        `SELECT 
          d.dest_id, 
          d.name, 
          d.location, 
          d.description, 
          d.best_time_to_visit, 
          d.image_url, 
          d.distance_from_dhaka,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(r.rating_id) as review_count
        FROM destinations d
        LEFT JOIN ratings r ON d.dest_id = r.dest_id
        WHERE d.dest_id = :id
        GROUP BY 
          d.dest_id, 
          d.name, 
          d.location, 
          d.description, 
          d.best_time_to_visit, 
          d.image_url, 
          d.distance_from_dhaka`,
        [destId],
      );

      if (result.rows.length === 0) {
        sendJSON(res, 404, { success: false, error: "Destination not found" });
        return true;
      }

      const row = result.rows[0];
      const destination = {
        id: row[0],
        name: row[1],
        location: row[2],
        description: row[3],
        best_time: row[4],
        image: row[5],
        distance: row[6],
        rating: parseFloat(row[7] || 0),
        reviewCount: row[8] || 0,
      };

      sendJSON(res, 200, { success: true, destination });
      return true;
    } catch (error) {
      console.error("Database error:", error);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET INTERESTS
  else if (path === "/api/interests" && req.method === "GET") {
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
    } catch (error) {
      console.error("Database error:", error);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET HOTELS FOR DESTINATION
  else if (
    path.startsWith("/api/destinations/") &&
    path.includes("/hotels") &&
    req.method === "GET"
  ) {
    const destId = path.split("/")[3];
    if (!destId) {
      sendJSON(res, 400, { success: false, error: "Destination ID required" });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
          h.hotel_id, 
          h.name, 
          h.description, 
          h.address, 
          h.phone,
          h.distance_from_center, 
          h.amenities, 
          h.image_url,
          h.check_in_time, 
          h.check_out_time,
          hr.room_id, 
          hr.room_type, 
          hr.bed_type, 
          hr.price_per_night,
          hr.max_guests, 
          hr.meals_included, 
          hr.has_ac, 
          hr.available_rooms
        FROM hotels h
        LEFT JOIN hotel_rooms hr ON h.hotel_id = hr.hotel_id
        WHERE h.dest_id = :dest_id
        ORDER BY h.name, hr.price_per_night`,
        [destId],
      );

      // Group rooms by hotel
      const hotelsMap = new Map();

      result.rows.forEach((row) => {
        const hotelId = row[0];

        if (!hotelsMap.has(hotelId)) {
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
            rooms: [],
          });
        }

        if (row[10]) {
          const hotel = hotelsMap.get(hotelId);
          hotel.rooms.push({
            id: row[10],
            type: row[11],
            bed: row[12],
            price: row[13],
            max_guests: row[14],
            meals: row[15] || "None",
            ac: row[16] === 1,
            available: row[17] || 0,
          });
        }
      });

      // Get ratings for each hotel
      const hotels = Array.from(hotelsMap.values());
      for (const hotel of hotels) {
        const ratingResult = await connection.execute(
          `SELECT COALESCE(AVG(rating), 0), COUNT(*) FROM hotel_ratings WHERE hotel_id = :hotel_id`,
          [hotel.id],
        );
        hotel.rating = parseFloat(ratingResult.rows[0][0] || 0);
        hotel.reviewCount = ratingResult.rows[0][1] || 0;
      }

      sendJSON(res, 200, { success: true, count: hotels.length, hotels });
      return true;
    } catch (error) {
      console.error("Error fetching hotels:", error);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET TRANSPORT FOR DESTINATION
  else if (
    path.startsWith("/api/destinations/") &&
    path.includes("/transport") &&
    req.method === "GET"
  ) {
    const destId = path.split("/")[3];
    if (!destId) {
      sendJSON(res, 400, { success: false, error: "Destination ID required" });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT 
          transport_id, type, company, price_per_person, 
          duration, comfort_level, departure_city, available_seats,
          departure_time, arrival_time
        FROM transport_options
        WHERE dest_id = :dest_id
        ORDER BY price_per_person`,
        [destId],
      );

      const transport = result.rows.map((row) => ({
        id: row[0],
        type: row[1],
        company: row[2],
        price: row[3],
        duration: row[4],
        comfort: row[5],
        from: row[6] || "Dhaka",
        seats: row[7] || 0,
        departure_time: row[8] || null,
        arrival_time: row[9] || null,
      }));

      sendJSON(res, 200, { success: true, transport });
      return true;
    } catch (error) {
      console.error("Error fetching transport:", error);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET ACTIVITIES FOR DESTINATION
  else if (
    path.startsWith("/api/destinations/") &&
    path.includes("/activities") &&
    req.method === "GET"
  ) {
    const destId = path.split("/")[3];
    if (!destId) {
      sendJSON(res, 400, { success: false, error: "Destination ID required" });
      return true;
    }

    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        `SELECT 
          activity_id, name, description, cost_per_person, 
          duration_hours, interest_type, image_url
        FROM activities
        WHERE dest_id = :dest_id
        ORDER BY cost_per_person`,
        [destId],
      );

      const activities = result.rows.map((row) => ({
        id: row[0],
        name: row[1],
        description: row[2],
        cost: row[3],
        duration: row[4],
        interest: row[5],
        image: row[6],
        isFree: row[3] === 0,
      }));

      sendJSON(res, 200, { success: true, activities });
      return true;
    } catch (error) {
      console.error("Error fetching activities:", error);
      sendJSON(res, 500, { success: false, error: "Database error" });
      return true;
    } finally {
      if (connection) await connection.close();
    }
  }

  // GET COMPLETE DESTINATION DETAILS
  else if (path === "/api/destination-details" && req.method === "POST") {
    try {
      const body = await getRequestBody(req);
      const { destId, budget, days, people } = body;

      if (!destId) {
        sendJSON(res, 400, {
          success: false,
          error: "Destination ID required",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        // Get destination info with rating
        const destResult = await connection.execute(
          `SELECT 
            d.dest_id, d.name, d.location, d.description, d.best_time_to_visit, 
            d.image_url, d.distance_from_dhaka,
            COALESCE(AVG(r.rating), 0) as avg_rating,
            COUNT(r.rating_id) as review_count
          FROM destinations d
          LEFT JOIN ratings r ON d.dest_id = r.dest_id
          WHERE d.dest_id = :dest_id
          GROUP BY 
            d.dest_id, d.name, d.location, d.description, 
            d.best_time_to_visit, d.image_url, d.distance_from_dhaka`,
          [destId],
        );

        if (destResult.rows.length === 0) {
          sendJSON(res, 404, {
            success: false,
            error: "Destination not found",
          });
          return true;
        }

        const dest = destResult.rows[0];
        const destination = {
          id: dest[0],
          name: dest[1],
          location: dest[2],
          description: dest[3],
          best_time: dest[4],
          image: dest[5],
          distance: dest[6],
          rating: parseFloat(dest[7] || 0),
          reviewCount: dest[8] || 0,
        };

        // Get hotels with rooms and ratings
        const hotelResult = await connection.execute(
          `SELECT 
            h.hotel_id, h.name, h.description, h.address, h.phone,
            h.distance_from_center, h.amenities, h.image_url, 
            h.check_in_time, h.check_out_time,
            hr.room_id, hr.room_type, hr.bed_type, hr.price_per_night,
            hr.max_guests, hr.meals_included, hr.has_ac, hr.available_rooms
          FROM hotels h
          LEFT JOIN hotel_rooms hr ON h.hotel_id = hr.hotel_id
          WHERE h.dest_id = :dest_id
          ORDER BY h.name, hr.price_per_night`,
          [destId],
        );

        const hotelsMap = new Map();
        hotelResult.rows.forEach((row) => {
          const hotelId = row[0];
          if (!hotelsMap.has(hotelId)) {
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
              rooms: [],
            });
          }
          if (row[10]) {
            const hotel = hotelsMap.get(hotelId);
            hotel.rooms.push({
              id: row[10],
              type: row[11],
              bed: row[12],
              price: row[13],
              max_guests: row[14],
              meals: row[15] || "None",
              ac: row[16] === 1,
              available: row[17] || 0,
            });
          }
        });

        const hotels = Array.from(hotelsMap.values());
        for (const hotel of hotels) {
          const ratingResult = await connection.execute(
            `SELECT COALESCE(AVG(rating), 0), COUNT(*) FROM hotel_ratings WHERE hotel_id = :hotel_id`,
            [hotel.id],
          );
          hotel.rating = parseFloat(ratingResult.rows[0][0] || 0);
          hotel.reviewCount = ratingResult.rows[0][1] || 0;
        }

        // Get transport options
        const transportResult = await connection.execute(
          `SELECT 
            transport_id, type, company, price_per_person, 
            duration, comfort_level, departure_city, available_seats,
            departure_time, arrival_time
          FROM transport_options
          WHERE dest_id = :dest_id
          ORDER BY price_per_person`,
          [destId],
        );

        const transport = transportResult.rows.map((row) => ({
          id: row[0],
          type: row[1],
          company: row[2],
          price: row[3],
          duration: row[4],
          comfort: row[5],
          from: row[6] || "Dhaka",
          seats: row[7] || 0,
          departure_time: row[8] || null,
          arrival_time: row[9] || null,
        }));

        // Get food categories
        const foodResult = await connection.execute(
          `SELECT category_id, name, breakfast_cost, lunch_cost, dinner_cost, daily_cost_per_person
           FROM food_categories
           ORDER BY daily_cost_per_person`,
        );

        const foodCategories = foodResult.rows.map((row) => ({
          id: row[0],
          name: row[1],
          breakfast: row[2],
          lunch: row[3],
          dinner: row[4],
          daily: row[5],
        }));

        // Get activities
        const activityResult = await connection.execute(
          `SELECT 
            activity_id, name, description, cost_per_person, 
            duration_hours, interest_type, image_url
          FROM activities
          WHERE dest_id = :dest_id
          ORDER BY cost_per_person`,
          [destId],
        );

        const activities = activityResult.rows.map((row) => ({
          id: row[0],
          name: row[1],
          description: row[2],
          cost: row[3],
          duration: row[4],
          interest: row[5],
          image: row[6],
          isFree: row[3] === 0,
        }));

        // Calculate budget info if provided
        let budgetInfo = null;
        if (budget && days && people) {
          const nights = Math.max(0, days - 1);

          const cheapestHotelPrice = Math.min(
            ...hotels.flatMap((h) => h.rooms.map((r) => r.price)),
          );

          const cheapestTransportPrice = Math.min(
            ...transport.map((t) => t.price),
          );

          const minHotelCost = cheapestHotelPrice
            ? cheapestHotelPrice * nights * people
            : 0;
          const minTransportCost = cheapestTransportPrice
            ? cheapestTransportPrice * people * 2
            : 0;

          budgetInfo = {
            totalBudget: budget,
            minHotelCost,
            minTransportCost,
            minTotal: minHotelCost + minTransportCost,
            remainingForFood: budget - (minHotelCost + minTransportCost),
          };
        }

        sendJSON(res, 200, {
          success: true,
          destination,
          hotels,
          transport,
          foodCategories,
          activities,
          budgetInfo,
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

  // GET RECOMMENDATIONS
  else if (path === "/api/recommendations" && req.method === "POST") {
    try {
      const body = await getRequestBody(req);
      const { budget, days, people, interests } = body;

      if (!budget || !days || !people || !interests || interests.length === 0) {
        sendJSON(res, 400, {
          success: false,
          error: "Budget, days, people, and interests are required",
        });
        return true;
      }

      let connection;
      try {
        connection = await getConnection();

        // Get all destinations with ratings
        const destResult = await connection.execute(
          `SELECT 
            d.dest_id, d.name, d.location, d.description, d.best_time_to_visit, 
            d.image_url, d.distance_from_dhaka,
            COALESCE(AVG(r.rating), 0) as avg_rating,
            COUNT(r.rating_id) as review_count
          FROM destinations d
          LEFT JOIN ratings r ON d.dest_id = r.dest_id
          GROUP BY 
            d.dest_id, d.name, d.location, d.description, 
            d.best_time_to_visit, d.image_url, d.distance_from_dhaka`,
        );

        const destinations = destResult.rows.map((row) => ({
          id: row[0],
          name: row[1],
          location: row[2],
          description: row[3],
          best_time: row[4],
          image: row[5],
          distance: row[6],
          rating: parseFloat(row[7] || 0),
          reviewCount: row[8] || 0,
        }));

        // Get interests for each destination
        const destWithInterests = await Promise.all(
          destinations.map(async (dest) => {
            const intResult = await connection.execute(
              `SELECT i.interest_id, i.name, i.icon
               FROM interests i
               JOIN destination_interests di ON i.interest_id = di.interest_id
               WHERE di.dest_id = :dest_id`,
              [dest.id],
            );

            const destInterests = intResult.rows.map((row) => ({
              id: row[0],
              name: row[1],
              icon: row[2],
            }));

            return { ...dest, interests: destInterests };
          }),
        );

        // Filter by user interests
        let matchingDests = destWithInterests.filter((dest) =>
          dest.interests.some((interest) => interests.includes(interest.id)),
        );

        // For 1-day trips, filter by travel time
        const MAX_TRAVEL_TIME_HOURS = 6;
        const getTravelTime = (distance) => Math.round(distance / 50);

        if (days === 1) {
          matchingDests = matchingDests.filter((dest) => {
            const travelTime = getTravelTime(dest.distance);
            return travelTime <= MAX_TRAVEL_TIME_HOURS;
          });
        }

        // For each matching destination, get options and calculate costs
        const recommendations = await Promise.all(
          matchingDests.map(async (dest) => {
            const travelTime = getTravelTime(dest.distance);

            // Get hotels with rooms and ratings
            const hotelResult = await connection.execute(
              `SELECT 
                h.hotel_id, h.name, h.description, h.address, h.phone,
                h.distance_from_center, h.amenities, h.image_url,
                hr.room_id, hr.room_type, hr.bed_type, hr.price_per_night,
                hr.max_guests, hr.meals_included, hr.has_ac, hr.available_rooms
              FROM hotels h
              LEFT JOIN hotel_rooms hr ON h.hotel_id = hr.hotel_id
              WHERE h.dest_id = :dest_id
              ORDER BY hr.price_per_night`,
              [dest.id],
            );

            const hotels = {};
            hotelResult.rows.forEach((row) => {
              const hotelId = row[0];
              if (!hotels[hotelId]) {
                hotels[hotelId] = {
                  id: hotelId,
                  name: row[1],
                  description: row[2],
                  address: row[3],
                  phone: row[4],
                  distance: row[5],
                  amenities: row[6] ? row[6].split(",") : [],
                  image: row[7],
                  rooms: [],
                };
              }
              if (row[8]) {
                hotels[hotelId].rooms.push({
                  id: row[8],
                  type: row[9],
                  bed: row[10],
                  price: row[11],
                  max_guests: row[12],
                  meals: row[13] || "None",
                  ac: row[14] === 1,
                  available: row[15] || 0,
                });
              }
            });

            const hotelList = Object.values(hotels);

            // Get transport options
            const transportResult = await connection.execute(
              `SELECT 
                transport_id, type, company, price_per_person, 
                duration, comfort_level, departure_city, available_seats
              FROM transport_options
              WHERE dest_id = :dest_id
              ORDER BY price_per_person`,
              [dest.id],
            );

            const transport = transportResult.rows.map((row) => ({
              id: row[0],
              type: row[1],
              company: row[2],
              price: row[3],
              duration: row[4],
              comfort: row[5],
              from: row[6] || "Dhaka",
              seats: row[7] || 0,
            }));

            // Get activities
            const activityResult = await connection.execute(
              `SELECT 
                activity_id, name, description, cost_per_person, 
                duration_hours, interest_type, image_url
              FROM activities
              WHERE dest_id = :dest_id
              ORDER BY cost_per_person`,
              [dest.id],
            );

            const activities = activityResult.rows.map((row) => ({
              id: row[0],
              name: row[1],
              description: row[2],
              cost: row[3],
              duration: row[4],
              interest: row[5],
              image: row[6],
              isFree: row[3] === 0,
            }));

            // Calculate minimum possible cost
            const nights = Math.max(0, days - 1);
            const cheapestHotelPrice =
              hotelList.length > 0
                ? Math.min(
                    ...hotelList.flatMap((h) => h.rooms.map((r) => r.price)),
                  )
                : null;
            const cheapestTransportPrice =
              transport.length > 0
                ? Math.min(...transport.map((t) => t.price))
                : null;

            const minHotelCost = cheapestHotelPrice
              ? cheapestHotelPrice * nights * people
              : 0;
            const minTransportCost = cheapestTransportPrice
              ? cheapestTransportPrice * people * 2
              : 0;
            const minimumTotal = minHotelCost + minTransportCost;

            // Count hotels by price range
            const hotelCounts = {
              budget: hotelList.filter((h) =>
                h.rooms.some((r) => r.price * nights * people <= budget * 0.3),
              ).length,
              mid: hotelList.filter((h) =>
                h.rooms.some((r) => r.price * nights * people <= budget * 0.5),
              ).length,
              premium: hotelList.filter((h) =>
                h.rooms.some((r) => r.price * nights * people <= budget * 0.7),
              ).length,
              total: hotelList.length,
            };

            const transportCounts = {
              budget: transport.filter((t) => t.price * people <= budget * 0.2)
                .length,
              standard: transport.filter(
                (t) => t.price * people <= budget * 0.3,
              ).length,
              total: transport.length,
            };

            return {
              destination: {
                id: dest.id,
                name: dest.name,
                location: dest.location,
                description: dest.description,
                best_time: dest.best_time,
                image: dest.image,
                rating: dest.rating,
                reviewCount: dest.reviewCount,
                distance: dest.distance,
                travelTime: days === 1 ? travelTime : null,
                interests: dest.interests,
              },
              stats: {
                hotels: hotelCounts,
                transport: transportCounts,
                activities: {
                  total: activities.length,
                  free: activities.filter((a) => a.isFree).length,
                  paid: activities.filter((a) => !a.isFree).length,
                },
                minHotelPrice: cheapestHotelPrice
                  ? Math.round(cheapestHotelPrice)
                  : 0,
                minTransportPrice: cheapestTransportPrice
                  ? Math.round(cheapestTransportPrice)
                  : 0,
                minimumTotal: Math.round(minimumTotal),
                isFeasible: minimumTotal <= budget * 1.2,
              },
              options: {
                hotels: hotelList.slice(0, 3),
                transport: transport.slice(0, 3),
                activities: activities.slice(0, 3),
              },
            };
          }),
        );

        // Filter feasible and sort
        const feasibleRecs = recommendations.filter((r) => r.stats.isFeasible);
        const sorted = feasibleRecs.sort(
          (a, b) => a.stats.minimumTotal - b.stats.minimumTotal,
        );

        sendJSON(res, 200, {
          success: true,
          count: sorted.length,
          recommendations: sorted,
          userInput: { budget, days, people, interests },
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

  return false;
};
