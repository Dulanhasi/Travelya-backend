const express = require("express");
const router = express.Router();

const serviceProviderController = require("../controllers/serviceProviderController");
const { authenticateUser } = require("../middleware/authMiddleware");

/* =====================================================
   PUBLIC ROUTES — fixed paths first, wildcards last
===================================================== */

router.get("/nearby", serviceProviderController.getNearbyProviders);
router.get("/type/:providerType", serviceProviderController.getProvidersByType);
router.get("/", serviceProviderController.getAllProviders);

/* =====================================================
   PROTECTED ROUTES — must come before /:providerId
   so Express does not swallow "my-profile" as a param
===================================================== */

router.get("/my-profile", authenticateUser, serviceProviderController.getMyProviderProfile);
router.patch("/profile", authenticateUser, serviceProviderController.updateProviderProfile);
router.post("/packages", authenticateUser, serviceProviderController.createPackage);
router.patch("/packages/:packageId", authenticateUser, serviceProviderController.updatePackage);
router.delete("/packages/:packageId", authenticateUser, serviceProviderController.deletePackage);

/* =====================================================
   WILDCARD PARAM ROUTES — always last
===================================================== */

router.get("/:providerId/packages", serviceProviderController.getProviderPackages);
router.get("/:providerId", serviceProviderController.getProviderById);

module.exports = router;
