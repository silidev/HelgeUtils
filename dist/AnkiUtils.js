"use strict";
/* Well, to be precise this is utility code for AnkiDroid
*
* Copyright 2024 by Helge Kosuch
* */
/* Wrapper around the AnkDroid API.
 * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API */
var printDebug = HtmlUtils.ErrorHandling.printDebug;
var assertTypeEquals = HelgeUtils.Misc.assertTypeEquals;
/** This contains only simple wrappers for the real JS-API*/
class JsApi {
    static mock = isAnkiDesktop;
    static disableDangerousActions = false;
    static api;
    static async getApi() {
        if (this.api)
            return this.api;
        this.api =
            new AnkiDroidJS({ version: "0.0.3", developer: "only_for_myself@nowhere" });
        return this.api;
    }
    static async addTagToCard() {
        if (JsApi.mock)
            return;
        await (await JsApi.getApi()).ankiAddTagToCard();
    }
    static async buryCard() {
        if (JsApi.mock || JsApi.disableDangerousActions)
            return;
        await (await JsApi.getApi()).ankiBuryCard();
    }
    static answerEase(easeButtonNumber) {
        if (JsApi.mock || JsApi.disableDangerousActions)
            return;
        if (isMobile)
            window["buttonAnswerEase" + easeButtonNumber]();
        else if (debug)
            console.log("Called buttonAnswerEase" + easeButtonNumber);
    }
    static wrapString = (value) => {
        return { success: true, value: value };
    };
    static nextTimeStringForButtonRaw = async (i) => {
        if (JsApi.mock)
            return JSON.stringify(this.wrapString("2mock"));
        return await (await JsApi.getApi())["ankiGetNextTime" + i]();
    };
    /**
     * Returns card type
     *
     * 0 = new
     * 1 = learning
     * 2 = review
     * 3 = relearning
     *
     * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#card-type
     */
    static async cardStatus() {
        if (JsApi.mock) {
            return 2;
        }
        return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardType"));
    }
    /**
     * new: note id or random int
     * due: integer day, relative to the collection's creation time
     * learning: integer timestamp
     *
     * source: https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#due
     */
    static async cardDue() {
        if (JsApi.mock)
            return 0;
        return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardDue"));
    }
    static async cardDueRaw() {
        if (JsApi.mock)
            return { value: 0 };
        return (await (await JsApi.getApi()).ankiGetCardDue());
    }
    /**
     * original due: In filtered decks, it's the original due date that the card had before moving to filtered. (integer
     * day, relative to the collection's creation time)
     *                     -- If the card lapsed in scheduler1, then it's the value before the lapse. (This is used when
     * switching to scheduler
     * 2. At this time, cards in learning becomes due again, with their previous due date)
     *                     -- In any other case it's 0.
     * Source: https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#original-due
     */
    static async cardOriginalDue() {
        if (JsApi.mock)
            return 0;
        return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardODue"));
    }
    static async intervalOfCard() {
        if (JsApi.mock)
            return 42;
        return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardInterval"));
    }
    /**
     * @return Return ease factor of the card in permille (parts per thousand)
     *
     * Gotchas: Yes, really permille, not percent, in contrast to the UI where it is percent.
     *
     * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API/9fb80befe5c3551665a0a07886138025bcd9b4f1#card-ease-factor
     */
    static async ease() {
        if (JsApi.mock)
            return 2500;
        return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardFactor"));
    }
    static showAnswer() {
        window["showAnswer"]();
    }
    /**
     * Reschedule card with x days
     *
     * "This will set the interval of the card to x (cf this issue)"
     *
     * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#reschedule-card-with-x-days
     *
     * "Turn cards into review cards, and make them due on a certain date. This can be useful for moving cards forward
     * or back a few days when your study schedule is interrupted. Entering a range like 60-90 will make the selected
     * cards due between 60 and 90 days from now. New cards will have their interval set to the same delay, but
     * reviews will be rescheduled without changing their current interval, unless '!' is included at the end of the
     * range. (Note that answer time is not recorded when manually scheduling cards, since the action can be performed
     * even outside of review, and Anki isn’t aware of which card may or may not be shown at the time.)" Source:
     * https://docs.ankiweb.net/browsing.html#cards
     */
    static async setCardDue(days) {
        if (JsApi.mock || JsApi.disableDangerousActions)
            return;
        await (await JsApi.getApi()).ankiSetCardDue(days);
    }
    static async cardId() {
        if (JsApi.mock)
            return 12345;
        return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardId"));
    }
    /**
     https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#last-modified-time-of-card
     If a card was never modified, this does NOT give the time when it was added,
     but some other unknown value, which does not seem to be in relation to to the
     added time. Maybe it is like the return value of the "cardDue" API method which returns "note id or random int" for new cards.
     */
    static async cardMod() {
        if (JsApi.mock)
            return 0;
        return await this.CallWithFailNotification.asNumber("ankiGetCardMod");
    }
    static async toggleFlag() {
        if (JsApi.mock)
            return;
        return (await JsApi.getApi())["ankiToggleFlag"]();
    }
    static async toggleMarkCard() {
        if (JsApi.mock)
            return;
        return (await JsApi.getApi())["ankiMarkCard"]();
    }
    static async eta() {
        if (JsApi.mock)
            return 1;
        return await this.CallWithFailNotification.asNumber("ankiGetETA");
    }
    static async searchCard(query) {
        if (JsApi.mock)
            return;
        await (await JsApi.getApi())["ankiSearchCard"](query);
    }
    /** @deprecated */
    static async cardInterval() {
        return this.intervalOfCard();
    }
    static async showToast() {
        (await JsApi.CallWithFailNotification.asVoid("ankiShowToast"));
    }
    static TTS = class {
        static QUEUE_ADD = 1;
        static QUEUE_FLUSH = 0;
        static async setLanguage(language) {
            if (JsApi.mock)
                return;
            await (await JsApi.getApi())["ankiTtsSetLanguage"](language);
        }
        /**
         * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#speak
         */
        static async speak(text, queueMode = 0) {
            if (JsApi.mock)
                return;
            await (await JsApi.getApi())["ankiTtsSpeak"](text, queueMode);
        }
        /**
         * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#set-tts-speed
         */
        static async setSpeed(speed) {
            if (JsApi.mock)
                return;
            await (await JsApi.getApi())["ankiTtsSetSpeechRate"](speed);
        }
        static async stop() {
            if (JsApi.mock)
                return;
            await (await JsApi.getApi())["ankiTtsStop"]();
        }
        static async isSpeaking() {
            if (JsApi.mock)
                return false;
            return JsApi.CallWithFailNotification.asBoolean("ankiTtsIsSpeaking");
        }
        static async english() {
            if (JsApi.mock)
                return;
            await (await JsApi.getApi())["ankiTtsSetLanguage"]('en-US');
        }
        static async german() {
            if (JsApi.mock)
                return;
            await (await JsApi.getApi())["ankiTtsSetLanguage"]('de-de');
        }
        static async flushQueue() {
            await JsApi.TTS.speak("", JsApi.TTS.QUEUE_FLUSH);
        }
    };
    static CallWithFailNotification = class {
        static valueAsAnyIfSuccess = async (methodName) => {
            const retVal = await (await JsApi.getApi())[methodName]();
            if (retVal?.success !== true)
                printError("JS API did NOT return success===true");
            return retVal["value"];
        };
        static asString = async (methodName) => {
            const retVal = await this.valueAsAnyIfSuccess(methodName);
            assertTypeEquals(retVal, "string");
            return retVal;
        };
        static asNumber = async (methodName) => {
            const retVal = await this.valueAsAnyIfSuccess(methodName);
            assertTypeEquals(retVal, "number");
            return retVal;
        };
        static asBoolean = async (methodName) => {
            const retVal = await this.valueAsAnyIfSuccess(methodName);
            assertTypeEquals(retVal, "boolean");
            return retVal;
        };
        static asVoid = async (methodName) => {
            await this.valueAsAnyIfSuccess(methodName);
        };
    };
}
class Anki {
    static numToStr = HelgeUtils.Strings.numToStr;
    /** The date when the collection was created.
     * Unconveniently, this is needed to calculate the due date from
     * the value the API returns. */
    static dateOfCreationOfCollection = new Date(2023, 5, 12);
    /**
     * @param i A number between 1 and 4.
     */
    static async answerButtonLabel(i) {
        const nextTimeString = await this.nextTimeStringForButton(i);
        const nextTimeValueAndUnit = this.parseButtonTimeStrNumberAndUnit(nextTimeString);
        let value = nextTimeValueAndUnit.value;
        const unit = nextTimeValueAndUnit.unit;
        { /* Round the value if it is close to an integer */
            const roundedRatio = value / Math.round(value);
            if (Math.abs(roundedRatio - 1) < 0.15)
                value = Math.round(value);
        }
        if (label_only_min_and_hour_default_buttons) {
            if (unit === "h" || unit === "m")
                return value + unit;
            return "";
        }
        const next = this.tryToConvertButtonTimeStrToDays(nextTimeString);
        const ifNumberAppendD = (input) => {
            if (typeof input === "number")
                return input + " d";
            return input;
        };
        const buttonRatio = await this.buttonRatio(next);
        const daysStr = (days) => {
            const buttonRatioIsEmpty = buttonRatio === "";
            if (buttonRatioIsEmpty)
                return days;
            return `x<p class="nextTimeOnButtons">(${days})</p>`;
        };
        return buttonRatio + daysStr(ifNumberAppendD(next));
    }
    static async nextTimeStringForButton(i) {
        const returnValueFromApi = await JsApi.nextTimeStringForButtonRaw(i);
        let corrected;
        const retType = typeof returnValueFromApi;
        if (retType === "string") {
            corrected = JSON.parse(returnValueFromApi);
        }
        else if (retType === "object")
            corrected = returnValueFromApi["value"];
        else
            throw new Error("nextTimeStringForButton: unexpected return type");
        if (!corrected.success)
            printDebug("JS API returned success===false");
        return corrected.value;
    }
    static async nextTimeValueAndUnitForButton(i) {
        return this.parseButtonTimeStrNumberAndUnit(await this.nextTimeStringForButton(i));
    }
    static async buttonRatio(daysOfButton) {
        const daysSinceLastSeen = await this.daysSinceLastSeen();
        if (typeof daysOfButton === "string" || daysSinceLastSeen === 0)
            return "";
        try {
            const ratio = daysOfButton / daysSinceLastSeen;
            let roundedAsString;
            if (ratio >= 1.7)
                roundedAsString = ratio.toFixed(0);
            else if (.7 < ratio && ratio < 1.3)
                roundedAsString = "1";
            else if (.4 < ratio && ratio <= .7)
                roundedAsString = "½";
            else if (.2 < ratio && ratio <= .4)
                roundedAsString = "⅓";
            else if (ratio && ratio <= .2)
                roundedAsString = "⅟ₓ";
            else
                roundedAsString = ratio.toFixed(1);
            return this.numToStr(roundedAsString);
        }
        catch (err) {
            return ""; // Intentially swallowed.
        }
    }
    static parseButtonTimeStrNumberAndUnit(input) {
        if (!input) {
            const value = NaN;
            const unit = "parseButtonTimeStrNumberAndUnit: No input";
            return { value, unit };
        }
        const step1 = input.replace(/⁨/g, "").replace(/⁩/g, "");
        const digitRegex = /^[\d.,']+/;
        const match = step1.match(digitRegex);
        if (match) {
            const value = parseFloat(match[0]);
            const unit = step1.substring(match[0].length);
            return { value, unit };
        }
        else {
            printError(`Error in parseButtonTimeStrNumberAndUnit: input: "${step1}" match: "${match}"`);
            const value = NaN;
            const unit = "parseButtonTimeStrNumberAndUnit: No match";
            return { value, unit };
        }
    }
    static testParseButtonTimeStrNumberAndUnit() {
        assertEquals(this.parseButtonTimeStrNumberAndUnit("⁨10⁩m"), { value: 10, unit: "m" });
        assertEquals(this.parseButtonTimeStrNumberAndUnit("⁨11.9⁩mo"), { value: 11.9, unit: "mo" });
    }
    static runTests() {
        this.testParseButtonTimeStrNumberAndUnit();
    }
    static tryToConvertButtonTimeStrToDays(input) {
        try {
            const { value, unit } = this.parseButtonTimeStrNumberAndUnit(input);
            if (unit === 'mo') {
                return Math.round(value * 30 / 10) * 10;
            }
            else if (unit === 'yr') {
                return Math.round(value * 365 / 10) * 10;
            }
            else if (unit === 'd') {
                return value;
            }
            else {
                return input;
            }
        }
        catch (err) {
            return input;
        }
    }
    static async daysSinceCardModified() {
        const unixTimestamp = await JsApi.cardMod();
        // 10 digits, in the number of seconds since the Unix Epoch (January 1 1970 00:00:00 GMT).
        const cardModDate = new Date(unixTimestamp * 1000 // convert to milliseconds
        );
        const todayDate = new Date();
        const getTimeDifference = todayDate.getTime() - cardModDate.getTime();
        const differenceInDays = getTimeDifference / (1000 * 3600 * 24);
        return Math.round(differenceInDays);
    }
    static daysSinceCreationOfCollection() {
        const diffTime = Math.abs(new Date().getTime() - this.dateOfCreationOfCollection.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    /**
     * @return the number of days since the card was due.
     * */
    static async daysSinceCardWasDue() {
        const daysSinceCreationOfCollection = this.daysSinceCreationOfCollection();
        {
            const due = await JsApi.cardDue();
            if (0 <= due && due < 10 * 365)
                return daysSinceCreationOfCollection - due;
        }
        // Strange number of days.  Thus, we assume that it is a new card,
        // for which the API function above returns a random integer.
        // Let's try something else:
        {
            const oDue = await JsApi.cardOriginalDue(); /*original due: In filtered decks, it's the original due date that the
             card had before moving to filtered. https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#original-due*/
            if (0 < oDue && oDue < 10 * 365)
                return daysSinceCreationOfCollection - oDue;
        }
        return Math.round(await this.daysSinceCardModified());
    }
    /**
     * @return the time since the card was last shown to the user
     * or "" if the card is due today or not due yet.
     *
     * I have lots of overdue cards and I find it very useful to display the number of
     * days since the card was last seen. */
    static async timeSinceLastSeenAsString() {
        const daysSince = await this.daysSinceLastSeen();
        if (daysSince === 0) {
            return "0";
        }
        return Math.round(daysSince) + "d";
    }
    /**
     * @return the time since the card was last shown to the user
     * */
    static async daysSinceLastSeen() {
        if (testingMode)
            return 15;
        const daysSinceCardWasDue = await this.daysSinceCardWasDue();
        if (daysSinceCardWasDue === 0) {
            return 0;
        }
        if (await JsApi.cardStatus() === 2)
            return daysSinceCardWasDue + await JsApi.intervalOfCard();
        return daysSinceCardWasDue;
    }
    /* Proxy methods for the JsApi: */
    static async addTagToCard() {
        return JsApi.addTagToCard();
    }
    static async buryCard() {
        return JsApi.buryCard();
    }
    static answerEase(easeButtonNumber) {
        JsApi.answerEase(easeButtonNumber);
    }
    static async nextTimeStringForButtonRaw(i) {
        return JsApi.nextTimeStringForButtonRaw(i);
    }
    static async cardStatus() {
        return JsApi.cardStatus();
    }
    static async cardDue() {
        return JsApi.cardDue();
    }
    static async cardDueRaw() {
        return JsApi.cardDueRaw();
    }
    static async cardOriginalDue() {
        return JsApi.cardOriginalDue();
    }
    static async intervalOfCard() {
        return JsApi.intervalOfCard();
    }
    static async ease() {
        return JsApi.ease();
    }
    static showAnswer() {
        JsApi.showAnswer();
    }
    static async setCardDue(days) {
        return JsApi.setCardDue(days);
    }
    static async cardId() {
        return JsApi.cardId();
    }
    static async cardMod() {
        return JsApi.cardMod();
    }
    static async toggleFlag() {
        return JsApi.toggleFlag();
    }
    static async toggleMarkCard() {
        return JsApi.toggleMarkCard();
    }
    static async eta() {
        return JsApi.eta();
    }
    static async searchCard(query) {
        return JsApi.searchCard(query);
    }
    static TTS = class {
        static async setLanguage(language) {
            return JsApi.TTS.setLanguage(language);
        }
        static async speak(text, queueMode = 0) {
            return JsApi.TTS.speak(text, queueMode);
        }
        static async setSpeed(speed) {
            return JsApi.TTS.setSpeed(speed);
        }
        static async stop() {
            return JsApi.TTS.stop();
        }
        static async isSpeaking() {
            return JsApi.TTS.isSpeaking();
        }
        static async english() {
            return JsApi.TTS.english();
        }
        static async german() {
            return JsApi.TTS.german();
        }
        static async flushQueue() {
            return JsApi.TTS.flushQueue();
        }
    };
}
//# sourceMappingURL=AnkiUtils.js.map