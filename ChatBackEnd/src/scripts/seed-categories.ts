
import { connect, connection, Schema, model } from 'mongoose';

const MONGO_URI = 'mongodb://root:password@localhost:27017/restaurant?authSource=admin';
const CATEGORIES = ['招牌菜', '凉菜', '热菜', '主食', '饮料', '汤品'];

// Minimal schema to interact with the existing collection
const dishSchema = new Schema({
    name: String,
    category: String
}, { strict: false }); // strict: false allows us to write fields that might not be fully defined here if needed, though we defined category

const DishModel = model('Dish', dishSchema);

async function seed() {
    console.log('Connecting to MongoDB at ' + MONGO_URI);
    try {
        await connect(MONGO_URI);
        console.log('Connected successfully.');
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }

    try {
        // Find dishes that don't have a category or it's null/empty
        const dishes = await DishModel.find({ 
            $or: [
                { category: { $exists: false } },
                { category: null },
                { category: "" }
            ]
        });

        console.log(`Found ${dishes.length} dishes to update.`);

        if (dishes.length === 0) {
            console.log('No dishes need updating.');
        }

        for (const dish of dishes) {
            const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
            // We can treat it as any to avoid TS strict type checking against the minimal schema if needed
             // @ts-ignore
            dish.category = randomCategory;
            await dish.save();
            // @ts-ignore
            console.log(`Updated dish "${dish.name}" -> Category: ${randomCategory}`);
        }

        console.log('All updates finished.');

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await connection.close();
        console.log('Disconnected.');
    }
}

seed();
