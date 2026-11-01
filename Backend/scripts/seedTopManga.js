const mongoose = require('mongoose');
const Manga = require('../models/Manga');
const aniListApi = require('../utils/aniListApi');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seedTopManga = async () => {
  try {
    console.log('🌱 Starting Top Manga Batch Seeder via AniList (up to 100 manga)...');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anime-site';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB at:', mongoUri);

    const initialCount = await Manga.countDocuments();
    console.log(`📊 Current total manga in database: ${initialCount}`);

    const targetPages = parseInt(process.env.TARGET_PAGES) || 4; // 4 pages * 25 = 100 manga
    let totalItemsFetched = 0;

    for (let page = 1; page <= targetPages; page++) {
      try {
        const result = await aniListApi.getTopManga(page, 25);
        const count = result.data ? result.data.length : 0;
        totalItemsFetched += count;

        const currentTotal = await Manga.countDocuments();
        console.log(`Page ${page}/${targetPages} cached (${count} items fetched, Total in DB: ${currentTotal})...`);

        if (result.pagination && !result.pagination.has_next_page) {
          console.log('ℹ️ Reached end of AniList top manga catalog.');
          break;
        }

        if (page < targetPages) {
          await delay(1000);
        }
      } catch (err) {
        console.error(`⚠️ Error fetching manga page ${page}:`, err.message);
        console.log('⏳ Pausing 3 seconds before next page...');
        await delay(3000);
      }
    }

    const finalCount = await Manga.countDocuments();
    console.log(`\n🎉 Manga seeding complete!`);
    console.log(`📈 Initial DB Count: ${initialCount}`);
    console.log(`📊 Final DB Count: ${finalCount}`);
    console.log(`✨ Net manga added/updated: ${finalCount - initialCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Manga batch seeding failed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedTopManga();
