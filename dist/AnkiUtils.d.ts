import printDebug = HtmlUtils.ErrorHandling.printDebug;
import assertTypeEquals = HelgeUtils.Misc.assertTypeEquals;
/** This contains only wrapper methods for the real JS-API
 *
 * The main feature of this is that it throws an exception if call the JS API fails.
 * */
declare class JsApi {
    private static mock;
    private static disableDangerousActions;
    private static api;
    private static getApi;
    static addTagToCard(): Promise<void>;
    static buryCard(): Promise<void>;
    static answerEase(easeButtonNumber: number): void;
    private static wrapString;
    static nextTimeStringForButtonRaw: (i: number) => Promise<string>;
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
    static cardStatus(): Promise<number>;
    /**
     * new: note id or random int
     * due: integer day, relative to the collection's creation time
     * learning: integer timestamp
     *
     * source: https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#due
     */
    static cardDue(): Promise<number>;
    static cardDueRaw(): Promise<JsApiNumber | {
        value: number;
    }>;
    /**
     * original due: In filtered decks, it's the original due date that the card had before moving to filtered. (integer
     * day, relative to the collection's creation time)
     *                     -- If the card lapsed in scheduler1, then it's the value before the lapse. (This is used when
     * switching to scheduler
     * 2. At this time, cards in learning becomes due again, with their previous due date)
     *                     -- In any other case it's 0.
     * Source: https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#original-due
     */
    static cardOriginalDue(): Promise<number>;
    static intervalOfCard(): Promise<number>;
    /**
     * @return Return ease factor of the card in permille (parts per thousand)
     *
     * Gotchas: Yes, really permille, not percent, in contrast to the UI where it is percent.
     *
     * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API/9fb80befe5c3551665a0a07886138025bcd9b4f1#card-ease-factor
     */
    static ease(): Promise<number>;
    static showAnswer(): void;
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
    static setCardDue(days: number): Promise<void>;
    static cardId(): Promise<number>;
    /**
     https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#last-modified-time-of-card
     If a card was never modified, this does NOT give the time when it was added,
     but some other unknown value, which does not seem to be in relation to to the
     added time. Maybe it is like the return value of the "cardDue" API method which returns "note id or random int" for new cards.
     */
    static cardMod(): Promise<number>;
    static toggleFlag(): Promise<any>;
    static toggleMarkCard(): Promise<any>;
    static eta(): Promise<number>;
    static searchCard(query: string): Promise<void>;
    /** @deprecated */
    static cardInterval(): Promise<number>;
    static showToast(): Promise<void>;
    static TTS: {
        new (): {};
        readonly QUEUE_ADD: 1;
        readonly QUEUE_FLUSH: 0;
        setLanguage(language: string): Promise<void>;
        /**
         * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#speak
         */
        speak(text: string, queueMode?: number): Promise<void>;
        /**
         * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#set-tts-speed
         */
        setSpeed(speed: number): Promise<void>;
        stop(): Promise<void>;
        isSpeaking(): Promise<boolean>;
        english(): Promise<void>;
        german(): Promise<void>;
        flushQueue(): Promise<void>;
    };
    private static CallWithFailNotification;
}
declare class Anki {
    private static readonly numToStr;
    /** The date when the collection was created.
     * Unconveniently, this is needed to calculate the due date from
     * the value the API returns. */
    private static dateOfCreationOfCollection;
    /**
     * @param i A number between 1 and 4.
     */
    static answerButtonLabel(i: number): Promise<string>;
    static nextTimeStringForButton(i: number): Promise<string>;
    static nextTimeValueAndUnitForButton(i: number): Promise<{
        value: number;
        unit: string;
    }>;
    static buttonRatio(daysOfButton: number | string): Promise<string>;
    static parseButtonTimeStrNumberAndUnit(input: string): {
        value: number;
        unit: string;
    };
    private static testParseButtonTimeStrNumberAndUnit;
    static runTests(): void;
    static tryToConvertButtonTimeStrToDays(input: string): string | number;
    static daysSinceCardModified(): Promise<number>;
    static daysSinceCreationOfCollection(): number;
    /**
     * @return the number of days since the card was due.
     * */
    static daysSinceCardWasDue(): Promise<number>;
    /**
     * @return the time since the card was last shown to the user
     * or "" if the card is due today or not due yet.
     *
     * I have lots of overdue cards and I find it very useful to display the number of
     * days since the card was last seen. */
    static timeSinceLastSeenAsString(): Promise<string>;
    /**
     * @return the time since the card was last shown to the user
     * */
    static daysSinceLastSeen(): Promise<number>;
    static addTagToCard(): Promise<void>;
    static buryCard(): Promise<void>;
    static answerEase(easeButtonNumber: number): void;
    static nextTimeStringForButtonRaw(i: number): Promise<string>;
    static cardStatus(): Promise<number>;
    static cardDue(): Promise<number>;
    static cardDueRaw(): Promise<any>;
    static cardOriginalDue(): Promise<number>;
    static intervalOfCard(): Promise<number>;
    static ease(): Promise<number>;
    static showAnswer(): void;
    static setCardDue(days: number): Promise<void>;
    static cardId(): Promise<number>;
    static cardMod(): Promise<number>;
    static toggleFlag(): Promise<void>;
    static toggleMarkCard(): Promise<void>;
    static eta(): Promise<number>;
    static searchCard(query: string): Promise<void>;
    static TTS: {
        new (): {};
        setLanguage(language: string): Promise<void>;
        speak(text: string, queueMode?: number): Promise<void>;
        setSpeed(speed: number): Promise<void>;
        stop(): Promise<void>;
        isSpeaking(): Promise<boolean>;
        english(): Promise<void>;
        german(): Promise<void>;
        flushQueue(): Promise<void>;
    };
}
