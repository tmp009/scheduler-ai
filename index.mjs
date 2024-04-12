import express from 'express';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs/promises';

import { jsonToString, scheduleScript, createScriptJson } from './tools.mjs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const port = process.env.PORT || 3001;
const scriptFilePath = path.join(__dirname, 'public', 'script.json');

const upload = multer({storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.post('/run', async (req, res) => {
    const prompt = req.body.prompt;
    let scriptJson;

    if (!prompt) {
        console.log(req.body)
        return res.status(400).json({ error: 'missing parameter "prompt"'})
    }

    try {
        scriptJson = JSON.parse(await fs.readFile(scriptFilePath));
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }


    const scriptFormatted = jsonToString(scriptJson)
    const orderedScenes = JSON.parse(await scheduleScript(scriptFormatted, prompt))

    if (orderedScenes.error) {
        return res.status(500).json({ error: orderedScenes.error })
    }

    await fs.writeFile(scriptFilePath, JSON.stringify(createScriptJson(scriptJson, orderedScenes)))

    return res.status(200).json({ status: 200 })
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