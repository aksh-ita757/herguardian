// ============================================
// HerGuardian — Forum Routes
// Base URL: /api/forum
// ============================================

const express = require('express');
const router  = express.Router();
const { getPosts, createPost, likePost, addReply } = require('../controllers/forumController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',              getPosts);           // Public — anyone can read
router.post('/',   protect,  createPost);         // Must be logged in to post
router.post('/:id/like',  protect, likePost);
router.post('/:id/reply', protect, addReply);

module.exports = router;
