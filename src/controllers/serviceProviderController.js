const db = require("../config/database");

/**
 * GET ALL APPROVED PROVIDERS
 * GET /api/service-providers
 */
exports.getAllProviders = async (req, res, next) => {
  try {
    const { providerType, isApproved } = req.query;

    let query = `
      SELECT
        sp.providerId,
        sp.userId,
        sp.businessName,
        sp.providerType,
        sp.description,
        sp.address,
        sp.locationLat,
        sp.locationLng,
        sp.overallRating,
        sp.totalReviews,
        sp.isApproved,
        u.email,
        u.contactNo,
        u.profileImage
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE 1=1
    `;

    const params = [];

    if (providerType) {
      query += " AND sp.providerType = ?";
      params.push(providerType);
    }

    if (isApproved !== undefined) {
      const approved =
        isApproved === "true" ||
        isApproved === true ||
        isApproved === "1" ||
        isApproved === 1
          ? 1
          : 0;

      query += " AND sp.isApproved = ?";
      params.push(approved);
    } else {
      query += " AND sp.isApproved = TRUE";
    }

    query += " AND (sp.isAvailable = TRUE OR sp.isAvailable IS NULL)";

    query += `
      ORDER BY
      sp.overallRating DESC,
      sp.totalReviews DESC,
      sp.providerId DESC
    `;

    const [providers] = await db.query(query, params);

    res.json({
      success: true,
      data: providers,
      count: providers.length,
    });
  } catch (error) {
    console.error("Get providers error:", error);
    next(error);
  }
};

/**
 * GET PROVIDER BY ID
 * GET /api/service-providers/:providerId
 */
exports.getProviderById = async (req, res, next) => {
  try {
    const { providerId } = req.params;

    const [providers] = await db.query(
      `SELECT
        sp.providerId,
        sp.userId,
        sp.businessName,
        sp.providerType,
        sp.businessRegistrationNo,
        sp.description,
        sp.address,
        sp.locationLat,
        sp.locationLng,
        sp.overallRating,
        sp.totalReviews,
        sp.isApproved,
        sp.approvedAt,
        u.email,
        u.contactNo,
        u.profileImage,
        u.firstName,
        u.lastName
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE sp.providerId = ?`,
      [providerId],
    );

    if (providers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service provider not found",
      });
    }

    const provider = providers[0];

    const [packages] = await db.query(
      `SELECT
        packageId,
        packageName,
        description,
        price,
        currency,
        duration,
        maxPeople,
        images,
        amenities,
        isActive
      FROM service_packages
      WHERE providerId = ? AND isActive = TRUE
      ORDER BY createdAt DESC
      LIMIT 10`,
      [providerId],
    );

    packages.forEach((pkg) => {
      try {
        pkg.images = pkg.images ? JSON.parse(pkg.images) : [];
      } catch {
        pkg.images = [];
      }

      try {
        pkg.amenities = pkg.amenities ? JSON.parse(pkg.amenities) : [];
      } catch {
        pkg.amenities = [];
      }
    });

    provider.packages = packages;

    res.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error("Get provider error:", error);
    next(error);
  }
};

/**
 * GET PROVIDERS BY TYPE
 * GET /api/service-providers/type/:providerType
 */
exports.getProvidersByType = async (req, res, next) => {
  try {
    const { providerType } = req.params;

    const [providers] = await db.query(
      `SELECT
        sp.providerId,
        sp.businessName,
        sp.providerType,
        sp.description,
        sp.address,
        sp.locationLat,
        sp.locationLng,
        sp.overallRating,
        sp.totalReviews,
        u.contactNo,
        u.profileImage
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE sp.providerType = ?
      AND sp.isApproved = TRUE
      AND (sp.isAvailable = TRUE OR sp.isAvailable IS NULL)
      ORDER BY sp.overallRating DESC`,
      [providerType],
    );

    res.json({
      success: true,
      data: providers,
      count: providers.length,
    });
  } catch (error) {
    console.error("Get providers by type error:", error);
    next(error);
  }
};

exports.getNearbyProviders = async (req, res, next) => {
  try {
    const { lat, lng, radius, providerType } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const radiusInKm = parseFloat(radius) || 50;

    let query = `
      SELECT
        sp.providerId,
        sp.businessName,
        sp.providerType,
        sp.description,
        sp.address,
        sp.locationLat,
        sp.locationLng,
        sp.overallRating,
        sp.totalReviews,
        u.contactNo,
        u.profileImage,
        (6371 * acos(
          cos(radians(?)) *
          cos(radians(sp.locationLat)) *
          cos(radians(sp.locationLng) - radians(?)) +
          sin(radians(?)) *
          sin(radians(sp.locationLat))
        )) AS distance
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE sp.isApproved = TRUE
      AND (sp.isAvailable = TRUE OR sp.isAvailable IS NULL)
      AND sp.locationLat IS NOT NULL
      AND sp.locationLng IS NOT NULL
    `;

    const params = [lat, lng, lat];

    if (providerType) {
      query += " AND sp.providerType = ?";
      params.push(providerType);
    }

    query += " HAVING distance <= ? ORDER BY distance ASC";
    params.push(radiusInKm);

    const [providers] = await db.query(query, params);

    providers.forEach((p) => {
      p.distance = parseFloat(p.distance).toFixed(2);
    });

    res.json({
      success: true,
      data: providers,
      count: providers.length,
    });
  } catch (error) {
    console.error("Nearby providers error:", error);
    next(error);
  }
};

/**
 * UPDATE PROVIDER PROFILE
 * PATCH /api/service-providers/profile
 */
exports.updateProviderProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.userId;

    const {
      businessName,
      providerType,
      businessRegistrationNo,
      description,
      address,
      locationLat,
      locationLng,
      profileImage,
      phone,
      isAvailable,
    } = req.body;

    const [providers] = await db.query(
      "SELECT providerId FROM service_providers WHERE userId=?",
      [userId],
    );

    if (providers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const updateFields = [];
    const params = [];

    if (businessName) {
      updateFields.push("businessName=?");
      params.push(businessName);
    }

    if (providerType) {
      updateFields.push("providerType=?");
      params.push(providerType);
    }

    if (businessRegistrationNo) {
      updateFields.push("businessRegistrationNo=?");
      params.push(businessRegistrationNo);
    }

    if (description) {
      updateFields.push("description=?");
      params.push(description);
    }

    if (address) {
      updateFields.push("address=?");
      params.push(address);
    }

    if (locationLat !== undefined) {
      updateFields.push("locationLat=?");
      params.push(locationLat);
    }

    if (locationLng !== undefined) {
      updateFields.push("locationLng=?");
      params.push(locationLng);
    }

    if (isAvailable !== undefined) {
      updateFields.push("isAvailable=?");
      params.push(isAvailable ? 1 : 0);
    }

    if (updateFields.length > 0) {
      params.push(userId);

      await db.query(
        `UPDATE service_providers SET ${updateFields.join(",")} WHERE userId=?`,
        params,
      );
    }

    if (profileImage) {
      await db.query("UPDATE users SET profileImage=? WHERE userId=?", [
        profileImage,
        userId,
      ]);
    }

    if (phone) {
      await db.query("UPDATE users SET contactNo=? WHERE userId=?", [
        phone,
        userId,
      ]);
    }

    res.json({
      success: true,
      message: "Provider profile updated successfully",
    });
  } catch (error) {
    console.error("Update provider error:", error);
    next(error);
  }
};

/**
 * GET PROVIDER PACKAGES
 * GET /api/service-providers/:providerId/packages
 */
exports.getProviderPackages = async (req, res, next) => {
  try {
    const { providerId } = req.params;

    const [packages] = await db.query(
      `SELECT
        packageId,
        packageName,
        description,
        price,
        currency,
        duration,
        maxPeople,
        images,
        amenities,
        isActive,
        createdAt
      FROM service_packages
      WHERE providerId=?
      AND isActive=TRUE
      ORDER BY createdAt DESC`,
      [providerId],
    );

    packages.forEach((pkg) => {
      try {
        pkg.images = pkg.images ? JSON.parse(pkg.images) : [];
      } catch {
        pkg.images = [];
      }

      try {
        pkg.amenities = pkg.amenities ? JSON.parse(pkg.amenities) : [];
      } catch {
        pkg.amenities = [];
      }
    });

    res.json({
      success: true,
      data: packages,
      count: packages.length,
    });
  } catch (error) {
    console.error("Get packages error:", error);
    next(error);
  }
};

/**
 * CREATE PACKAGE
 * POST /api/service-providers/packages
 */
exports.createPackage = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.userId;

    const {
      packageName,
      description,
      price,
      currency,
      duration,
      maxPeople,
      images,
      amenities,
    } = req.body;

    if (!packageName || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Package name and price required",
      });
    }

    const [providers] = await db.query(
      "SELECT providerId FROM service_providers WHERE userId=?",
      [userId],
    );

    if (providers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    const providerId = providers[0].providerId;

    const [result] = await db.query(
      `INSERT INTO service_packages
      (providerId,packageName,description,price,currency,duration,maxPeople,images,amenities)
      VALUES(?,?,?,?,?,?,?,?,?)`,
      [
        providerId,
        packageName,
        description,
        price,
        currency || "LKR",
        duration,
        maxPeople,
        JSON.stringify(images || []),
        JSON.stringify(amenities || []),
      ],
    );

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: {
        packageId: result.insertId,
      },
    });
  } catch (error) {
    console.error("Create package error:", error);
    next(error);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { packageId } = req.params;

    const {
      packageName,
      description,
      price,
      currency,
      duration,
      maxPeople,
      images,
      amenities,
      isActive,
    } = req.body;

    const [packages] = await db.query(
      `SELECT sp.packageId
       FROM service_packages sp
       JOIN service_providers p ON sp.providerId = p.providerId
       WHERE sp.packageId = ? AND p.userId = ?`,
      [packageId, userId],
    );

    if (packages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Package not found or unauthorized",
      });
    }

    const updateFields = [];
    const params = [];

    if (packageName) {
      updateFields.push("packageName=?");
      params.push(packageName);
    }

    if (description) {
      updateFields.push("description=?");
      params.push(description);
    }

    if (price !== undefined) {
      updateFields.push("price=?");
      params.push(price);
    }

    if (currency) {
      updateFields.push("currency=?");
      params.push(currency);
    }

    if (duration) {
      updateFields.push("duration=?");
      params.push(duration);
    }

    if (maxPeople !== undefined) {
      updateFields.push("maxPeople=?");
      params.push(maxPeople);
    }

    if (images) {
      updateFields.push("images=?");
      params.push(JSON.stringify(images));
    }

    if (amenities) {
      updateFields.push("amenities=?");
      params.push(JSON.stringify(amenities));
    }

    if (isActive !== undefined) {
      updateFields.push("isActive=?");
      params.push(isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    params.push(packageId);

    await db.query(
      `UPDATE service_packages SET ${updateFields.join(",")} WHERE packageId=?`,
      params,
    );

    res.json({
      success: true,
      message: "Package updated successfully",
    });
  } catch (error) {
    console.error("Update package error:", error);
    next(error);
  }
};

exports.deletePackage = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { packageId } = req.params;

    const [packages] = await db.query(
      `SELECT sp.packageId
       FROM service_packages sp
       JOIN service_providers p ON sp.providerId = p.providerId
       WHERE sp.packageId = ? AND p.userId = ?`,
      [packageId, userId],
    );

    if (packages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Package not found or unauthorized",
      });
    }

    await db.query("DELETE FROM service_packages WHERE packageId=?", [
      packageId,
    ]);

    res.json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    console.error("Delete package error:", error);
    next(error);
  }
};

/**
 * GET MY PROVIDER PROFILE
 */
exports.getMyProviderProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [providers] = await db.query(
      `SELECT
        sp.providerId,
        sp.businessName,
        sp.providerType,
        sp.description,
        sp.address,
        sp.overallRating,
        sp.totalReviews,
        sp.isApproved,
        sp.isAvailable,
        u.email,
        u.contactNo,
        u.profileImage
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE sp.userId=?`,
      [userId],
    );

    if (providers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const provider = providers[0];

    const [packages] = await db.query(
      `SELECT
        packageId,
        packageName,
        price,
        duration,
        maxPeople
      FROM service_packages
      WHERE providerId=?`,
      [provider.providerId],
    );

    provider.packages = packages;

    const [stats] = await db.query(
      `SELECT
        COUNT(*) as totalRequests,
        SUM(status='pending') as pendingRequests,
        SUM(status='accepted') as acceptedRequests,
        SUM(status='completed') as completedRequests
      FROM service_requests
      WHERE providerId=?`,
      [provider.providerId],
    );

    provider.requestStats = stats[0];

    res.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error("Get provider profile error:", error);
    next(error);
  }
};
