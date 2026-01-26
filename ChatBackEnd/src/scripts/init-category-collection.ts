import { connect, connection, Schema, model } from 'mongoose';

const MONGO_URI = 'mongodb://root:password@localhost:27017/restaurant?authSource=admin';

const INIT_CATEGORIES = [
    { name: '招牌菜', sortOrder: 100 },
    { name: '热菜', sortOrder: 90 },
    { name: '凉菜', sortOrder: 80 },
    { name: '主食', sortOrder: 70 },
    { name: '饮料', sortOrder: 60 }
];

// Define minimal Schema matching the one in the module
const CategorySchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const CategoryModel = model('Category', CategorySchema);

async function initCategories() {
    console.log('🚀 Connecting to MongoDB...');
    try {
        await connect(MONGO_URI);
        console.log('✅ Connected successfully.');
    } catch (err) {
        console.error('❌ Connection failed:', err);
        process.exit(1);
    }

    let successCount = 0;
    let failCount = 0;

    console.log('📦 Starting to seed categories...');

    for (const cat of INIT_CATEGORIES) {
        try {
            // Try to create only if it doesn't exist
            // Using updateOne with upsert to avoid duplicate key errors if run multiple times
            const result = await CategoryModel.updateOne(
                { name: cat.name },
                { 
                    $setOnInsert: { 
                        name: cat.name,
                        sortOrder: cat.sortOrder,
                        isActive: true
                    } 
                },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                console.log(`   ✅ Created category: ${cat.name}`);
                successCount++;
            } else {
                console.log(`   ⚠️  Category already exists: ${cat.name}`);
            }
        } catch (error) {
            console.error(`   ❌ Failed to process ${cat.name}:`, error);
            failCount++;
        }
    }

    console.log(`\n🎉 Finished! Created: ${successCount}, Skiped/Failed: ${INIT_CATEGORIES.length - successCount}`);
    
    await connection.close();
    process.exit(0);
}

initCategories();
