-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 17, 2025 at 07:08 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `travelya_db`
--

-- --------------------------------------------------------

--
-- Stand-in structure for view `active_providers_with_packages`
-- (See below for the actual view)
--
CREATE TABLE `active_providers_with_packages` (
`providerId` int(11)
,`businessName` varchar(255)
,`providerType` enum('hotel','guide','taxi','restaurant','other')
,`overallRating` decimal(3,2)
,`email` varchar(255)
,`contactNo` varchar(20)
,`totalPackages` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `animal_recognitions`
--

CREATE TABLE `animal_recognitions` (
  `recognitionId` int(11) NOT NULL,
  `travelerId` int(11) NOT NULL,
  `animalName` varchar(255) DEFAULT NULL,
  `confidence` decimal(5,4) DEFAULT NULL,
  `imageUrl` varchar(512) DEFAULT NULL,
  `locationLat` decimal(10,8) DEFAULT NULL,
  `locationLng` decimal(11,8) DEFAULT NULL,
  `recognizedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `messageId` int(11) NOT NULL,
  `senderId` int(11) NOT NULL,
  `receiverId` int(11) NOT NULL,
  `message` text NOT NULL,
  `messageType` enum('text','image','location') DEFAULT 'text',
  `isRead` tinyint(1) DEFAULT 0,
  `firebaseMessageId` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `complaints`
--

CREATE TABLE `complaints` (
  `complaintId` int(11) NOT NULL,
  `complainantId` int(11) NOT NULL,
  `complainantType` enum('traveler','service_provider') NOT NULL,
  `targetUserId` int(11) DEFAULT NULL,
  `complaintType` varchar(100) DEFAULT NULL,
  `description` text NOT NULL,
  `status` enum('pending','investigating','resolved','rejected') DEFAULT 'pending',
  `resolvedBy` int(11) DEFAULT NULL,
  `resolution` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolvedAt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emergency_alerts`
--

CREATE TABLE `emergency_alerts` (
  `alertId` int(11) NOT NULL,
  `travelerId` int(11) NOT NULL,
  `alertType` enum('sos','medical','police','other') NOT NULL,
  `message` text DEFAULT NULL,
  `locationLat` decimal(10,8) DEFAULT NULL,
  `locationLng` decimal(11,8) DEFAULT NULL,
  `status` enum('active','resolved','false_alarm') DEFAULT 'active',
  `resolvedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `locationId` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('cultural','nature','adventure','beach','historical','wildlife','religious','other') NOT NULL,
  `description` text DEFAULT NULL,
  `coordinates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`coordinates`)),
  `address` varchar(512) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `ratings` decimal(3,2) DEFAULT 0.00,
  `totalReviews` int(11) DEFAULT 0,
  `entryFee` decimal(10,2) DEFAULT NULL,
  `openingHours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`openingHours`)),
  `isApproved` tinyint(1) DEFAULT 0,
  `isActive` tinyint(1) DEFAULT 1 COMMENT '1=active, 0=inactive/hidden',
  `rejectedReason` text DEFAULT NULL COMMENT 'Reason for rejection by admin',
  `rejectedAt` timestamp NULL DEFAULT NULL COMMENT 'When location was rejected',
  `rejectedBy` int(11) DEFAULT NULL COMMENT 'Admin userId who rejected',
  `approvedAt` timestamp NULL DEFAULT NULL,
  `approvedBy` int(11) DEFAULT NULL,
  `suggestedBy` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `lastSyncedAt` timestamp NULL DEFAULT NULL COMMENT 'Last sync timestamp for offline support'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`locationId`, `name`, `category`, `description`, `coordinates`, `address`, `district`, `province`, `images`, `ratings`, `totalReviews`, `entryFee`, `openingHours`, `isApproved`, `isActive`, `rejectedReason`, `rejectedAt`, `rejectedBy`, `approvedAt`, `approvedBy`, `suggestedBy`, `createdAt`, `updatedAt`, `lastSyncedAt`) VALUES
(1, 'Test Location', 'cultural', 'This is a test location added by admin.', '{\"lat\":6.905304,\"lng\":79.9331437}', 'Some Address', 'Gampaha', 'Western Province', '[\"https://your-image-url.jpg\"]', 0.00, 0, 100.00, '{\"monday\":\"8am-5pm\",\"tuesday\":\"8am-5pm\"}', 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-04 13:43:15', '2025-12-04 13:54:31', NULL),
(2, 'test', 'cultural', 'test culture', '\"{\\\"lat\\\":6.9054633,\\\"lng\\\":79.9333422}\"', 'test cul addresd', 'Hambantota', 'Southern Province', '\"[\\\"https://firebasestorage.googleapis.com/v0/b/travelya-36094.firebasestorage.app/o/location_images%2F1764855909813%2Floc_1764855909822.jpg?alt=media&token=968cc1c0-3d3f-4049-a76b-e2bfeced7e91\\\"]\"', 0.00, 0, 500.00, '\"{\\\"monday\\\":\\\"9:00 AM - 5:00 PM\\\",\\\"tuesday\\\":\\\"9:00 AM - 5:00 PM\\\",\\\"wednesday\\\":\\\"9:00 AM - 5:00 PM\\\",\\\"thursday\\\":\\\"9:00 AM - 5:00 PM\\\",\\\"friday\\\":\\\"9:00 AM - 5:00 PM\\\",\\\"saturday\\\":\\\"9:00 AM - 5:00 PM\\\",\\\"sunday\\\":\\\"9:00 AM - 5:00 PM\\\"}\"', 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-04 13:45:15', '2025-12-04 13:54:31', NULL),
(3, 'test 2', 'nature', 'test two', '\"{\\\"lat\\\":6.9053927,\\\"lng\\\":79.9333591}\"', 'test two app', 'Hambantota', 'Southern Province', '\"[\\\"https://firebasestorage.googleapis.com/v0/b/travelya-36094.firebasestorage.app/o/location_images%2F1764864493332%2Floc_1764864493340.jpg?alt=media&token=023946d2-cfb6-40db-be70-9c9e3e0d3e04\\\",\\\"https://firebasestorage.googleapis.com/v0/b/travelya-36094.firebasestorage.app/o/location_images%2F1764864493332%2Floc_1764864498381.jpg?alt=media&token=277a8fd2-ab47-405a-b8b5-de3fb2b472e0\\\"]\"', 0.00, 0, NULL, '{}', 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-04 16:08:23', '2025-12-04 16:08:23', NULL),
(4, 'test approval', 'adventure', 'test approval', '\"{\\\"lat\\\":6.9052856,\\\"lng\\\":79.9330972}\"', 'test approval', 'Galle', 'Southern Province', '\"[\\\"https://firebasestorage.googleapis.com/v0/b/travelya-36094.firebasestorage.app/o/location_images%2F1764864888701%2Floc_1764864888702.jpg?alt=media&token=2756b305-8d9f-4d5c-aa03-d3ff7ed084b2\\\"]\"', 0.00, 0, NULL, '{}', 0, 1, NULL, NULL, NULL, NULL, NULL, 2, '2025-12-04 16:14:53', '2025-12-04 16:14:53', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notificationId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','success','error') DEFAULT 'info',
  `isRead` tinyint(1) DEFAULT 0,
  `relatedEntityType` varchar(50) DEFAULT NULL,
  `relatedEntityId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notificationId`, `userId`, `title`, `message`, `type`, `isRead`, `relatedEntityType`, `relatedEntityId`, `createdAt`) VALUES
(1, 6, 'Account Approved', 'Your service provider account has been approved. You can now start offering your services!', 'success', 0, NULL, NULL, '2025-12-04 16:04:37');

-- --------------------------------------------------------

--
-- Stand-in structure for view `popular_locations`
-- (See below for the actual view)
--
CREATE TABLE `popular_locations` (
`locationId` int(11)
,`name` varchar(255)
,`category` enum('cultural','nature','adventure','beach','historical','wildlife','religious','other')
,`district` varchar(100)
,`ratings` decimal(3,2)
,`totalReviews` int(11)
);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `reviewId` int(11) NOT NULL,
  `reviewerId` int(11) NOT NULL,
  `reviewType` enum('location','service_provider') NOT NULL,
  `targetId` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `isVerified` tinyint(1) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_packages`
--

CREATE TABLE `service_packages` (
  `packageId` int(11) NOT NULL,
  `providerId` int(11) NOT NULL,
  `packageName` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'LKR',
  `duration` varchar(100) DEFAULT NULL,
  `maxPeople` int(11) DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`amenities`)),
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_providers`
--

CREATE TABLE `service_providers` (
  `providerId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `businessName` varchar(255) NOT NULL,
  `providerType` enum('hotel','guide','taxi','restaurant','other') NOT NULL,
  `businessRegistrationNo` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `address` varchar(512) DEFAULT NULL,
  `locationLat` decimal(10,8) DEFAULT NULL,
  `locationLng` decimal(11,8) DEFAULT NULL,
  `overallRating` decimal(3,2) DEFAULT 0.00,
  `totalReviews` int(11) DEFAULT 0,
  `isApproved` tinyint(1) DEFAULT 0,
  `approvedAt` timestamp NULL DEFAULT NULL,
  `approvedBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `service_providers`
--

INSERT INTO `service_providers` (`providerId`, `userId`, `businessName`, `providerType`, `businessRegistrationNo`, `description`, `address`, `locationLat`, `locationLng`, `overallRating`, `totalReviews`, `isApproved`, `approvedAt`, `approvedBy`) VALUES
(1, 3, 'DHK Taxi', 'taxi', NULL, NULL, 'Nawala', NULL, NULL, 0.00, 0, 0, NULL, NULL),
(2, 6, 'taxi lokka', 'taxi', NULL, NULL, 'kuru', NULL, NULL, 0.00, 0, 1, '2025-12-04 16:04:37', 1);

-- --------------------------------------------------------

--
-- Table structure for table `service_requests`
--

CREATE TABLE `service_requests` (
  `requestId` int(11) NOT NULL,
  `travelerId` int(11) NOT NULL,
  `providerId` int(11) NOT NULL,
  `packageId` int(11) DEFAULT NULL,
  `tripId` int(11) DEFAULT NULL,
  `requestDate` date NOT NULL,
  `numberOfPeople` int(11) DEFAULT 1,
  `specialRequirements` text DEFAULT NULL,
  `status` enum('pending','accepted','rejected','completed','cancelled') DEFAULT 'pending',
  `totalAmount` decimal(10,2) DEFAULT NULL,
  `isPaid` tinyint(1) DEFAULT 0,
  `paymentIntentId` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `travelers`
--

CREATE TABLE `travelers` (
  `travelerId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `passportNo` varchar(50) DEFAULT NULL,
  `nicNo` varchar(20) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `emergencyContact` varchar(20) DEFAULT NULL,
  `emergencyContactName` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `travelers`
--

INSERT INTO `travelers` (`travelerId`, `userId`, `passportNo`, `nicNo`, `nationality`, `dateOfBirth`, `emergencyContact`, `emergencyContactName`) VALUES
(1, 2, NULL, '123456789V', 'Sinhala', '1991-01-11', '0715203645', 'Kamal Sooriyasena'),
(2, 4, NULL, '123456789V', 'sinhala', NULL, NULL, NULL),
(3, 5, NULL, '123456789V', NULL, NULL, NULL, NULL),
(4, 7, NULL, '951070228V', 'Sinhala', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `travel_journals`
--

CREATE TABLE `travel_journals` (
  `journalId` int(11) NOT NULL,
  `travelerId` int(11) NOT NULL,
  `tripId` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `visitDate` date DEFAULT NULL,
  `locationId` int(11) DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `isPublic` tinyint(1) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trip_locations`
--

CREATE TABLE `trip_locations` (
  `tripLocationId` int(11) NOT NULL,
  `tripId` int(11) NOT NULL,
  `locationId` int(11) NOT NULL,
  `visitDate` date DEFAULT NULL,
  `dayNumber` int(11) DEFAULT NULL,
  `orderInDay` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trip_plans`
--

CREATE TABLE `trip_plans` (
  `tripId` int(11) NOT NULL,
  `travelerId` int(11) NOT NULL,
  `tripName` varchar(255) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `numberOfTravelers` int(11) DEFAULT 1,
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferences`)),
  `itinerary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`itinerary`)),
  `status` enum('planning','confirmed','ongoing','completed','cancelled') DEFAULT 'planning',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` int(11) NOT NULL,
  `firebaseUid` varchar(128) NOT NULL,
  `email` varchar(255) NOT NULL,
  `userType` enum('traveler','service_provider','admin') NOT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `contactNo` varchar(20) DEFAULT NULL,
  `profileImage` varchar(512) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `isVerified` tinyint(1) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userId`, `firebaseUid`, `email`, `userType`, `firstName`, `lastName`, `contactNo`, `profileImage`, `gender`, `isActive`, `isVerified`, `createdAt`, `updatedAt`) VALUES
(1, 'zYZAljYHCbZPv7knO61HbgsOpJk1', 'admin@travelya.lk', 'admin', 'Admin', 'User', NULL, NULL, NULL, 1, 1, '2025-11-17 16:49:42', '2025-12-02 17:34:14'),
(2, 'TgzZ6XonPuRMXp2wQwVaX2APCWZ2', 'dul.katugaha@gmail.com', 'traveler', 'Dul', 'Katu', '0717318075', NULL, 'female', 1, 0, '2025-11-18 17:28:52', '2025-12-01 17:15:50'),
(3, 'BMJ25xZaVQYyQT2LbaIT1BbvD1A2', 'testingdulan@gmail.com', 'service_provider', 'Taxi', 'Driver', '0717318075', NULL, NULL, 1, 0, '2025-11-18 18:32:49', '2025-11-18 18:32:49'),
(4, 'gB6kFPC4zggSApHOnZhNzD2r3ll2', 'test@gmail.com', 'traveler', 'test', 'last', '0715263156', NULL, NULL, 1, 0, '2025-11-19 18:14:14', '2025-11-19 18:14:14'),
(5, 'UnYhbQdnb4Yo7QfQeTkYaOSOnYD3', 'test4@gmail.com', 'traveler', 'test', 'last', '0756318075', NULL, NULL, 1, 0, '2025-11-19 18:18:04', '2025-11-19 18:18:04'),
(6, 'LCw0YisnlCdx8O1p6wg9jZSSvAi1', 'dri@test.com', 'service_provider', 'taxi', 'karaya', '0771234565', NULL, NULL, 1, 0, '2025-11-19 18:19:42', '2025-11-19 18:19:42'),
(7, 'tGpTkhXFJHPvDe0ZKNjfZ8plfO52', 'testlast@email.com', 'traveler', 'test', 'last', '0715319074', NULL, NULL, 1, 0, '2025-11-30 20:22:17', '2025-11-30 20:22:17');

-- --------------------------------------------------------

--
-- Structure for view `active_providers_with_packages`
--
DROP TABLE IF EXISTS `active_providers_with_packages`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `active_providers_with_packages`  AS SELECT `sp`.`providerId` AS `providerId`, `sp`.`businessName` AS `businessName`, `sp`.`providerType` AS `providerType`, `sp`.`overallRating` AS `overallRating`, `u`.`email` AS `email`, `u`.`contactNo` AS `contactNo`, count(`pkg`.`packageId`) AS `totalPackages` FROM ((`service_providers` `sp` join `users` `u` on(`sp`.`userId` = `u`.`userId`)) left join `service_packages` `pkg` on(`sp`.`providerId` = `pkg`.`providerId` and `pkg`.`isActive` = 1)) WHERE `sp`.`isApproved` = 1 GROUP BY `sp`.`providerId` ;

-- --------------------------------------------------------

--
-- Structure for view `popular_locations`
--
DROP TABLE IF EXISTS `popular_locations`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `popular_locations`  AS SELECT `l`.`locationId` AS `locationId`, `l`.`name` AS `name`, `l`.`category` AS `category`, `l`.`district` AS `district`, `l`.`ratings` AS `ratings`, `l`.`totalReviews` AS `totalReviews` FROM `locations` AS `l` WHERE `l`.`isApproved` = 1 ORDER BY `l`.`ratings` DESC, `l`.`totalReviews` DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `animal_recognitions`
--
ALTER TABLE `animal_recognitions`
  ADD PRIMARY KEY (`recognitionId`),
  ADD KEY `idx_traveler` (`travelerId`),
  ADD KEY `idx_animal` (`animalName`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `receiverId` (`receiverId`),
  ADD KEY `idx_conversation` (`senderId`,`receiverId`),
  ADD KEY `idx_firebase` (`firebaseMessageId`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`complaintId`),
  ADD KEY `complainantId` (`complainantId`),
  ADD KEY `targetUserId` (`targetUserId`),
  ADD KEY `resolvedBy` (`resolvedBy`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `emergency_alerts`
--
ALTER TABLE `emergency_alerts`
  ADD PRIMARY KEY (`alertId`),
  ADD KEY `idx_traveler` (`travelerId`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`locationId`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_district` (`district`),
  ADD KEY `idx_approved` (`isApproved`),
  ADD KEY `idx_isApproved_isActive` (`isApproved`,`isActive`),
  ADD KEY `idx_suggestedBy` (`suggestedBy`),
  ADD KEY `fk_locations_rejectedBy` (`rejectedBy`),
  ADD KEY `fk_locations_approvedBy` (`approvedBy`);
ALTER TABLE `locations` ADD FULLTEXT KEY `idx_search` (`name`,`description`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notificationId`),
  ADD KEY `idx_user` (`userId`),
  ADD KEY `idx_read` (`isRead`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`reviewId`),
  ADD KEY `reviewerId` (`reviewerId`),
  ADD KEY `idx_target` (`reviewType`,`targetId`),
  ADD KEY `idx_rating` (`rating`);

--
-- Indexes for table `service_packages`
--
ALTER TABLE `service_packages`
  ADD PRIMARY KEY (`packageId`),
  ADD KEY `idx_provider` (`providerId`),
  ADD KEY `idx_active` (`isActive`);

--
-- Indexes for table `service_providers`
--
ALTER TABLE `service_providers`
  ADD PRIMARY KEY (`providerId`),
  ADD UNIQUE KEY `unique_user` (`userId`),
  ADD KEY `approvedBy` (`approvedBy`),
  ADD KEY `idx_provider_type` (`providerType`),
  ADD KEY `idx_approved` (`isApproved`);

--
-- Indexes for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD PRIMARY KEY (`requestId`),
  ADD KEY `packageId` (`packageId`),
  ADD KEY `tripId` (`tripId`),
  ADD KEY `idx_traveler` (`travelerId`),
  ADD KEY `idx_provider` (`providerId`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `travelers`
--
ALTER TABLE `travelers`
  ADD PRIMARY KEY (`travelerId`),
  ADD UNIQUE KEY `unique_user` (`userId`);

--
-- Indexes for table `travel_journals`
--
ALTER TABLE `travel_journals`
  ADD PRIMARY KEY (`journalId`),
  ADD KEY `tripId` (`tripId`),
  ADD KEY `locationId` (`locationId`),
  ADD KEY `idx_traveler` (`travelerId`),
  ADD KEY `idx_public` (`isPublic`);

--
-- Indexes for table `trip_locations`
--
ALTER TABLE `trip_locations`
  ADD PRIMARY KEY (`tripLocationId`),
  ADD UNIQUE KEY `unique_trip_location` (`tripId`,`locationId`,`visitDate`),
  ADD KEY `locationId` (`locationId`);

--
-- Indexes for table `trip_plans`
--
ALTER TABLE `trip_plans`
  ADD PRIMARY KEY (`tripId`),
  ADD KEY `idx_traveler` (`travelerId`),
  ADD KEY `idx_dates` (`startDate`,`endDate`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `firebaseUid` (`firebaseUid`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_firebase_uid` (`firebaseUid`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_user_type` (`userType`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `animal_recognitions`
--
ALTER TABLE `animal_recognitions`
  MODIFY `recognitionId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `complaints`
--
ALTER TABLE `complaints`
  MODIFY `complaintId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emergency_alerts`
--
ALTER TABLE `emergency_alerts`
  MODIFY `alertId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `locationId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notificationId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `reviewId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_packages`
--
ALTER TABLE `service_packages`
  MODIFY `packageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_providers`
--
ALTER TABLE `service_providers`
  MODIFY `providerId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `service_requests`
--
ALTER TABLE `service_requests`
  MODIFY `requestId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `travelers`
--
ALTER TABLE `travelers`
  MODIFY `travelerId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `travel_journals`
--
ALTER TABLE `travel_journals`
  MODIFY `journalId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trip_locations`
--
ALTER TABLE `trip_locations`
  MODIFY `tripLocationId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trip_plans`
--
ALTER TABLE `trip_plans`
  MODIFY `tripId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `animal_recognitions`
--
ALTER TABLE `animal_recognitions`
  ADD CONSTRAINT `animal_recognitions_ibfk_1` FOREIGN KEY (`travelerId`) REFERENCES `travelers` (`travelerId`) ON DELETE CASCADE;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`senderId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`receiverId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `complaints`
--
ALTER TABLE `complaints`
  ADD CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`complainantId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  ADD CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`targetUserId`) REFERENCES `users` (`userId`) ON DELETE SET NULL,
  ADD CONSTRAINT `complaints_ibfk_3` FOREIGN KEY (`resolvedBy`) REFERENCES `users` (`userId`);

--
-- Constraints for table `emergency_alerts`
--
ALTER TABLE `emergency_alerts`
  ADD CONSTRAINT `emergency_alerts_ibfk_1` FOREIGN KEY (`travelerId`) REFERENCES `travelers` (`travelerId`) ON DELETE CASCADE;

--
-- Constraints for table `locations`
--
ALTER TABLE `locations`
  ADD CONSTRAINT `fk_locations_approvedBy` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_locations_rejectedBy` FOREIGN KEY (`rejectedBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_locations_suggestedBy` FOREIGN KEY (`suggestedBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL,
  ADD CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `locations_ibfk_2` FOREIGN KEY (`suggestedBy`) REFERENCES `users` (`userId`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`reviewerId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `service_packages`
--
ALTER TABLE `service_packages`
  ADD CONSTRAINT `service_packages_ibfk_1` FOREIGN KEY (`providerId`) REFERENCES `service_providers` (`providerId`) ON DELETE CASCADE;

--
-- Constraints for table `service_providers`
--
ALTER TABLE `service_providers`
  ADD CONSTRAINT `service_providers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  ADD CONSTRAINT `service_providers_ibfk_2` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`userId`);

--
-- Constraints for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD CONSTRAINT `service_requests_ibfk_1` FOREIGN KEY (`travelerId`) REFERENCES `travelers` (`travelerId`) ON DELETE CASCADE,
  ADD CONSTRAINT `service_requests_ibfk_2` FOREIGN KEY (`providerId`) REFERENCES `service_providers` (`providerId`) ON DELETE CASCADE,
  ADD CONSTRAINT `service_requests_ibfk_3` FOREIGN KEY (`packageId`) REFERENCES `service_packages` (`packageId`) ON DELETE SET NULL,
  ADD CONSTRAINT `service_requests_ibfk_4` FOREIGN KEY (`tripId`) REFERENCES `trip_plans` (`tripId`) ON DELETE SET NULL;

--
-- Constraints for table `travelers`
--
ALTER TABLE `travelers`
  ADD CONSTRAINT `travelers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `travel_journals`
--
ALTER TABLE `travel_journals`
  ADD CONSTRAINT `travel_journals_ibfk_1` FOREIGN KEY (`travelerId`) REFERENCES `travelers` (`travelerId`) ON DELETE CASCADE,
  ADD CONSTRAINT `travel_journals_ibfk_2` FOREIGN KEY (`tripId`) REFERENCES `trip_plans` (`tripId`) ON DELETE SET NULL,
  ADD CONSTRAINT `travel_journals_ibfk_3` FOREIGN KEY (`locationId`) REFERENCES `locations` (`locationId`) ON DELETE SET NULL;

--
-- Constraints for table `trip_locations`
--
ALTER TABLE `trip_locations`
  ADD CONSTRAINT `trip_locations_ibfk_1` FOREIGN KEY (`tripId`) REFERENCES `trip_plans` (`tripId`) ON DELETE CASCADE,
  ADD CONSTRAINT `trip_locations_ibfk_2` FOREIGN KEY (`locationId`) REFERENCES `locations` (`locationId`) ON DELETE CASCADE;

--
-- Constraints for table `trip_plans`
--
ALTER TABLE `trip_plans`
  ADD CONSTRAINT `trip_plans_ibfk_1` FOREIGN KEY (`travelerId`) REFERENCES `travelers` (`travelerId`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
