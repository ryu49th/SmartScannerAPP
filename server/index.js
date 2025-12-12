const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process'); // <--- NEW: To run Python

// --- SETUP ---
const app = express();
// --- MULTER CONFIG (FIXED) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // We add '.jpg' to the end so YOLO knows it is an image
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '.jpg')
  }
})
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/cpf-inventory')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  imagePath: String,
  vector: [Number] 
});
const Product = mongoose.model('Product', ProductSchema);

// --- HELPER 1: CALL PYTHON AI ---
const getVector = (imagePath) => {
    return new Promise((resolve, reject) => {
        // We use the Python inside your venv
        const pythonProcess = spawn('../../env1/bin/python', ['ai_engine.py', imagePath]);

        let dataString = '';

        // Collect data from Python
        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        // Handle Errors
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        // When Python finishes...
        pythonProcess.on('close', (code) => {
            try {
                // Find the JSON part (sometimes Python prints extra warnings)
                const jsonStart = dataString.indexOf('{');
                const jsonEnd = dataString.lastIndexOf('}');
                if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
                
                const cleanJson = dataString.substring(jsonStart, jsonEnd + 1);
                const result = JSON.parse(cleanJson);

                if (result.success) {
                    resolve(result.vector);
                } else {
                    reject(new Error(result.error));
                }
            } catch (e) {
                console.error("Raw Output:", dataString);
                reject(new Error("Failed to parse AI output"));
            }
        });
    });
};

// --- HELPER 2: COMPARE VECTORS (MATH) ---
const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// --- API ROUTES ---

// 1. SEARCH ROUTE
app.post('/api/search', upload.single('image'), async (req, res) => {
    try {
        console.log("🔍 analyzing image...");
        
        // 1. Get vector of uploaded image
        const queryVector = await getVector(req.file.path);
        
        // 2. Get all products from DB
        const allProducts = await Product.find({});
        
        let bestMatch = null;
        let bestScore = -1;

        // 3. Compare with every product
        allProducts.forEach(product => {
            if (!product.vector || product.vector.length === 0) return;
            
            const score = cosineSimilarity(queryVector, product.vector);
            // Log scores to help debug
            // console.log(`Score for ${product.name}: ${score}`);

            if (score > bestScore) {
                bestScore = score;
                bestMatch = product;
            }
        });

        // 4. Threshold (0.85 is a good starting point for "Very Similar")
        if (bestMatch && bestScore > 0.75) {
            console.log(`✅ Found: ${bestMatch.name} (${bestScore.toFixed(2)})`);
            res.json({
                found: true,
                product: {
                    id: bestMatch._id,
                    name: bestMatch.name,
                    price: bestMatch.price,
                    category: "Identified Item",
                    confidence: bestScore
                }
            });
        } else {
            console.log("❌ No match found.");
            res.json({ found: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'AI processing failed' });
    }
});

// 2. REGISTER ROUTE
app.post('/api/register', upload.single('image'), async (req, res) => {
    try {
        const { name, price } = req.body;
        console.log(`📝 Learning: ${name}...`);

        // 1. Convert image to vector
        const vector = await getVector(req.file.path);

        // 2. Save everything to MongoDB
        const newProduct = new Product({
            name,
            price: Number(price),
            imagePath: req.file.path,
            vector: vector 
        });

        await newProduct.save();
        console.log("✅ Saved to Database with AI Vector!");
        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(3000, () => {
  console.log('🚀 Server running on port 3000');
});