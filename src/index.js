#!/usr/bin/env node

import fs from "fs";
import chalk from "chalk";
import figlet from "figlet";
import select from "@inquirer/select";
import input from "@inquirer/input";
import confirm from "@inquirer/confirm";
import gradient from "gradient-string";
import { delay } from "./utils.js";
import doSession from "./solver.js";

var config = undefined;

async function startCard() {
	console.clear();
	figlet("instalinger", function (err, data) {
		const grdnt = gradient(["rgb(36, 152, 147)", "rgb(0, 84, 92)"]);
		console.log(grdnt.multiline(data) + `${chalk.gray("- dawid")}\n`);
	});
	await delay(50);
}

async function saveSettings() {
	await fs.writeFileSync("./data/config.json", JSON.stringify(config));
}

async function settings() {
	await startCard();

	const answer = await select({
		message: `${chalk.bgBlue(" Wybierz opcję: ")}`,
		choices: [
			{
				name: ` Dane logowania (${config.login})`,
				value: "login",
				description: " Zmień dane logowania do Instaling.",
			},
			{
				name: ` Pokazuj przeglądarke (${config.showbrowser})`,
				value: "browser",
				description: " Pokazuję przeglądarkę podczas robienia sesji.",
			},
			{
				name: " Wyjdź",
				value: "exit",
				description: " Wyjdź z ustawień.",
			},
		],
	});

	switch (answer) {
		case "login":
			config.login = await input({
				message: `${chalk.bgBlue(" Login: ")}`,
			});
			config.password = await input({
				message: `${chalk.bgBlue(" Hasło: ")}`,
			});
			break;
		case "browser":
			config.showbrowser = await confirm({
				message: `${chalk.bgBlue(" Wybierz opcję (Y = tak, n = nie): ")}`,
			});
			break;
		case "exit":
			main();
			return;
	}

	settings();
	saveSettings();
}

async function main() {
	await startCard();

	if (!fs.existsSync("./data/config.json")) {
		await fs.writeFileSync(
			"./data/config.json",
			`{"login": "", "password": "", "showbrowser": false}`
		);
	}
	const configFile = await fs.readFileSync("./data/config.json");
	config = JSON.parse(configFile)

	const answer = await select({
		message: `${chalk.bgBlue(" Wybierz opcję: ")}`,
		choices: [
			{
				name: " Start",
				value: "start",
				description: " Zrób jedną sesję.",
			},
			{
				name: " Ustawienia",
				value: "settings",
				description: " Zmień ustawienia bota.",
			},
			{
				name: " Wyjdź",
				value: "exit",
				description: " Wyjdź z aplikacji.",
			},
		],
	});

	switch (answer) {
		case "start":
			doSession(config);
			break;
		case "settings":
			settings();
			break;
		case "exit":
			break;
	}
}

(async () => {
	try {
		main();
	} catch (error) {
		console.log(error);
	}
})();
