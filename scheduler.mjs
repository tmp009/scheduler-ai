import 'dotenv/config';

import { OpenAI } from 'openai';
import fs from 'fs/promises';
import yargs from 'yargs'

const argv = yargs(process.argv.slice(2))
.options({
        'output':{
            alias: 'o',
            describe: 'output filename.',
            type: 'string',
            default: "output.json",
        }
})
.showHelpOnFail(true, 'Error: Missing positional argument. Please provide a positional argument')
.demandCommand(2)
.usage('Usage: $0 [options] <script> <prompt>')
.alias('h', 'help')
.parse();

const args = argv._;

const openai = new OpenAI();

async function main() {
    const prompt = args[1]
    const scriptJson = JSON.parse(await fs.readFile(args[0]));
    const scriptFomatted = jsonToString(scriptJson)
    const orderedScenes = JSON.parse(await scheduleScript(scriptFomatted, prompt))

    const newScriptJson = {
        chunkNum: scriptJson.chunkNum,
        metadata: scriptJson.metadata,
        scenes: []
    }

    if (orderedScenes.error) {
        console.error(orderedScenes.error)

        process.exit(1)
    }

    for (const sceneNumber of orderedScenes.scenes) {
        const scene = scriptJson.scenes.find(s => s.scene_number == sceneNumber);

        if (!scene) {
            break;
        }

        newScriptJson.scenes.push(scene);
    }

    for (const s of scriptJson.scenes) {
        if (!orderedScenes.scenes.includes(String(s.scene_number))) {
            newScriptJson.scenes.push(s.scene_number);
        }
    }


    await fs.writeFile(argv.output, JSON.stringify(newScriptJson, null, 4))
}

async function scheduleScript(script, prompt) {
    const messages = [
        {role:'system', content: 'You are film scheduler. You will rearrange movie scenes in the requested manner. You will take a movie script and return JSON object with key "scenes" which is an array containing scene numbers as string. Do not handle vague tasks or impossible task. add key "error" with a string explaining the error. NEVER put the same scene more than once. Always return all scene numbers even if unaffected. Do not delete or ommit scenes unless explictly asked'},
        {role:'system', content: 'You can for example order by time (morning, day, evening, night), location/set, synopis, etc.'},
        {role:'user', content: 'Script content: ' + script},
        {role:'user', content: prompt},
    ]

    const completion = await openai.chat.completions.create({
        messages: messages,
        model: 'gpt-4-turbo-2024-04-09',
        temperature: 0.7,
        response_format: { type: 'json_object' }
    });

    return completion.choices[0].message.content;
}

function jsonToString(scriptJson) {
    let script = "";
    const sceneTexts = []

    for (const scene of scriptJson.scenes) {
        let sceneText = `${scene.scene_number}. ${scene.set.type.join('/')} TIME: ${scene.time}; LOCATION: ${scene.location};\nSynopsis: ${scene.synopsis}\n`
        sceneTexts.push(sceneText);
    }

    return script + sceneTexts.join('\n');
}


main()