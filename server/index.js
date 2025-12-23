const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process'); // <--- NEW: To run Python

const fs = require('fs');
const https = require('https');

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
// Create 'uploads' folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log("📂 Created 'uploads' folder inside Docker");
}
// ----------------------

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
// SEARCH ROUTE
app.post('/api/search', upload.single('image'), async (req, res) => {
    try {
        console.log("🔍 analyzing image...");
        const queryVector = await getVector(req.file.path);
        const allProducts = await Product.find({});
        
        // Calculate score for EVERY product
        const results = allProducts.map(product => {
            if (!product.vector || product.vector.length === 0) return { product, score: 0 };
            return {
                product,
                score: cosineSimilarity(queryVector, product.vector)
            };
        });

        // Sort by highest score
        results.sort((a, b) => b.score - a.score);

        // Get the winner
        const bestMatch = results[0];

        // LOGIC UPGRADE:
        // 1. Score must be decent (> 0.75)
        // 2. The winner must be significantly better than the runner-up (Margin check)
        const runnerUp = results[1];
        const margin = runnerUp ? (bestMatch.score - runnerUp.score) : 1.0;

        console.log(`Top Match: ${bestMatch.product.name} (${bestMatch.score.toFixed(2)})`);
        if (runnerUp) console.log(`Runner Up: ${runnerUp.product.name} (${runnerUp.score.toFixed(2)})`);

        // If we are mostly sure (>0.85) OR (reasonable score >0.78 AND big margin >0.05)
        if (bestMatch.score > 0.7 || (bestMatch.score > 0.7 && margin > 0.05)) {
            res.json({
                found: true,
                product: {
                    ...bestMatch.product.toObject(),
                    confidence: bestMatch.score
                }
            });
        } else {
            console.log("❌ result ambiguous.");
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


// --- SERVE FRONTEND (Added for Deployment) ---

// Tell Node to serve the files inside 'public' (which contains our React build)
app.use(express.static(path.join(__dirname, 'public')));

// Any request that is NOT an API request should go to React
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- START HTTPS SERVER ---

// Load the certificates we just created
const httpsOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// Create HTTPS server instead of HTTP
https.createServer(httpsOptions, app).listen(3000, () => {
  console.log('🚀 SECURE Server running on https://localhost:3000'); // Note the 's'
});