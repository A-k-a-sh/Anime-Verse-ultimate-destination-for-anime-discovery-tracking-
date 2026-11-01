const mongoose = require('mongoose');
const Anime = require('../models/Anime');
const aniListApi = require('../utils/aniListApi');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const syncAiring = async () => {
  try {
    console.log('🔄 Starting Currently Airing Anime Sync via AniList...');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anime-site';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB at:', mongoUri);

    const targetPages = parseInt(process.env.TARGET_PAGES) || 2; // 2 pages = 50 top currently airing
    console.log(`📡 Fetching currently airing anime (${targetPages * 25} titles)...`);

    const { updatedCount } = await aniListApi.syncCurrentlyAiring(targetPages);

    const totalAiringInDb = await Anime.countDocuments({ status: 'Currently Airing' });
    console.log(`\n🎉 Airing sync complete!`);
    console.log(`✨ Synced / updated ${updatedCount} currently airing titles.`);
    console.log(`📊 Total 'Currently Airing' titles in database: ${totalAiringInDb}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Airing sync failed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

syncAiring();
