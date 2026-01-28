const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SocialPost = require('../models/SocialPost');

router.get('/', auth, async (req, res) => {
  try {
    const posts = await SocialPost.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const post = new SocialPost({ ...req.body, userId: req.userId });
    await post.save();

    if (post.status === 'scheduled' || req.body.postNow) {
      // Here you would integrate with social media APIs
      // Facebook: https://developers.facebook.com/docs/graph-api/reference/page/feed
      // Instagram: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
      // Twitter: https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
      // LinkedIn: https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/share-api
      
      post.status = 'posted';
      post.postedDate = new Date();
      await post.save();
    }

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await SocialPost.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
