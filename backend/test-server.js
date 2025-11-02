import express from 'express';

const app = express();
const PORT = 5002;

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`🔗 Test URL: http://localhost:${PORT}/test`);
  
  // Auto-shutdown after 5 seconds
  setTimeout(() => {
    console.log('🔄 Test completed successfully');
    process.exit(0);
  }, 5000);
});