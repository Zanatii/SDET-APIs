import { chromium, Browser, Page } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const TESTER_WEBSITE_URL = process.env.TESTER_WEBSITE_URL!;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000');
const POLL_TIMEOUT_MS = parseInt(process.env.POLL_TIMEOUT_MS || '300000');

// Common typo map — nearby keys on keyboard
const TYPO_MAP: Record<string, string> = {
    a: 's', s: 'a', e: 'r', r: 'e', i: 'o', o: 'i',
    t: 'y', y: 't', n: 'm', m: 'n', l: 'k', k: 'l',
    u: 'y', h: 'j', j: 'h', d: 'f', f: 'd'
};

export class PlaywrightService {
    private browser: Browser | null = null;
    private page: Page | null = null;

    // ── Random Helpers ────────────────────────────────────────

    private randomBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private async wait(min: number, max: number): Promise<void> {
        await this.page!.waitForTimeout(this.randomBetween(min, max));
    }

    private shouldMakeTypo(): boolean {
        // ~8% chance of a typo per letter
        return Math.random() < 0.08;
    }

    private shouldHesitate(): boolean {
        // ~15% chance of mid-sentence hesitation
        return Math.random() < 0.15;
    }

    private shouldBurst(): boolean {
        // ~30% chance of entering a fast burst mode
        return Math.random() < 0.30;
    }

    // ── Typing Helpers ────────────────────────────────────────

    private async typeLetterWithTypo(letter: string): Promise<void> {
        const typoChar = TYPO_MAP[letter.toLowerCase()];

        if (typoChar && this.shouldMakeTypo()) {
            // Type wrong letter
            await this.page!.keyboard.type(typoChar);
            await this.wait(80, 200);

            // Realize mistake — short pause
            await this.wait(200, 500);

            // Backspace
            await this.page!.keyboard.press('Backspace');
            await this.wait(100, 300);

            // Type correct letter
            await this.page!.keyboard.type(letter);
        } else {
            await this.page!.keyboard.type(letter);
        }
    }

    private async typeHumanLike(text: string): Promise<void> {
        await this.wait(800, 2000);

        const lines = text.split('\n');

        for (let l = 0; l < lines.length; l++) {
            const words = lines[l].split(' ');
            let wordCount = 0;

            for (let w = 0; w < words.length; w++) {
                const word = words[w];
                const isBurst = this.shouldBurst();

                for (const letter of word) {
                    await this.typeLetterWithTypo(letter);
                    if (isBurst) {
                        await this.wait(30, 80);
                    } else {
                        await this.wait(60, 180);
                    }
                }

                const lastChar = word[word.length - 1];
                if (['.', ',', '!', '?', ':'].includes(lastChar)) {
                    await this.wait(400, 900);
                }

                if (w < words.length - 1) {
                    await this.page!.keyboard.type(' ');
                    await this.wait(150, 500);

                    wordCount++;
                    if (wordCount % this.randomBetween(4, 8) === 0 && this.shouldHesitate()) {
                        await this.wait(800, 2500);
                    }
                }
            }

            // If there are more lines, use Shift+Enter for new line
            if (l < lines.length - 1) {
                await this.page!.keyboard.press('Shift+Enter');
                await this.wait(100, 300);
            }
        }
    }

    // ── TAB Navigation ────────────────────────────────────────

   private async tabToElement(tabCount: number): Promise<void> {
  if (tabCount === 0) return;
  for (let i = 0; i < tabCount; i++) {
    await this.page!.keyboard.press('Tab');
    await this.wait(150, 400);
  }
}

    // ── Core Methods ──────────────────────────────────────────

    async initialize(): Promise<void> {
        this.browser = await chromium.connectOverCDP(process.env.CHROME_DEBUG_URL!);
        const context = this.browser.contexts()[0];
        this.page = await context.newPage();
        await this.page.goto(process.env.TESTER_WEBSITE_URL!);
        await this.wait(1500, 3000);
        console.log('Connected to existing Chrome session');
    }

    async sendMessage(message: string, tabCount: number): Promise<void> {
        if (!this.page) throw new Error('Browser not initialized');

        // Normalize line endings
        message = message.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        const parts = message.split('<<<PASTE>>>');
        const typePart = parts[0];
        const pastePart = parts[1] || '';

        // Tab to chat input and type the first part humanly
        await this.tabToElement(tabCount);
        await this.wait(400, 900);
        await this.typeHumanLike(typePart);

        // Paste the remainder instantly via execCommand
        if (pastePart) {
            await this.page!.evaluate((text: string) => {
                document.execCommand('insertText', false, text);
            }, pastePart);
        }

        // Re-read pause — scales with full message length
        const reReadTime = Math.min((typePart + pastePart).length * 15, 3000);
        await this.wait(reReadTime * 0.7, reReadTime * 1.3);

        // Press Enter
        await this.page.keyboard.press('Enter');
        console.log('Message sent');
    }

    async waitForResponse(lastMessage: string): Promise<string> {
        if (!this.page) throw new Error('Browser not initialized');

        const RESPONSE_SELECTOR = process.env.CHAT_RESPONSE_SELECTOR!;
        const startTime = Date.now();

        let stableResponse = '';
        let stableCount = 0;

        while (Date.now() - startTime < POLL_TIMEOUT_MS) {
            await this.page.waitForTimeout(POLL_INTERVAL_MS);

            const messages = await this.page.locator(RESPONSE_SELECTOR).all();
            if (messages.length === 0) continue;

            const lastResponse = await messages[messages.length - 1].innerText();

            if (lastResponse && lastResponse.trim() !== lastMessage.trim()) {
                if (lastResponse === stableResponse) {
                    stableCount++;
                } else {
                    stableResponse = lastResponse;
                    stableCount = 0;
                }

                if (stableCount >= 1) {
                    if (!stableResponse.includes('{') || !stableResponse.includes('}')) {
                        stableCount = 0;
                        stableResponse = '';
                        continue;
                    }
                    console.log('Response received');
                    return stableResponse;
                }
            }
        }

        throw new Error('Timed out waiting for tester response');
    }

    async deleteCurrentChat(): Promise<void> {
        try {
            const menuBtn = this.page!.locator('div.relative.group:has(a[aria-current="page"]) button[aria-haspopup="menu"]');
            await menuBtn.hover();
            await menuBtn.click();

            const deleteItem = this.page!.locator('[data-testid="delete-chat-trigger"]');
            await deleteItem.waitFor({ state: 'visible', timeout: 5000 });
            await deleteItem.click();

            const confirmBtn = this.page!.locator('[data-testid="delete-modal-confirm"]');
            await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
            await confirmBtn.click();

            await this.page!.waitForTimeout(1000);
        } catch (err) {
            console.warn('[Proxi] deleteCurrentChat failed (non-critical):', err);
        }
    }

    async close(): Promise<void> {
        if (this.page) {
            await this.page.close();
            this.page = null;
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}