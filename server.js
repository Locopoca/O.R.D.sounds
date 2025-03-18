const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

// Serve admin page
app.get('/adminStuff', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Get current music list
app.get('/api/musicList', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'musicList.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to read music list' });
    }
});

// Update music list
app.post('/api/musicList', async (req, res) => {
    try {
        const newList = req.body;
        await fs.writeFile(
            path.join(__dirname, 'public', 'musicList.json'),
            JSON.stringify(newList, null, 2),
            'utf8'
        );
        res.json({ message: 'Music list updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update music list' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});