const express = require('express');
const http = require('http');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Static files
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io Proxy
app.use('/socket.io', createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    ws: true,
    changeOrigin: true,
    logLevel: 'info'
}));

// API Proxy
app.use('/api', createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    logLevel: 'info'
}));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[App] Ready at port ${PORT}`);
});
