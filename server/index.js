const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// --- SETUP ---
const app = express();
const upload = multer({ dest: 'uploads/' }); // Temp folder for images

app.use(cors()); // Allow Frontend (port 5173) to talk to Backend (port 3000)
app.use(express.json());

// --- 1. CONNECT TO MONGODB ---
// We connect to the local database named 'cpf-inventory'
mongoose.connect('mongodb://127.0.0.1:27017/cpf-inventory')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- 2. DEFINE THE DATA STRUCTURE ---
// Every product in the database must look like this
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  imagePath: String,
  vector: [Number] // This is for the AI later
});

const Product = mongoose.model('Product', ProductSchema);

// --- 3. API ROUTES ---

// SEARCH ROUTE (Frontend asks: "What is this?")
app.post('/api/search', upload.single('image'), async (req, res) => {
    console.log("🔍 Search request received");
    
    // TEMPORARY LOGIC: Just return the last item added to prove connection works
    try {
        const latestProduct = await Product.findOne().sort({ _id: -1 });
        
        if (latestProduct) {
            res.json({
                found: true,
                product: {
                    id: latestProduct._id,
                    name: latestProduct.name,
                    price: latestProduct.price,
                    category: "Database Item",
                    confidence: 0.99
                }
            });
        } else {
            res.json({ found: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// REGISTER ROUTE (Frontend says: "Save this new item")
app.post('/api/register', upload.single('image'), async (req, res) => {
    try {
        const { name, price } = req.body;
        console.log(`📝 Registering: ${name} (${price} THB)`);

        const newProduct = new Product({
            name: name,
            price: Number(price),
            imagePath: req.file.path,
            vector: [] 
        });

        await newProduct.save();
        console.log("✅ Saved to Database!");

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- START SERVER ---
app.listen(3000, () => {
  console.log('🚀 Server running on port 3000');
});