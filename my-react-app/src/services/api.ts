import axios from 'axios';

// 1. DEFINE THE TYPE (So App.tsx doesn't crash)
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  confidence: number;
}

// Point to your running server
const API_URL = 'http://localhost:3000/api';

// HELPER: Convert Webcam Base64 -> Blob (File)
const base64ToBlob = async (base64: string) => {
  const res = await fetch(base64);
  return await res.blob();
};

// 2. THE REAL API LOGIC
export const api = {
  // SEARCH: Sends photo to server, returns found product
  searchProduct: async (base64Image: string | null): Promise<Product | null> => {
    if (!base64Image) return null;
    
    // Prepare the image file
    const blob = await base64ToBlob(base64Image);
    const formData = new FormData();
    formData.append('image', blob, 'scan.jpg');

    try {
      console.log("Sending to server...");
      // POST http://localhost:3000/api/search
      const res = await axios.post(`${API_URL}/search`, formData);
      
      if (res.data.found) {
        return res.data.product;
      }
      return null;
    } catch (error) {
      console.error("Server Connection Error:", error);
      return null;
    }
  },

  // REGISTER: Sends photo + name + price to server
  registerProduct: async (data: { name: string; price: string; image: string | null }) => {
    if (!data.image) return;

    const blob = await base64ToBlob(data.image);
    const formData = new FormData();
    formData.append('image', blob, 'new-item.jpg');
    formData.append('name', data.name);
    formData.append('price', data.price);

    console.log("Registering with server...");
    // POST http://localhost:3000/api/register
    await axios.post(`${API_URL}/register`, formData);
    return true;
  }
};