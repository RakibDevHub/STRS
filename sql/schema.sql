-- ============================================
-- 1. USERS TABLE
-- ============================================
DROP TABLE users CASCADE CONSTRAINTS;
CREATE TABLE users (
    user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    phone VARCHAR2(20),
    password VARCHAR2(255) NOT NULL,
    salt VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE
);

-- ============================================
-- 2. INTERESTS TABLE
-- ============================================
DROP TABLE interests CASCADE CONSTRAINTS;
CREATE TABLE interests (
    interest_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(50) UNIQUE NOT NULL,
    icon VARCHAR2(10)
);

INSERT INTO interests (name, icon) VALUES ('beach', '🏖️');
INSERT INTO interests (name, icon) VALUES ('hill', '⛰️');
INSERT INTO interests (name, icon) VALUES ('forest', '🌳');
INSERT INTO interests (name, icon) VALUES ('historical', '🏛️');
INSERT INTO interests (name, icon) VALUES ('lake', '💧');
INSERT INTO interests (name, icon) VALUES ('tea', '🍃');
INSERT INTO interests (name, icon) VALUES ('adventure', '🧗');
INSERT INTO interests (name, icon) VALUES ('food', '🍛');
INSERT INTO interests (name, icon) VALUES ('wildlife', '🐅');
INSERT INTO interests (name, icon) VALUES ('cultural', '🎭');

COMMIT;

-- ============================================
-- 3. DESTINATIONS TABLE (10 destinations)
-- ============================================
DROP TABLE destinations CASCADE CONSTRAINTS;
CREATE TABLE destinations (
    dest_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    location VARCHAR2(100),
    description VARCHAR2(2000),
    best_time_to_visit VARCHAR2(100),
    image_url VARCHAR2(500),
    distance_from_dhaka NUMBER, -- km
    popular_rating NUMBER(2,1) DEFAULT 0
);

INSERT INTO destinations (name, location, description, best_time_to_visit, image_url, distance_from_dhaka, popular_rating) VALUES 
('Cox''s Bazar', 'Chittagong', 'World''s longest natural sea beach stretching 120 km along the Bay of Bengal. Famous for sunsets, seafood, and marine drive.', 'Nov-Feb', '/destinations/coxsbazar.jpg', 400, 4.5);

INSERT INTO destinations (name, location, description, best_time_to_visit, image_url, distance_from_dhaka, popular_rating) VALUES 
('Sajek Valley', 'Rangamati', 'Beautiful hill station known as the ''Queen of Hills'' with stunning cloud views and indigenous culture.', 'Oct-Dec', '/destinations/sajek.jpg', 350, 4.3);

INSERT INTO destinations (name, location, description, best_time_to_visit, image_url, distance_from_dhaka, popular_rating) VALUES 
('Sundarbans', 'Khulna', 'Largest mangrove forest in the world, home to the Royal Bengal Tiger. UNESCO World Heritage Site.', 'Nov-Feb', '/destinations/sundarbans.jpg', 350, 4.7);

INSERT INTO destinations (name, location, description, best_time_to_visit, image_url, distance_from_dhaka, popular_rating) VALUES 
('Bandarban', 'Chittagong Hill Tracts', 'Scenic hill district with highest peaks of Bangladesh. Home to Nilgiri, Chimbuk Hill, and Buddhist temples.', 'Oct-Mar', '/destinations/bandarban.jpg', 340, 4.4);

INSERT INTO destinations (name, location, description, best_time_to_visit, image_url, distance_from_dhaka, popular_rating) VALUES 
('Saint Martin', 'Cox''s Bazar', 'Only coral island in Bangladesh. Crystal clear water, coral reefs, and amazing marine life. Perfect for snorkeling.', 'Dec-Feb', '/destinations/saintmartin.jpg', 420, 4.6);

INSERT INTO destinations (name, location, description, best_time_to_visit, image_url, distance_from_dhaka, popular_rating) VALUES 
('Sylhet', 'Sylhet', 'Tea garden city with rolling green hills, tea estates, and shrines. Known as the ''City of Saints''.', 'Nov-Feb', '/destinations/sylhet.jpg', 300, 4.5);

INSERT INTO destinations (name, location, description, best_time_to_visit, image_url, distance_from_dhaka, popular_rating) VALUES 
('Srimangal', 'Sylhet', 'Tea capital of Bangladesh. Famous for tea gardens, lemon orchards, and rainforest.', 'Nov-Feb', '/destinations/srimangal.jpg', 200, 4.6);

INSERT INTO destinations (name, location, description, best_time_to_visit, image_url, distance_from_dhaka, popular_rating) VALUES 
('Rangamati', 'Chittagong Hill Tracts', 'Beautiful lake district with Kaptai Lake, hanging bridge, and indigenous culture. Perfect for boat rides.', 'Oct-Mar', '/destinations/rangamati.jpg', 310, 4.3);

INSERT INTO destinations (name, location, description, best_time_to_visit, image_url, distance_from_dhaka, popular_rating) VALUES 
('Kuakata', 'Patuakhali', 'Rare beach where you can see both sunrise and sunset from the sea. Known as the ''Daughter of the Sea''.', 'Nov-Feb', '/destinations/kuakata.jpg', 320, 4.4);

INSERT INTO destinations (name, location, description, best_time_to_visit, image_url, distance_from_dhaka, popular_rating) VALUES 
('Bagerhat', 'Khulna', 'Historic city with 60 domed mosque and UNESCO World Heritage sites. Built by Khan Jahan Ali.', 'Nov-Feb', '/destinations/bagerhat.jpg', 330, 4.3);

COMMIT;

-- ============================================
-- 4. DESTINATION_INTERESTS (Many-to-many)
-- ============================================
DROP TABLE destination_interests CASCADE CONSTRAINTS;
CREATE TABLE destination_interests (
    dest_id NUMBER,
    interest_id NUMBER,
    PRIMARY KEY (dest_id, interest_id),
    FOREIGN KEY (dest_id) REFERENCES destinations(dest_id) ON DELETE CASCADE,
    FOREIGN KEY (interest_id) REFERENCES interests(interest_id) ON DELETE CASCADE
);

-- Cox's Bazar (dest_id=1) - beach, food, adventure
INSERT INTO destination_interests VALUES (1, 1); -- beach
INSERT INTO destination_interests VALUES (1, 8); -- food
INSERT INTO destination_interests VALUES (1, 7); -- adventure

-- Sajek Valley (dest_id=2) - hill, adventure, cultural
INSERT INTO destination_interests VALUES (2, 2); -- hill
INSERT INTO destination_interests VALUES (2, 7); -- adventure
INSERT INTO destination_interests VALUES (2, 10); -- cultural

-- Sundarbans (dest_id=3) - forest, wildlife, adventure
INSERT INTO destination_interests VALUES (3, 3); -- forest
INSERT INTO destination_interests VALUES (3, 9); -- wildlife
INSERT INTO destination_interests VALUES (3, 7); -- adventure

-- Bandarban (dest_id=4) - hill, adventure, lake
INSERT INTO destination_interests VALUES (4, 2); -- hill
INSERT INTO destination_interests VALUES (4, 7); -- adventure
INSERT INTO destination_interests VALUES (4, 5); -- lake

-- Saint Martin (dest_id=5) - beach, food, wildlife
INSERT INTO destination_interests VALUES (5, 1); -- beach
INSERT INTO destination_interests VALUES (5, 8); -- food
INSERT INTO destination_interests VALUES (5, 9); -- wildlife

-- Sylhet (dest_id=6) - tea, cultural, historical
INSERT INTO destination_interests VALUES (6, 6); -- tea
INSERT INTO destination_interests VALUES (6, 10); -- cultural
INSERT INTO destination_interests VALUES (6, 4); -- historical

-- Srimangal (dest_id=7) - tea, forest, wildlife
INSERT INTO destination_interests VALUES (7, 6); -- tea
INSERT INTO destination_interests VALUES (7, 3); -- forest
INSERT INTO destination_interests VALUES (7, 9); -- wildlife

-- Rangamati (dest_id=8) - lake, hill, cultural
INSERT INTO destination_interests VALUES (8, 5); -- lake
INSERT INTO destination_interests VALUES (8, 2); -- hill
INSERT INTO destination_interests VALUES (8, 10); -- cultural

-- Kuakata (dest_id=9) - beach, food, cultural
INSERT INTO destination_interests VALUES (9, 1); -- beach
INSERT INTO destination_interests VALUES (9, 8); -- food
INSERT INTO destination_interests VALUES (9, 10); -- cultural

-- Bagerhat (dest_id=10) - historical, cultural
INSERT INTO destination_interests VALUES (10, 4); -- historical
INSERT INTO destination_interests VALUES (10, 10); -- cultural

COMMIT;

-- ============================================
-- 5. HOTELS TABLE
-- ============================================
DROP TABLE hotels CASCADE CONSTRAINTS;
CREATE TABLE hotels (
    hotel_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dest_id NUMBER,
    name VARCHAR2(100) NOT NULL,
    description VARCHAR2(500),
    address VARCHAR2(200),
    phone VARCHAR2(20),
    rating NUMBER(2,1),
    distance_from_center NUMBER(3,1),
    amenities VARCHAR2(500),
    image_url VARCHAR2(500),
    FOREIGN KEY (dest_id) REFERENCES destinations(dest_id) ON DELETE CASCADE
);

-- Hotels for Cox's Bazar (dest_id=1)
INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(1, 'Hotel Sea Crown', 'Beachfront hotel with amazing sea view', 'Kolatali, Cox''s Bazar', '01812345678', 4.2, 0.5, 'WiFi,Pool,Restaurant,Parking,Beach Access', '/hotels/seacrown.jpg');

INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(1, 'Long Beach Hotel', 'Luxury hotel with premium amenities', 'Laboni Beach, Cox''s Bazar', '01912345678', 4.5, 0.2, 'WiFi,Pool,Spa,Gym,Restaurant,Bar,Beach Access', '/hotels/longbeach.jpg');

INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(1, 'Hotel Cox Today', 'Modern hotel in the heart of Cox''s Bazar', 'Marine Drive, Cox''s Bazar', '01712345678', 4.0, 1.0, 'WiFi,Restaurant,Parking', '/hotels/coxtoday.jpg');

-- Hotels for Sajek Valley (dest_id=2)
INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(2, 'Sajek Resort', 'Beautiful resort in the hills with panoramic valley views', 'Ruilui Para, Sajek', '01712345678', 4.0, 0.8, 'WiFi,Restaurant,Parking,Mountain View,Bonfire', '/hotels/sajekresort.jpg');

INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(2, 'Hill View Cottage', 'Cozy cottages with stunning hill views', 'Konglak Para, Sajek', '01612345678', 4.3, 0.5, 'WiFi,Restaurant,Bonfire,Mountain View', '/hotels/hillview.jpg');

-- Hotels for Sundarbans (dest_id=3)
INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(3, 'Mangrove Hotel', 'Comfortable hotel near Sundarbans entry point', 'Mongla, Khulna', '01712345678', 4.1, 2.0, 'WiFi,Restaurant,Tour Desk,Parking', '/hotels/mangrove.jpg');

INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(3, 'Forest View', 'Budget hotel with basic amenities', 'Khulna City', '01912345678', 4.0, 5.0, 'WiFi,Restaurant,Parking', '/hotels/forestview.jpg');

-- Hotels for Bandarban (dest_id=4)
INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(4, 'Hilltop Resort', 'Resort on a hilltop with panoramic views', 'Bandarban Sadar', '01512345678', 4.3, 1.5, 'WiFi,Restaurant,Pool,Mountain View', '/hotels/hilltop.jpg');

INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(4, 'Nilgiri Hotel', 'Hotel near Nilgiri hills with amazing sunrise views', 'Nilgiri, Bandarban', '01612345678', 4.2, 2.0, 'WiFi,Restaurant,Parking', '/hotels/nilgiri.jpg');

-- Hotels for Saint Martin (dest_id=5)
INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(5, 'Blue Marine Resort', 'Beachfront resort with direct access to coral beach', 'Saint Martin Island', '01812345678', 4.4, 0.1, 'WiFi,Restaurant,Beach Access,Snorkeling Gear', '/hotels/bluemarine.jpg');

INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(5, 'Coral View', 'Simple accommodation with sea view', 'Saint Martin Island', '01912345678', 4.1, 0.3, 'Restaurant,Beach Access', '/hotels/coralview.jpg');

-- Hotels for Sylhet (dest_id=6)
INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(6, 'Grand Sylhet Hotel', 'Luxury hotel in the heart of Sylhet city', 'Zindabazar, Sylhet', '01712345678', 4.3, 0.5, 'WiFi,Pool,Restaurant,Gym,Spa', '/hotels/grandsylhet.jpg');

INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(6, 'Tea Resort', 'Beautiful resort surrounded by tea gardens', 'Srimangal Road, Sylhet', '01812345678', 4.2, 2.0, 'WiFi,Restaurant,Tea Garden View,Pool', '/hotels/tearesort.jpg');

-- Hotels for Srimangal (dest_id=7)
INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(7, 'Tea Heaven Resort', 'Resort located inside a working tea estate', 'Srimangal', '01712345678', 4.4, 1.0, 'WiFi,Restaurant,Tea Tasting,Nature Walk', '/hotels/teaheaven.jpg');

-- Hotels for Rangamati (dest_id=8)
INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(8, 'Lake View Resort', 'Resort overlooking Kaptai Lake', 'Rangamati', '01712345678', 4.2, 0.8, 'WiFi,Restaurant,Lake View,Boating', '/hotels/lakeview.jpg');

-- Hotels for Kuakata (dest_id=9)
INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(9, 'Sunset Beach Resort', 'Perfect spot to watch sunrise and sunset', 'Kuakata Beach', '01712345678', 4.0, 0.3, 'WiFi,Restaurant,Beach Access', '/hotels/sunset.jpg');

-- Hotels for Bagerhat (dest_id=10)
INSERT INTO hotels (dest_id, name, description, address, phone, rating, distance_from_center, amenities, image_url) VALUES
(10, 'Khan Jahan Hotel', 'Comfortable hotel near historic sites', 'Bagerhat Sadar', '01712345678', 3.8, 1.0, 'WiFi,Restaurant,Parking', '/hotels/khanjahan.jpg');

COMMIT;

-- ============================================
-- 6. HOTEL_ROOMS TABLE (Different price tiers)
-- ============================================
DROP TABLE hotel_rooms CASCADE CONSTRAINTS;
CREATE TABLE hotel_rooms (
    room_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hotel_id NUMBER,
    room_type VARCHAR2(50),
    bed_type VARCHAR2(50),
    price_per_night NUMBER(10,2),
    max_guests NUMBER DEFAULT 2,
    meals_included VARCHAR2(50),
    has_ac NUMBER(1) DEFAULT 1,
    available_rooms NUMBER DEFAULT 10,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE
);

-- Rooms for Hotel Sea Crown (hotel_id=1)
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(1, 'Standard', 'Double', 1500, 2, 'None', 1, 8);
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(1, 'Deluxe', 'Queen', 2500, 2, 'Breakfast', 1, 5);
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(1, 'Suite', 'King', 4000, 3, 'Breakfast', 1, 3);

-- Rooms for Long Beach Hotel (hotel_id=2)
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(2, 'Deluxe', 'Queen', 3500, 2, 'Breakfast', 1, 10);
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(2, 'Executive Suite', 'King', 5500, 3, 'Full Board', 1, 4);
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(2, 'Presidential Suite', 'King', 8000, 4, 'Full Board', 1, 2);

-- Rooms for Hotel Cox Today (hotel_id=3)
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(3, 'Standard', 'Double', 1200, 2, 'None', 1, 12);
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(3, 'Deluxe', 'Queen', 1800, 2, 'Breakfast', 1, 8);

-- Rooms for Sajek Resort (hotel_id=4)
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(4, 'Standard', 'Double', 1200, 2, 'None', 0, 10);
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(4, 'Deluxe', 'Queen', 2000, 2, 'Breakfast', 1, 6);

-- Rooms for Hill View Cottage (hotel_id=5)
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(5, 'Cottage', 'Queen', 1500, 2, 'None', 0, 7);
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(5, 'Deluxe Cottage', 'King', 2500, 2, 'Breakfast', 1, 4);

-- Rooms for Mangrove Hotel (hotel_id=6)
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(6, 'Standard', 'Double', 1800, 2, 'Breakfast', 1, 8);
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(6, 'Deluxe', 'Queen', 2500, 2, 'Breakfast', 1, 5);

-- Rooms for Forest View (hotel_id=7)
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(7, 'Standard', 'Double', 1200, 2, 'None', 1, 8);

-- Rooms for Blue Marine Resort (hotel_id=8)
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(8, 'Standard', 'Double', 2500, 2, 'Breakfast', 1, 8);
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(8, 'Deluxe', 'Queen', 3500, 2, 'Half Board', 1, 5);
INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, max_guests, meals_included, has_ac, available_rooms) VALUES
(8, 'Suite', 'King', 5000, 3, 'Full Board', 1, 3);

COMMIT;

-- ============================================
-- 7. TRANSPORT_OPTIONS TABLE
-- ============================================
DROP TABLE transport_options CASCADE CONSTRAINTS;
CREATE TABLE transport_options (
    transport_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dest_id NUMBER,
    type VARCHAR2(20),
    company VARCHAR2(100),
    price_per_person NUMBER(10,2),
    duration VARCHAR2(50),
    comfort_level VARCHAR2(20),
    departure_city VARCHAR2(100) DEFAULT 'Dhaka',
    available_seats NUMBER DEFAULT 50,
    FOREIGN KEY (dest_id) REFERENCES destinations(dest_id) ON DELETE CASCADE
);

-- Transport for Cox's Bazar (dest_id=1)
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(1, 'Bus', 'Hanif Enterprise', 800, '7 hours', 'AC', 45);
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(1, 'Bus', 'Shohagh', 900, '6.5 hours', 'AC', 40);
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(1, 'Bus', 'Green Line', 1200, '6 hours', 'Luxury', 35);
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(1, 'Flight', 'Biman Bangladesh', 2500, '45 minutes', 'Economy', 120);

-- Transport for Sajek Valley (dest_id=2)
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(2, 'Bus', 'Shohagh', 1000, '8 hours', 'AC', 40);
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(2, 'Bus', 'Sakura', 1100, '7.5 hours', 'AC', 35);

-- Transport for Sundarbans (dest_id=3)
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(3, 'Bus', 'Hanif Enterprise', 900, '6 hours', 'AC', 45);
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(3, 'Train', 'Bangladesh Railway', 700, '7 hours', 'Non-AC', 100);

-- Transport for Bandarban (dest_id=4)
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(4, 'Bus', 'Hanif Enterprise', 1000, '7 hours', 'AC', 40);
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(4, 'Bus', 'Eagle', 950, '7 hours', 'AC', 35);

-- Transport for Saint Martin (dest_id=5)
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(5, 'Bus', 'Hanif Enterprise', 800, '7 hours', 'AC', 45);
-- Plus boat from Cox's Bazar (additional cost)

-- Transport for Sylhet (dest_id=6)
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(6, 'Bus', 'Hanif Enterprise', 700, '5 hours', 'AC', 50);
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(6, 'Flight', 'US-Bangla', 2200, '40 minutes', 'Economy', 120);
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(6, 'Train', 'Bangladesh Railway', 600, '6 hours', 'Non-AC', 100);

-- Transport for Srimangal (dest_id=7)
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(7, 'Bus', 'Shohagh', 650, '4 hours', 'AC', 45);

-- Transport for Rangamati (dest_id=8)
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(8, 'Bus', 'Shohagh', 850, '5 hours', 'AC', 40);

-- Transport for Kuakata (dest_id=9)
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(9, 'Bus', 'Hanif Enterprise', 750, '6 hours', 'AC', 45);

-- Transport for Bagerhat (dest_id=10)
INSERT INTO transport_options (dest_id, type, company, price_per_person, duration, comfort_level, available_seats) VALUES
(10, 'Bus', 'Hanif Enterprise', 800, '6 hours', 'AC', 40);

COMMIT;

-- ============================================
-- 8. FOOD_CATEGORIES TABLE (Simplified meal costs)
-- ============================================
DROP TABLE food_categories CASCADE CONSTRAINTS;
CREATE TABLE food_categories (
    category_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(20),
    breakfast_cost NUMBER(10,2),
    lunch_cost NUMBER(10,2),
    dinner_cost NUMBER(10,2),
    daily_cost_per_person NUMBER(10,2)
);

INSERT INTO food_categories (name, breakfast_cost, lunch_cost, dinner_cost, daily_cost_per_person) VALUES
('Budget', 70, 150, 200, 420);
INSERT INTO food_categories (name, breakfast_cost, lunch_cost, dinner_cost, daily_cost_per_person) VALUES
('Mid-range', 200, 300, 400, 900);
INSERT INTO food_categories (name, breakfast_cost, lunch_cost, dinner_cost, daily_cost_per_person) VALUES
('Premium', 400, 600, 800, 1800);

COMMIT;

-- ============================================
-- 9. ACTIVITIES TABLE
-- ============================================
DROP TABLE activities CASCADE CONSTRAINTS;
CREATE TABLE activities (
    activity_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dest_id NUMBER,
    name VARCHAR2(100),
    description VARCHAR2(500),
    cost_per_person NUMBER(10,2),
    duration_hours NUMBER,
    interest_type VARCHAR2(50),
    image_url VARCHAR2(500),
    FOREIGN KEY (dest_id) REFERENCES destinations(dest_id) ON DELETE CASCADE
);

-- Activities for Cox's Bazar (dest_id=1)
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(1, 'Sunset Beach Walk', 'Guided walk along the beach at sunset', 0, 2, 'beach', '/activities/beachwalk.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(1, 'Snorkeling', 'Coral reef exploration with equipment', 800, 3, 'adventure', '/activities/snorkeling.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(1, 'Himchari National Park', 'Entry to national park with waterfall', 100, 3, 'forest', '/activities/himchari.jpg');

-- Activities for Sajek Valley (dest_id=2)
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(2, 'Cloud View Point', 'Sunrise viewing at highest point', 50, 2, 'hill', '/activities/cloudview.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(2, 'Indigenous Village Tour', 'Visit to local villages', 200, 3, 'cultural', '/activities/village.jpg');

-- Activities for Sundarbans (dest_id=3)
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(3, 'Boat Safari', 'Boat ride through mangrove forest', 500, 4, 'wildlife', '/activities/boatsafari.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(3, 'Tiger Point Visit', 'Visit to known tiger spotting areas', 300, 3, 'wildlife', '/activities/tigerpoint.jpg');

-- Activities for Bandarban (dest_id=4)
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(4, 'Nilgiri Hill View', 'Visit to highest peak', 100, 3, 'hill', '/activities/nilgiri.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(4, 'Buddhist Temple Tour', 'Visit to ancient temples', 150, 2, 'historical', '/activities/temple.jpg');

-- Activities for Saint Martin (dest_id=5)
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(5, 'Coral Reef Snorkeling', 'Snorkeling in coral reefs', 600, 3, 'adventure', '/activities/coralsnorkel.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(5, 'Island Walk', 'Walk around the island', 0, 2, 'beach', '/activities/islandwalk.jpg');

-- Activities for Sylhet (dest_id=6)
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(6, 'Tea Garden Tour', 'Walk through tea gardens', 100, 2, 'tea', '/activities/teagarden.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(6, 'Shrine Visit', 'Visit to holy shrines', 0, 1, 'religious', '/activities/shrine.jpg');

-- Activities for Srimangal (dest_id=7)
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(7, 'Tea Tasting', 'Taste different tea varieties', 150, 1, 'tea', '/activities/teatasting.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(7, 'Lawachara Rainforest', 'Trek through rainforest', 200, 3, 'forest', '/activities/lawachara.jpg');

-- Activities for Rangamati (dest_id=8)
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(8, 'Kaptai Lake Boat Ride', 'Boat ride on the lake', 300, 2, 'lake', '/activities/boatride.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(8, 'Hanging Bridge', 'Visit to famous bridge', 20, 1, 'cultural', '/activities/bridge.jpg');

-- Activities for Kuakata (dest_id=9)
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(9, 'Sunrise & Sunset View', 'Watch both sunrise and sunset', 0, 2, 'beach', '/activities/sunrise.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(9, 'Fatrar Char', 'Visit to the coral island', 400, 4, 'adventure', '/activities/fatrarchar.jpg');

-- Activities for Bagerhat (dest_id=10)
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(10, '60 Dome Mosque', 'Visit to historic mosque', 50, 1, 'historical', '/activities/60domemosque.jpg');
INSERT INTO activities (dest_id, name, description, cost_per_person, duration_hours, interest_type, image_url) VALUES
(10, 'Historic City Tour', 'Tour of ancient city', 200, 3, 'historical', '/activities/citytour.jpg');

COMMIT;

-- ============================================
-- 10. PAYMENT_METHODS TABLE
-- ============================================
DROP TABLE payment_methods CASCADE CONSTRAINTS;
CREATE TABLE payment_methods (
    method_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(20) UNIQUE,
    account_number VARCHAR2(20),
    account_holder VARCHAR2(100),
    instructions VARCHAR2(500),
    is_active NUMBER(1) DEFAULT 1
);

INSERT INTO payment_methods (name, account_number, account_holder, instructions, is_active) VALUES
('bkash', '01700000000', 'Tourism Admin', 'Send money to this bKash number and enter transaction ID', 1);
INSERT INTO payment_methods (name, account_number, account_holder, instructions, is_active) VALUES
('nagad', '01800000000', 'Tourism Admin', 'Send money to this Nagad number and enter transaction ID', 1);
INSERT INTO payment_methods (name, account_number, account_holder, instructions, is_active) VALUES
('rocket', '01900000000', 'Tourism Admin', 'Send money to this Rocket number and enter transaction ID', 1);

COMMIT;

-- ============================================
-- 11. BOOKINGS TABLE
-- ============================================
DROP TABLE bookings CASCADE CONSTRAINTS;
CREATE TABLE bookings (
    booking_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id NUMBER,
    dest_id NUMBER,
    hotel_id NUMBER,
    room_id NUMBER,
    transport_id NUMBER,
    food_category_id NUMBER,
    activity_ids VARCHAR2(200),
    
    travel_date DATE,
    duration_days NUMBER,
    people NUMBER DEFAULT 1,
    
    hotel_cost NUMBER(10,2),
    transport_cost NUMBER(10,2),
    food_cost NUMBER(10,2),
    activities_cost NUMBER(10,2),
    total_cost NUMBER(10,2),
    
    payment_method VARCHAR2(20),
    payment_number VARCHAR2(20),
    transaction_id VARCHAR2(100),
    payment_status VARCHAR2(20) DEFAULT 'pending',
    
    booking_date DATE DEFAULT SYSDATE,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dest_id) REFERENCES destinations(dest_id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE SET NULL,
    FOREIGN KEY (room_id) REFERENCES hotel_rooms(room_id) ON DELETE SET NULL,
    FOREIGN KEY (transport_id) REFERENCES transport_options(transport_id) ON DELETE SET NULL,
    FOREIGN KEY (food_category_id) REFERENCES food_categories(category_id) ON DELETE SET NULL
);

COMMIT;