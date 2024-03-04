export const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min)) + min;

export async function delay(time) {
    return new Promise((r) => setTimeout(r, time));
}

export async function isVisible(page, selector, delay = 1000) {
    return page.waitForSelector(selector, {visible: true, timeout: delay})
        .then(() => true)
        .catch(() => false);
}

export async function getText(page, selector) {
    await isVisible(page, selector);
    const element = await page.$(selector);
    return page.evaluate(element => element.textContent, element);
}
