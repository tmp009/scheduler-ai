import { exec } from 'child_process';
import express from 'express';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const port = process.env.PORT || 3001;

const upload = multer({storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.post('/run', async (req, res) => {
    const prompt = req.body.prompt;
    if (!prompt) {
        console.log(req.body)
        return res.status(400).json({ error: 'missing parameter "prompt"'})
    }

    exec(`node scheduler.mjs -o .\\public\\script.json .\\public\\script.json "${prompt}"`, (err, stdout, stderr) => {
        if (stderr) {
            return res.status(500).json({ error: stderr })
        } else {
            return res.status(200).json({ status: 200 })
        }
    })

})

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({error: 'No files were uploaded.'});
    }
    const file = req.file.buffer;

    await fs.writeFile(path.join(__dirname, 'public', 'script.json'), file);
    res.json({ status: 200 })
})

app.listen(port, 'localhost', () => { console.log(`http://localhost:${port}`); });