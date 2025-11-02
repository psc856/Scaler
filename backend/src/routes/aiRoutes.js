import express from 'express';
import {
  getSmartSuggestions,
  suggestOptimalTime,
  analyzePatterns,
  getSuggestionsHistory,
  getConflicts,
  suggestEventTitle,
  recommendTimeSlots,
  getSmartInsights // Add new endpoint
} from '../controllers/aiController.js';

const router = express.Router();

// AI-powered routes (LLM-enhanced)
router.get('/suggestions', getSmartSuggestions);
router.get('/suggest-time', suggestOptimalTime);
router.get('/suggest-title', suggestEventTitle);
router.get('/recommend-slots', recommendTimeSlots);
router.get('/analyze-patterns', analyzePatterns);
router.get('/insights', getSmartInsights); // New: AI insights
router.get('/suggestions-history', getSuggestionsHistory);
router.get('/conflicts', getConflicts);

export default router;
