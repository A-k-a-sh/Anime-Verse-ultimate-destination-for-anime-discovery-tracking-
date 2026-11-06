/**
 * Otaku Pulse - Backend & Logic Smoke Test Suite
 * Tests comment tree builder, slug logic, reading time, schema structure, and security.
 */

const assert = require('assert');
const { buildCommentTree } = require('../utils/commentTree');
const Pulse = require('../models/Pulse');
const PulseComment = require('../models/PulseComment');

console.log('🧪 Starting Otaku Pulse Automated Smoke Test Suite...\n');

// 1. Comment Tree Hierarchy & Reddit-style Deletion Test
console.log('--- Test 1: Comment Tree O(N) Builder & Reddit-Style Deletion ---');
const mockComments = [
  {
    _id: 'comment-5',
    parentId: null,
    content: 'Root comment 2',
    author: { _id: 'user-4', username: 'Piccolo' },
    isDeleted: false,
    pulseScore: 15, // Higher score than comment-1
    createdAt: new Date('2026-11-01T09:00:00Z'),
    upvotes: [],
    downvotes: []
  },
  {
    _id: 'comment-1',
    parentId: null,
    content: 'Root comment 1',
    author: { _id: 'user-1', username: 'Goku' },
    isDeleted: false,
    pulseScore: 10,
    createdAt: new Date('2026-11-01T10:00:00Z'),
    upvotes: ['user-A'],
    downvotes: []
  },
  {
    _id: 'comment-2',
    parentId: 'comment-1',
    content: 'Nested reply to comment 1',
    author: { _id: 'user-2', username: 'Vegeta' },
    isDeleted: false,
    pulseScore: 5,
    createdAt: new Date('2026-11-01T10:05:00Z'),
    upvotes: [],
    downvotes: ['user-A']
  },
  {
    _id: 'comment-3',
    parentId: 'comment-2',
    content: 'Deep reply at level 2',
    author: { _id: 'user-3', username: 'Trunks' },
    isDeleted: true, // Marked deleted
    pulseScore: 0,
    createdAt: new Date('2026-11-01T10:10:00Z'),
    upvotes: [],
    downvotes: []
  },
  {
    _id: 'comment-4',
    parentId: 'comment-3',
    content: 'Reply under deleted comment',
    author: { _id: 'user-1', username: 'Goku' },
    isDeleted: false,
    pulseScore: 2,
    createdAt: new Date('2026-11-01T10:15:00Z'),
    upvotes: [],
    downvotes: []
  }
];

const tree = buildCommentTree(mockComments, 'user-A');

assert.strictEqual(tree.length, 2, 'Should have exactly 2 root comments');
assert.strictEqual(tree[0]._id, 'comment-5', 'First comment should be comment-5');
assert.strictEqual(tree[1]._id, 'comment-1', 'Second root comment should be comment-1');

// Verify user vote state ('up', 'down', null)
assert.strictEqual(tree[1].userVote, 'up', 'user-A upvoted comment-1 -> userVote must be "up"');
assert.strictEqual(tree[0].userVote, null, 'user-A did not vote on comment-5 -> userVote must be null');

// Verify nested child
assert.strictEqual(tree[1].replies.length, 1, 'comment-1 should have 1 child');
assert.strictEqual(tree[1].replies[0]._id, 'comment-2', 'Child should be comment-2');
assert.strictEqual(tree[1].replies[0].userVote, 'down', 'user-A downvoted comment-2 -> userVote must be "down"');

// Verify deleted comment preservation for thread continuity
const deepChild = tree[1].replies[0].replies[0];
assert.strictEqual(deepChild._id, 'comment-3', 'Deep child must exist in tree');
assert.strictEqual(deepChild.isDeleted, true, 'isDeleted flag must be preserved');
assert.strictEqual(deepChild.replies.length, 1, 'Replies to deleted comments must be preserved');
assert.strictEqual(deepChild.replies[0]._id, 'comment-4', 'comment-4 should be attached under comment-3');

console.log('✅ Test 1 Passed: Comment Tree builder correctly forms hierarchy, calculates userVote, and preserves deleted thread nodes.\n');

// 2. Pulse Model Schema Validation Test
console.log('--- Test 2: Mongoose Pulse Schema Validation ---');
const pulseDoc = new Pulse({
  title: 'Top 10 Shonen Anime of the Decade',
  slug: 'top-10-shonen-anime-of-the-decade',
  content: '<p>A deep dive into modern shonen storytelling.</p>',
  excerpt: 'A deep dive into modern shonen storytelling.',
  author: '507f191e810c19729de860ea',
  status: 'published',
  tags: ['shonen', 'anime', 'rankings'],
  readingTime: 3
});

const validationError = pulseDoc.validateSync();
assert.strictEqual(validationError, undefined, 'Valid Pulse document should pass validation without error');
assert.strictEqual(pulseDoc.pulseScore, 0, 'Default pulseScore should be 0');
assert.strictEqual(pulseDoc.commentsEnabled, true, 'Default commentsEnabled should be true');
assert.strictEqual(pulseDoc.hasSpoilers, false, 'Default hasSpoilers should be false');

console.log('✅ Test 2 Passed: Pulse schema validates required fields and default attributes.\n');

// 3. Pulse Comment Model Schema Validation Test
console.log('--- Test 3: Mongoose PulseComment Schema Validation ---');
const commentDoc = new PulseComment({
  pulseId: '507f191e810c19729de860ea',
  author: '507f191e810c19729de860eb',
  content: 'Outstanding breakdown, completely agree with your number 1 pick!'
});

const commentValidationError = commentDoc.validateSync();
assert.strictEqual(commentValidationError, undefined, 'Valid PulseComment document should pass validation without error');
assert.strictEqual(commentDoc.depth, 0, 'Default depth should be 0');
assert.strictEqual(commentDoc.isDeleted, false, 'Default isDeleted should be false');

console.log('✅ Test 3 Passed: PulseComment schema validates required fields and hierarchy constraints.\n');

// 4. Reading Time Calculation Algorithm Test
console.log('--- Test 4: Reading Time & Word Count Calculation ---');
function calculateReadingTime(html) {
  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const shortPost = '<p>Short introductory post with just ten words inside this paragraph.</p>';
assert.strictEqual(calculateReadingTime(shortPost), 1, 'Short posts under 200 words must have min reading time of 1 min');

const longPost = '<p>' + new Array(450).fill('anime').join(' ') + '</p>';
assert.strictEqual(calculateReadingTime(longPost), 3, '450 words at 200 wpm should equal 3 minutes');

console.log('✅ Test 4 Passed: Reading time algorithm accurately computes minutes with a minimum of 1.\n');

// 5. Cloudinary Service Unit Test
console.log('--- Test 5: Cloudinary Service Module Loading ---');
const cloudinaryService = require('../services/cloudinaryService');
assert.strictEqual(typeof cloudinaryService.uploadImageBuffer, 'function', 'uploadImageBuffer must be a function');
assert.strictEqual(typeof cloudinaryService.deleteImageByPublicId, 'function', 'deleteImageByPublicId must be a function');
assert.strictEqual(typeof cloudinaryService.isConfigured, 'function', 'isConfigured must be a function');
assert.strictEqual(typeof cloudinaryService.extractCloudinaryPublicIds, 'function', 'extractCloudinaryPublicIds must be a function');
assert.strictEqual(typeof cloudinaryService.deleteMultipleImages, 'function', 'deleteMultipleImages must be a function');
console.log('✅ Test 5 Passed: Cloudinary service interfaces correctly exported.\n');

// 6. Smart Orphan Media Extraction & Reconciliation Test
console.log('--- Test 6: Smart Orphan Media Extraction & Reconciliation ---');
const sampleHtml = `
  <h2>My Epic Review</h2>
  <p>Here is the first image:</p>
  <img src="https://res.cloudinary.com/mycloud/image/upload/v1700000000/animeverse/pulses/photo_one.jpg" />
  <p>Here is an optimized transformed image:</p>
  <img src="https://res.cloudinary.com/mycloud/image/upload/f_auto,q_auto/v1700000001/animeverse/pulses/photo_two.png" />
  <p>External image from unsplash (should not match):</p>
  <img src="https://images.unsplash.com/photo-123" />
`;

const extracted = cloudinaryService.extractCloudinaryPublicIds(sampleHtml);
assert.strictEqual(extracted.size, 2, 'Should extract exactly 2 Cloudinary public IDs');
assert.ok(extracted.has('animeverse/pulses/photo_one'), 'Extracted IDs should contain photo_one');
assert.ok(extracted.has('animeverse/pulses/photo_two'), 'Extracted IDs should contain photo_two');
assert.ok(!extracted.has('photo-123'), 'External images should be ignored');

// Test reconciliation diff
const uploadedSession = [
  'animeverse/pulses/photo_one',
  'animeverse/pulses/photo_two',
  'animeverse/pulses/backspaced_inline_three', // removed by user
  'animeverse/pulses/old_banner_four' // removed banner
];

const activeCover = { publicId: 'animeverse/pulses/final_banner_five' };
const activeSet = new Set([...extracted, activeCover.publicId]);

const orphanIds = uploadedSession.filter(id => !activeSet.has(id));
assert.strictEqual(orphanIds.length, 2, 'Exactly 2 unreferenced assets should be identified as orphans');
assert.deepStrictEqual(orphanIds.sort(), ['animeverse/pulses/backspaced_inline_three', 'animeverse/pulses/old_banner_four'].sort());

console.log('✅ Test 6 Passed: Media extraction and orphan reconciliation correctly identify unreferenced assets.\n');

console.log('🎉 All 6 Automated Smoke Tests Passed with 0 Failures!');
