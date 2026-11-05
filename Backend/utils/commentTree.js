/**
 * Transforms a flat array of comment documents into a nested reply tree in O(N) time
 * @param {Array} comments - Flat array of Mongoose Comment documents or plain objects
 * @param {string|mongoose.Types.ObjectId|null} currentUserId - Currently logged in user ID
 * @returns {Array} - Array of top-level comments with populated `.replies`
 */
function buildCommentTree(comments, currentUserId = null) {
  const map = {};
  const roots = [];

  const uidStr = currentUserId ? currentUserId.toString() : null;

  // First pass: instantiate comment map with empty replies array and vote metadata
  comments.forEach(c => {
    const obj = typeof c.toObject === 'function' ? c.toObject() : { ...c };

    if (uidStr) {
      const hasUpvoted = (obj.upvotes || []).some(uid => uid.toString() === uidStr);
      const hasDownvoted = (obj.downvotes || []).some(uid => uid.toString() === uidStr);
      obj.userVote = hasUpvoted ? 'up' : hasDownvoted ? 'down' : null;
    } else {
      obj.userVote = null;
    }

    obj.upvoteCount = (obj.upvotes || []).length;
    obj.downvoteCount = (obj.downvotes || []).length;
    obj.replies = [];

    // Privacy/security: remove raw arrays of User ObjectIds from payload
    delete obj.upvotes;
    delete obj.downvotes;

    map[obj._id.toString()] = obj;
  });

  // Second pass: link child replies to their parents
  comments.forEach(c => {
    const cId = c._id.toString();
    const commentObj = map[cId];

    if (c.parentId && map[c.parentId.toString()]) {
      map[c.parentId.toString()].replies.push(commentObj);
    } else {
      roots.push(commentObj);
    }
  });

  return roots;
}

module.exports = { buildCommentTree };
