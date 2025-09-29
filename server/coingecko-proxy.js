import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// CoinGecko API proxy endpoint
app.get('/api/coingecko/markets', async (req, res) => {
  try {
    const { ids, vs_currency = 'usd', order = 'market_cap_desc', per_page = '250', page = '1', sparkline = 'false', price_change_percentage = '24h' } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'Missing required parameter: ids' });
    }

    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency,
        ids,
        order,
        per_page,
        page,
        sparkline,
        price_change_percentage
      },
      timeout: 10000, // 10 second timeout
    });

    res.json(response.data);
  } catch (error) {
    console.error('CoinGecko API proxy error:', error);

    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({
        error: 'CoinGecko API request failed',
        details: error.message
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CoinGecko proxy server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 CoinGecko proxy: http://localhost:${PORT}/api/coingecko/markets`);
});

export default app;
