const express = require("express");
const router = express.Router();
const { CardController } = require("../controller/card.controller");
const Authorization = require("../utils/authorization.service");

const BASE = "/card";

// All card routes require authentication
router.use(Authorization.authenticateToken);

// Initialize card saving process
router.post(`${BASE}/save/initialize`, CardController.initializeCardSave);

// Save card after payment verification (for testing/fallback only)
// In production, cards are saved via Paystack webhook
router.post(`${BASE}/save/verify`, CardController.saveCard);

// Get all cards for entity
router.get(`${BASE}/list`, CardController.getCards);

// Set default card
router.post(`${BASE}/default`, CardController.setDefaultCard);

// Remove card
router.delete(`${BASE}/:cardId`, CardController.removeCard);

// Charge a saved card
router.post(`${BASE}/charge`, CardController.chargeCard);

// Check card save status (for testing webhook)
router.get(`${BASE}/status`, CardController.checkCardStatus);

module.exports = router;
