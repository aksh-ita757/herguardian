const ForumPost = require('../models/Forum');

const VALID_TAGS = ['support', 'legal', 'health', 'safety', 'general'];

// GET /api/forum
const getPosts = async (req, res) => {
  try {
    const { tag } = req.query;
    // Clamp pagination — an unbounded ?limit=1000000 would dump the whole collection.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const filter = { isApproved: true };
    if (typeof tag === 'string' && VALID_TAGS.includes(tag)) filter.tag = tag;

    // PRIVACY: never send the author's user id (or who liked what) to other users —
    // "Anonymous" posts must really be anonymous.
    const posts = await ForumPost.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-user -likedBy -replies.user -replies.likedBy');

    const total = await ForumPost.countDocuments(filter);
    res.json({ success: true, posts, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('getPosts error:', error.message);
    res.status(500).json({ error: 'Could not fetch posts' });
  }
};

// POST /api/forum
const createPost = async (req, res) => {
  try {
    const { title, content, tag, isAnonymous, displayName } = req.body;

    if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    // Sanitise tag — default to 'general' if invalid value sent
    const safeTag = VALID_TAGS.includes(tag) ? tag : 'general';

    const post = await ForumPost.create({
      user:        req.user._id,
      title:       title.trim(),
      content:     content.trim(),
      tag:         safeTag,
      isAnonymous: isAnonymous !== false,
      displayName: isAnonymous !== false ? 'Anonymous' : (typeof displayName === 'string' && displayName.trim() ? displayName.trim().slice(0, 50) : req.user.name),
    });

    const safePost = post.toObject();
    delete safePost.user;
    delete safePost.likedBy;
    res.status(201).json({ success: true, post: safePost });
  } catch (error) {
    console.error('createPost error:', error.message);
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ error: status === 400 ? 'Post is invalid (title max 150 chars, content max 2000).' : 'Could not create post' });
  }
};

// POST /api/forum/:id/like
const likePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const alreadyLiked = post.likedBy.includes(req.user._id);
    if (alreadyLiked) {
      post.likes -= 1;
      post.likedBy.pull(req.user._id);
    } else {
      post.likes += 1;
      post.likedBy.push(req.user._id);
    }
    await post.save();
    res.json({ success: true, likes: post.likes, liked: !alreadyLiked });
  } catch (error) {
    console.error('likePost error:', error.message);
    res.status(500).json({ error: 'Could not like post' });
  }
};

// POST /api/forum/:id/reply
const addReply = async (req, res) => {
  try {
    const { content, isAnonymous } = req.body;
    if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ error: 'Reply content required' });

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.replies.push({
      user:        req.user._id,
      displayName: isAnonymous !== false ? 'Anonymous' : req.user.name,
      content:     content.trim(),
    });
    await post.save();
    const replies = post.replies.map((r) => ({
      _id: r._id, displayName: r.displayName, content: r.content, likes: r.likes, createdAt: r.createdAt,
    }));
    res.status(201).json({ success: true, replies });
  } catch (error) {
    console.error('addReply error:', error.message);
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ error: status === 400 ? 'Reply is too long (max 500 characters).' : 'Could not add reply' });
  }
};

module.exports = { getPosts, createPost, likePost, addReply };
