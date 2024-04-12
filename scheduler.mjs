import 'dotenv/config';

import fs from 'fs/promises';
import yargs from 'yargs'
import { jsonToString, scheduleScript, createScriptJson } from './tools.mjs'

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


async function main() {
    const prompt = args[1]
    const scriptJson = JSON.parse(await fs.readFile(args[0]));
    const scriptFomatted = jsonToString(scriptJson)
    const orderedScenes = JSON.parse(await scheduleScript(scriptFomatted, prompt))


    if (orderedScenes.error) {
        console.error(orderedScenes.error)

        process.exit(1)
    }

    const newScriptJson = createScriptJson(scriptJson, orderedScenes);

    await fs.writeFile(argv.output, JSON.stringify(newScriptJson, null, 4))
}

main()