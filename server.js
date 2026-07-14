import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GAS_URL = process.env.VITE_GAS_URL;

// 🛠️ 修正後的 CORS 精確設定
const corsOptions = {
  origin: 'https://shwujen.github.io', // 👈 允許你的 GitHub Pages 前端網站存取
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // 確保舊版瀏覽器（如 IE）對 OPTIONS 請求回傳 200
};

app.use(cors(corsOptions)); // 👈 套用精確設定
app.use(bodyParser.json());

// 測試 API 連接
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Express Server is running.' });
});

// 獲取所有書籍與管理資訊
app.get('/api/books', async (req, res) => {
  console.log('GET /api/books requested');
  try {
    const url = `${GAS_URL}?action=list`;
    console.log('Fetching from GAS URL:', url);
    const response = await fetch(url);
    const text = await response.text();
    console.log('GAS response length:', text.length);
    const data = JSON.parse(text);
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from GAS:', error);
    res.status(500).json({ error: 'Failed to fetch data from database' });
  }
});

// 新增/修改/刪除書籍 (透過 doPost)
app.post('/api/books/action', async (req, res) => {
  console.log('POST /api/books/action requested, body:', req.body);
  try {
    console.log('Posting to GAS URL:', GAS_URL);
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const text = await response.text();
    console.log('GAS action response:', text);
    const data = JSON.parse(text);
    res.json(data);
  } catch (error) {
    console.error('Error sending action to GAS:', error);
    res.status(500).json({ error: 'Failed to perform database action' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});