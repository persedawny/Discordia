import { Client, Collection, Intents } from "discord.js";
import { ICommand } from "./abstractions/ICommand";
import { FileReader } from "./helpers/FileReader";

import Database from 'better-sqlite3';

export class DiscordiaClient extends Client {
    public databaseConnection: Database;

    private commands: Collection<string, ICommand>;
    private fileReader: FileReader;

    private eventSourcePath: string;
    private commandSourcePath: string;
    private cronJobSourcePath: string;

    constructor(
        eventSourcePath: string,
        commandSourcePath: string,
        cronJobSourcePath: string,
        databasePath: string) {
        super({ intents: [Intents.FLAGS.GUILDS] });
        this.commands = new Collection();
        this.databaseConnection = new Database(databasePath, { verbose: console.log });
        this.fileReader = new FileReader();

        this.eventSourcePath = eventSourcePath;
        this.commandSourcePath = commandSourcePath;
        this.cronJobSourcePath = cronJobSourcePath;

        this.initializeEvents();
        this.initializeCommands();
        super.login(process.env.DISCORD_TOKEN);
        this.initializeAndStartCronJobs();
    }

    private initializeEvents() {
        var eventFiles = this.fileReader.getAllFilesFromDirectory(this.eventSourcePath, '.ts');

        for (let file of eventFiles) {
            let event = require(`${this.eventSourcePath}/${file}`);

            if (event.once) {
                super.once(event.default.name, (...args) => event.default.execute(...args));
            } else {
                super.on(event.default.name, (...args) => event.default.execute(...args));
            }
        }
    }

    private initializeCommands() {
        const commandFiles = this.fileReader.getAllFilesFromDirectory(this.commandSourcePath, '.ts');

        for (let file of commandFiles) {
            let commandFile = require(`${this.commandSourcePath}/${file}`);
            let command = new commandFile.default(this);

            this.commands.set(command.data.name, command);
        }
    }

    private initializeAndStartCronJobs() {
        let jobFiles = this.fileReader.getAllFilesFromDirectory(this.cronJobSourcePath, '.ts');

        for (const file of jobFiles) {
            let job = require(`${this.cronJobSourcePath}/${file}`);
            new job.default(this).start();
        }
    }
}