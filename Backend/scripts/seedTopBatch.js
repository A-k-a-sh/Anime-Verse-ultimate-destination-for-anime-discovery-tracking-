const mongoose = require('mongoose');
const Anime = require('../models/Anime');
const jikanApi = require('../utils/jikanApi');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seedTopBatch = async () => {
  try {
    console.log('🌱 Starting Top Anime Batch Seeder (up to 1,000 anime)...');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anime-site';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB at:', mongoUri);

    const initialCount = await Anime.countDocuments();
    console.log(`📊 Current total anime in database: ${initialCount}`);

    const targetPages = parseInt(process.env.TARGET_PAGES) || 40; // 40 pages * 25 = 1,000 anime
    let totalItemsFetched = 0;

    for (let page = 1; page <= targetPages; page++) {
      try {
        const result = await jikanApi.getTopAnime(page, 25);
        const count = result.data ? result.data.length : 0;
        totalItemsFetched += count;

        const currentTotal = await Anime.countDocuments();
        console.log(`Page ${page}/${targetPages} cached (${count} items fetched, Total in DB: ${currentTotal})...`);

        if (result.pagination && !result.pagination.has_next_page) {
          console.log('ℹ️ Reached end of Jikan top anime catalog.');
          break;
        }

        // Wait 1 second between page requests to stay safely under Jikan rate limits
        if (page < targetPages) {
          await delay(1000);
        }
      } catch (err) {
        console.error(`⚠️ Error fetching page ${page}:`, err.message);
        console.log('⏳ Pausing 4 seconds before trying next page...');
        await delay(4000);
      }
    }

    const finalCount = await Anime.countDocuments();
    console.log(`\n🎉 Seeding batch complete!`);
    console.log(`📈 Initial DB Count: ${initialCount}`);
    console.log(`📊 Final DB Count: ${finalCount}`);
    console.log(`✨ Net anime added/updated: ${finalCount - initialCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Batch seeding failed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedTopBatch();
