import { Client, Collection, Intents, MessageEmbed, MessageEmbedOptions } from "discord.js";
import glob from "glob";
import db from "quick.db";
import { promisify } from "util";

import { configuration } from "../Private/Data";

const pGlob = promisify(glob);

class Bot extends Client {
	public cmds: Collection<string, any> = new Collection();
	public aliases: Collection<string, string> = new Collection();
	public db: typeof db = db;

	public owner; // Defined in 'ready.ts' event.

	constructor() {
		super({
			partials: ["GUILD_MEMBER", "MESSAGE", "USER", "CHANNEL"],
			intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
		});
	}

	public d = {
		color: (query?: string): string => {
			if (!query) return "292841";

			let result: string;
			switch (query) {
				case "green":
					result = "379558";
					break;
				case "blue":
					result = "292841";
					break;
				default:
					result = "292841";
					break;
			}

			return result;
		},
		embed: (data?: MessageEmbedOptions): MessageEmbed => {
			return new MessageEmbed({ ...data, description: data.description || "Default description." });
		}
	};

	public async start(config: { token: string; [key: string]: any }) {
		const commands = await pGlob(`${__dirname}/../commands/**/*{.ts,.js}`);
		const events = await pGlob(`${__dirname}/../events/**/*{.ts,.js}`);

		commands.map(async (file) => {
			let cmd = await import(file);
			if (cmd.default) cmd = cmd.default;

			if (!cmd.name) return console.error(`Error! Missing name to ${file}`);
			if (this.cmds.get(cmd.name)) return console.error(`Error! Found duplicated command: ${cmd.name} (${file})`);

			this.cmds.set(cmd.name, cmd);

			if (cmd.name && cmd.aliases) {
				typeof cmd.aliases === "string" ? (this.aliases.get(cmd.aliases) ? null : this.aliases.set(cmd.aliases, cmd.name)) : null;

				if (Array.isArray(cmd.aliases)) {
					cmd.aliases.map((aliase: string) => {
						if (this.aliases.get(aliase)) return console.error(`Error! Found duplicated aliase ${aliase} (${cmd.name})`);

						this.aliases.set(aliase, cmd.name);
					});
				}
			}
		});

		events.map(async (file) => {
			let event = await import(file);
			if (event.default) event = event.default;

			if (!event.name) return console.error(`Error! Missing name to ${file}`);

			this.on(event.name, event.bind(null, this));
		});

		this.login(config.token);
	}
}

export { Bot };
