import chalk from "chalk";
import puppeteer from "puppeteer-extra";
import uniqueRandomArray from "unique-random-array";
import { PuppeteerExtraPluginAdblocker } from "puppeteer-extra-plugin-adblocker";
import { writeFile } from "fs/promises";
import { createSpinner } from "nanospinner";
import { delay, getRandomNumber, getText, isVisible } from "./utils.js";
import answers from "../data/answers.json" assert { type: "json" };

var config = undefined;
let questionCount = 0;
const lastTyped = new Map();

async function getAnswer(question) {
    const array = answers.filter(obj => obj.question === question);
    const answerArray = array?.map?.(obj => obj.answer) ?? [];
    return answerArray.find(answer => !lastTyped.get(answer)) ?? uniqueRandomArray(answerArray)()
}

async function addAnswer(question, answer) {
    if (!answers.find(obj => obj.question === question)) {
        return answers.push({question, answer});
    }
}

async function saveAnswers() {
    return writeFile("./data/answers.json", JSON.stringify(answers, null, 4), {encoding: "utf8"})
}

async function login(page) {
    const spinner = createSpinner(`${chalk.bgBlue(` Logowanie jako ${config.login}... `)}`).start();
    try {
        await page.goto("https://instaling.pl/teacher.php?page=login/");
        await page.type("#log_email", config.login, {delay: getRandomNumber(40, 90)});
        await page.type("#log_password", config.password, {delay: getRandomNumber(40, 90)});
        await page.click("#main-container >>> button");

        if (await page.waitForSelector("#student_panel >>> p > a", {timeout: 15000})) {
            spinner.success({ text: " Zalogowano!" });
        };
    } catch (err) {
        spinner.error({ text: " Błąd logowania!" });
    }
} 

async function startSession(page) {
    const spinner = createSpinner(`${chalk.bgBlue(" Rozpoczynanie sesji... ")}`).start();

    await page.click("#student_panel >>> p > a");
    await page.waitForSelector("#start_session_button", {timeout: 15000});
    await delay(getRandomNumber(600, 1200));

    if (await isVisible(page, "#continue_session_button")) {
        await page.click("#continue_session_button");
        spinner.success({ text: " Kontynuowanie sesji!" });
        return;
    }
    await page.click("#start_session_button");
    spinner.success({ text: " Rozpoczęto sesje!" });
}

async function answerQuestion(page) {
    const spinner = createSpinner(`${chalk.bgBlue(` Wykrywanie pytania... `)}`).start();
    const question = await Promise.resolve(getText(page, "#question > div.caption > div.translations"));
    const answer = await getAnswer(question)

    await delay(getRandomNumber(200, 700))

    if (await isVisible(page, "#new_word_form", 200)) {
        await page.click("#dont_know_new")
        await page.click("#skip > #next_word")
        spinner.success({ text: " Kontynuowanie... " })
        return 
    } else {
        questionCount++
        if (answer) {
            spinner.update({ text: `${chalk.bgBlue(` [${questionCount}] Pytanie: "${question}" `)}` })
            spinner.success({ text: ` ${chalk.bgGreen(`[${questionCount}]`)} Pytanie: "${question}" > Odpowiedź: "${answer}"` })
            await page.type("#answer", answer, {delay: getRandomNumber(40, 100)})
        } else {
            spinner.error({text: ` ${chalk.bgRed(`[${questionCount}]`)} Brak zapisanej odpowiedzi dla "${question}" `})
        }
    }

    await delay(getRandomNumber(200, 400))

    await page.click("#check")
    const validAnswer = (await getText(page, "#word")).trim();

    if (answer) {
        lastTyped.set(answer, answer !== validAnswer);
    }
    if (validAnswer) {
        await addAnswer(question, validAnswer);
    }

    await delay(getRandomNumber(200, 400))
    await page.click("#next_word")
}

async function endSession(page) {
    if (!page) return;
    await page.click("#return_mainpage")
    await saveAnswers()
    await page.browser().close();
    console.log(`${chalk.bgBlue(` Sesja została skończona! `)}`)
}

export default async function doSession(cfg) {
    try {
        config = cfg

        puppeteer.use(new PuppeteerExtraPluginAdblocker());
        const [browser] = await Promise.all([
            puppeteer.launch({
                headless: !config.showbrowser,
                args: ["--mute-audio"]
            })
        ]);

        const page = await browser.newPage();

        await login(page, config);
        await startSession(page);
        try {
            while (true) {
                const finished = await isVisible(page, "#return_mainpage", 100)
                if (!finished) {
                    await answerQuestion(page);
                } else {
                    await endSession(page)
                    break;
                }
            }
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error);
    }
} 
