/* Well, to be precise this is utility code for AnkiDroid.
 * I made a pretty elaborated TTS functionality.
 * Especially a wrapper around the AnkDroid API providing additional functionality.
 * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API
 *
 * Copyright 2024 by Helge Kosuch
 */
import printDebug = HtmlUtils.ErrorHandling.printDebug
import assertTypeEquals = HelgeUtils.Misc.assertTypeEquals
import parseIntWithNull = HelgeUtils.Conversions.parseIntWithNull
import stackTrace = HelgeUtils.Exceptions.stackTrace
import removeEmojis = HelgeUtils.Strings.removeEmojis

const localStorageWrapper: BsProvider = new HtmlUtils.BrowserStorage.LocalStorage()

/** Used to stop TTS if too much time has passed. */
class LastTTS {
  private getDiffSeconds() {
    const lastTTSDate = localStorageWrapper.getDate("lastTTSDate")
    if (!lastTTSDate)
      return 99999999
    return ((new Date()).getTime() - lastTTSDate.getTime())/1000
  }
  public save() {
    localStorageWrapper.setDate("lastTTSDate",new Date())
  }
  public toLongAgo() {
    return this.getDiffSeconds() > 120
  }
}
const lastTTS = new LastTTS()

/** I store config values which are needed on front and back in the CSS, because
 * the CSS is accessible from front and back.
 *
 * Example:
 CSS:
 :root {
 --skipUndueCards: false
 }
 TS: CssVars.asBoolean("--someVar") !== true
 */
namespace CssVars {
  import toBoolean = HelgeUtils.Types.SafeConversions.toBoolean
  import TypeException = HelgeUtils.Types.TypeException
  import memoize = HelgeUtils.memoize
  const asStringRaw = (varName: string):string => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName)
  }
  /** Read this as: A CSS variable defined as a string in quotes. */
  const asStringInQuotesRaw = (varName: string):string => {
    return eval(asString(varName))
  }
  const asBooleanRaw = (varName: string): boolean => {
    const resultAsString = asString(varName)
    try {
      return toBoolean(resultAsString)
    } catch (e) {
      throw new TypeException(`CSS var ${varName
      } does not contain a boolean: "${resultAsString
      }"`)
    }
  }
  const asNumberRaw = (varName: string): number | null => {
    const resultAsString = asString(varName)
    if (!resultAsString) {
      return null
    }
    const result = parseFloat(resultAsString)
    if (isNaN(result)) {
      throw new Error(`CSS var ${varName
      } does not contain a number: "${resultAsString
      }"`)
    }
    return result
  }
  export const asString = memoize(asStringRaw)
  export const asStringInQuotes = memoize(asStringInQuotesRaw)
  export const asBoolean = memoize(asBooleanRaw)
  export const asNumber = memoize(asNumberRaw)

}
/** This persists values, BUT they are deleted when the card changes. */
class ForCardPersistence {
  constructor(private readonly bsProvider: BsProvider) {
    if (this.bsProvider.isAvailable()) {
      this.clearOldItems().then()
    } else {
      console.log("Persistence is not available.")
      printError("Persistence is not available.")
    }
  }
  /** The prefix we use for all our items.*/
  private readonly prefix = "ForCurrentCard."
  /** Will be set to true if the persistent things belong to the current card */
  private correctCardCheckDone = false
  public async getAllKeys() {
    await this.clearOldItems()
    return this.bsProvider.getAllKeys()
  }
  public async getString(key: string) {
    await this.clearOldItems()
    return this.getRaw(key)
  }
  /** Usually use get instead! */
  private getRaw(key: string): string | null {
    return this.bsProvider.getString(this.prefix + key)

  }
  public async setString(key: string, value: string) {
    await this.clearOldItems()
    this.setRaw(key, value)
  }
  /** Usually use set instead! */
  private setRaw = (key: string, value: string) => {
    this.bsProvider.setString(this.prefix + key, value)

  }
  /** Clear all our items if the stored items do not belong to the current Anki card. */
  public async clearOldItems() {
    if (this.correctCardCheckDone)
      return

    if (parseIntWithNull(this.getRaw('cardId')) !== await Anki.cardId()) {
      this.clear()
      this.correctCardCheckDone = true
      this.setRaw('cardId', (await Anki.cardId()).toString())
    }
  }
  /**
   * Deletes all items which are ours. */
  public clear() {
    this.bsProvider.clear(this.prefix)

  }
  public async setPressedButton(button: ClickableName) {
    await this.setString("pressedButton",button)

  }
  public async getPressedButton() {
    return await this.getString("pressedButton") as ClickableName

  }
  async getNumber(name: string) {
    return parseFloatWithNull(await this.getString(name))

  }
  async setNumber(name: string, value: number) {
    await this.setString(name, value.toString())

  }
}
/** This is called right before the real speaking starts b/c some headphones do not
 * output the very first sound. */
const soundToStartAudio = () => {
  HtmlUtils.Media.beep.start(50, 500, .1)
}
/** See {@link LoopSpeaker}*/
namespace TTS {
  import removeBySelector = HtmlUtils.Misc.removeBySelector
  import Switch = HelgeUtils.Types.Switch
  import NOT = HelgeUtils.NOT
  namespace Config {
    /** If you have a CSS config that would override these. */
    export const speaking_pause_after_each_sentence = 2
    export const sleepMode_pause_after_each_sentence = 3
    export const ttsEndMarkerGerman = "Ende der Notiz"
    export const ttsEndMarkerEnglish = "The End of the note"
  }
  export const ehSound = async () => {
    await Anki.TTS.setSpeed(2)
    await Anki.TTS.setDefaultLanguage()
    await Anki.TTS.speak('ä')
  }
  export const runTests = () => {
    LoopSpeaker.runTests()
  }
  export type ImproveSpeakReplaceFunction = (input: string, english: boolean) => string
  export const defaultImproveSpeakReplace: ImproveSpeakReplaceFunction =
      /* I have lots of replacements for German. If you want them, tell me. */
      (input: string, english: boolean) => {
        suppressUnusedWarning(english)
        return input
            .replaceAll("[...]", " Please turn over ")
            .replaceAll(/\n ?\* /g, "- ")
            .replaceAll(/\? -/g, "?")
      }
  const debug = false
  const log = (str: string) => {
    if (debug)
      printDebugPrj(str)
  }
  /**
   * Usage:
   * - new LoopSpeaker().speakSelectors(".cloze")
   * - new LoopSpeaker().speak("whatever")
   * - and see public methods.
   * Old name: LoopSpeaker. */
  export class LoopSpeaker {
    private recursion: SpeakRecursion | undefined
    public constructor(private english: boolean = true, private repeatSentenceMode: Switch) {
      this.ttsEndMarker = english
          ? Config.ttsEndMarkerEnglish
          : Config.ttsEndMarkerGerman
    }
    public speak = async (textToSpeak: string,
        improveSpeakReplace: TTS.ImproveSpeakReplaceFunction
            = TTS.defaultImproveSpeakReplace) => {
      await this.speakLooped(
          this.improveSpeak(textToSpeak, improveSpeakReplace, this.english))
    }
    /***
     * Should be named "modifyBeforeSpeak", but I am used to this. */
    private improveSpeak = (str: string,
        improveSpeakReplace: (input: string, english: boolean) => string,
        english: boolean = true): string => {
      const asDom = new DOMParser().parseFromString(
          LoopSpeaker.convertNewLinesToSpeakingPauses(str), "text/html")
      removeBySelector(asDom,'a')
      removeBySelector(asDom,'[style*="display: none"]')
      removeBySelector(asDom,'span.redacted')

      return improveSpeakReplace(
          asDom.body
              .textContent // Don't overlook this! This converts html to plain text.
          ?? ""
          , english
      )
    }
    /** HtmlElement.textContent removes all <br>s, at least sometimes, but I want speaking pauses
     instead, so I replace them with periods. */
    public static convertNewLinesToSpeakingPauses = (input: string) => {{
      return input.replaceAll("<br>", "\n")
    }}
    public async nextSentence() {
      if (!this.recursion)
        return

      await JsApi.TTS.flushQueue()
      await this.recursion.nextSentence()
      await this.recursion.nextSentence()
    }
    public async prevSentence() {
      if (!this.recursion)
        return

      await JsApi.TTS.flushQueue()
      await this.recursion.prevSentence()
    }
    public async firstSentence() {
      if (!this.recursion)
        return

      await JsApi.TTS.flushQueue()
      await this.recursion.firstSentence()
      // await this.recursion.speakNext()
    }
    public async restartSentence() {
      if (!this.recursion)
        return

      await JsApi.TTS.flushQueue()
      soundToStartAudio()
      await this.recursion.prevSentence()
      await this.recursion.speakNextElement()
    }
    public async stopSpeaking() {
      if (this.recursion)
        await this.recursion.stop()
    }
    private static removeSplitCharsAtEnd(input: string)  {
      return input.replace(/[.?!]+\s*$/, "")

    }
    private static testRemoveSplitCharsAtEnd() {
      const input = "Hello. World! "
      const expectedOutput = "Hello. World"
      const output = LoopSpeaker.removeSplitCharsAtEnd(input)

      assertEquals(output,expectedOutput, `Expected ${expectedOutput} but got ${output}`)
    }
    private readonly ttsEndMarker: string
    /** This is used to re-join dates formatted like "12.11.2024" */
    private static joinDateParts(arr: string[]) {
      const result: string[] = []
      let temp: string[] = []

      arr.forEach((item) => {
        if (item.match(/^\d+$/)) {
          temp.push(item)
        } else {
          if (temp.length) {
            result.push(temp.join('.'))
            temp = []
          }
          result.push(item)
        }
      })

      if (temp.length) {
        result.push(temp.join('.'))
      }

      return result
    }
    private static testJoinDateParts = () => {
      const input = ["7", "8", "17", "hello", "789", "101", "world"]
      const expectedOutput = ["7.8.17", "hello", "789.101", "world"]
      const output = LoopSpeaker.joinDateParts(input)

      console.assert(JSON.stringify(output) === JSON.stringify(expectedOutput), `Expected ${JSON.stringify(expectedOutput)} but got ${JSON.stringify(output)}`)
    }
    public async speakLooped(input: string) {

      if (this.recursion) {
        await this.recursion.stop()
      }

      await JsApi.TTS.flushQueue()

      const step1 = input.replaceAll(".e ",internalEnglishMarker) // NOT .en
      const step2 = LoopSpeaker.removeSplitCharsAtEnd(step1)
      const step3 = step2 + (isBack ? ": " + this.ttsEndMarker : "")
      const sentencesArray = step3.split(ttsSentenceSplitChars)

      /* Add a pause after the last sentence on the front side. */
      if (isFront) {
        for (let i = 1 /* Intentionally starts at 1 b/c there is a single pause anyway. We only want to
                        add the extra sentence pauses. */
            ; i <  ttsUi.endOfFrontPauseMultiplicator.get(); i++) {
          sentencesArray.push("...") // "..." is tested. Just a space does not work.
        }
      }
      this.recursion = new SpeakRecursion(LoopSpeaker.joinDateParts(sentencesArray),
          await SentenceIndex.getFromLocalStorage(), this.repeatSentenceMode, this.english)
      this.setRepeatTimeout()

      // Speaks the first element without pausing before:
      soundToStartAudio()
      await this.recursion.speakNextElement()

      // Continues speaking the following elements with pauses before:
      this.recursion.speakArray()
    }
    private setRepeatTimeout = () => {
      // Stop after defined time (currently 20 minutes):
      setTimeout(async () => {
        this.recursion?.stopAfterSentence()
        await JsApi.TTS.english()
        // await JsApi.TTS.speak("Timeout")
      }, ttsMinutesUntilStopRepeat * 60 * 1000)
    }
    static runTests() {
      LoopSpeaker.testJoinDateParts()
      LoopSpeaker.testRemoveSplitCharsAtEnd()
    }
  }
  /** speakingPause: Pause between readings of the text in seconds */
  export namespace SpeakingPauseAfterEachSentenceInSeconds {
    export const normalModeValue: number =
        CssVars.asNumber("--ttsNormalMode_pause_after_sentences_in_seconds")
        ?? Config.speaking_pause_after_each_sentence
    export const sleepModeValue: number =
        CssVars.asNumber("--ttsSleepMode_pause_after_sentences_in_seconds")
        ?? Config.sleepMode_pause_after_each_sentence
    export const getFromStorage = () => {{
      return localStorageWrapper.getNumber("SpeakingPauseAfterEachSentenceInSeconds.current")
          ?? normalModeValue
    }}
    export const writeToStorage = () => {{
      localStorageWrapper.setNumber("SpeakingPauseAfterEachSentenceInSeconds.current",current)
    }}
    export let current = getFromStorage()
    export const set = (newValue: number) => {
      current = newValue
      writeToStorage()
    }
    export function setSleepMode() {
      set(sleepModeValue)
    }
    export function setNormalMode() {
      set(normalModeValue)
    }
  }

  class SpeakRecursion {
    private intervalId: number | undefined
    private timeoutId: number | undefined
    private stopSpeakingFlag = false
    private readonly sentencesArray: string[]
    constructor(input: string[], startSentenceIndex: number,
        private repeatSentenceMode: Switch, private english: boolean) {
      const notBlank = (str: string): boolean => str.trim().length > 0
      const removeEmptyStrings = (arr: string[]): string[] => arr.filter(notBlank)
      this.sentencesArray = removeEmptyStrings(input)
      this.sentenceIndex = new SentenceIndex(startSentenceIndex, this.sentencesArray.length)
    }
    async stop() {
      this.stopAfterSentence()
      await JsApi.TTS.stop()
    }
    stopAfterSentence = () => {
      clearInterval(this.intervalId)
      this.intervalId = undefined

      clearTimeout(this.timeoutId)
      this.timeoutId = undefined

      this.stopSpeakingFlag = true
    }
    speakArray() {
      if (this.stopSpeakingFlag || this.intervalId)
        return
      this.intervalId = setInterval(() => this.everySecond(), 1000)
    }
    async everySecond() {
      log("TTS1 everySecond")
      if (this.stopSpeakingFlag) {
        log("TTS1 stopSpeakingFlag is true, returning")
        return
      }

      if ( ! await JsApi.TTS.isSpeaking()) {
        clearInterval(this.intervalId)
        this.intervalId = undefined
        if (this.sentenceIndex.isLastOrSecondLastSentence()) {
          HtmlUtils.Media.beep.start(1000, interactionBeepDuration, .1)
        }
        this.pauseAndSpeak()
      } else {
        log("TTS1 is still speaking")
        lastTTS.save()
      }
    }
    pauseAndSpeak() {
      if (testingMode)
        console.log("--------------------------------- TTS pause for "
            +SpeakingPauseAfterEachSentenceInSeconds.current)
      const pauseMillis = SpeakingPauseAfterEachSentenceInSeconds.current * 1000
      ttsDelaySound.beep(pauseMillis)
      this.timeoutId = setTimeout(
          () => this.afterSpeakingPause(),pauseMillis)
    }
    async afterSpeakingPause() {
      if (this.stopSpeakingFlag)
        return
      if (lastTTS.toLongAgo())
        return
      soundToStartAudio()
      await this.speakNextElement()

      // Recursively speak further sentences:
      this.speakArray()
    }
    async speakNextElement() {
      const speakMultiLanguage = async (input: string) => {
        const parts = input.split(internalEnglishMarker)
        let flag = false
        for (let i = 0; i < parts.length; i++) {
          if (flag) {
            await JsApi.TTS.english()
          } else if (NOT(this.english)) {
            await JsApi.TTS.setDefaultLanguage()
          }
          flag = !flag
          await JsApi.TTS.speak(parts[i].trim(), JsApi.TTS.QUEUE_ADD)
        }
      }
      const sentenceStep1 = this.currentSentence()
      if ( ! this.repeatSentenceMode.enabled() || isFront) {
        await this.sentenceIndex.increment()
      }
      const sentenceStep2 = sentenceStep1
          + (this.repeatSentenceMode.enabled() && isBack && !this.sentenceIndex.isLastSentence()
              ? " "+ CssVars.asStringInQuotes("--ttsTextBetweenSentenceRepetitions") +" "
              : "")
      await speakMultiLanguage(sentenceStep2)
    }
    /** The index of the sentence to speak */
    private sentenceIndex: SentenceIndex
    public async nextSentence() {
      const sentenceToSpeak = this.currentSentence()
      await this.sentenceIndex.increment()
      return sentenceToSpeak
    }
    private currentSentence = () => {
      return this.sentencesArray[this.sentenceIndex.get()]
    }

    public async prevSentence() {
      await this.sentenceIndex.decrement()
      return this.currentSentence()
    }
    public async firstSentence() {
      await this.sentenceIndex.setToZero()
      return this.currentSentence()
    }
    // end recursion:
  }
  class SentenceIndex {
    constructor(
        private sentenceIndex: number,
        private numberOfSentences: number) {
    }
    get(): number {
      if (this.sentenceIndex>=this.numberOfSentences) {
        // This case is possible b/c the user can edit the text.
        return 0
      }
      return this.sentenceIndex
    }
    public static getFromLocalStorage = async () => {
      return await localStorageForCardId.getNumber('sentenceIndex') ?? 0

    }
    private writeToLocalStorage = async () => {
      return await localStorageForCardId.setNumber('sentenceIndex', this.sentenceIndex)

    }
    public increment = async () => {
      await this.writeToLocalStorage() /* Writing it
       before the increment is correct, b/c only the PREVIOUS sentence was now spoken
       completely. */
      this.sentenceIndex++
      if (this.sentenceIndex >= this.numberOfSentences) {
        this.sentenceIndex = 0
      }
    }
    public isLastSentence() {
      return this.sentenceIndex == this.numberOfSentences - 1
    }
    public isLastOrSecondLastSentence() {
      return this.sentenceIndex >= this.numberOfSentences - 2
    }
    public decrement = async () => {
      if (this.sentenceIndex == 0) {
        this.sentenceIndex = this.numberOfSentences - 1
      } else {
        this.sentenceIndex--
      }
      await this.writeToLocalStorage()
    }
    public setToZero = async () => {
      this.sentenceIndex = 0
      await this.writeToLocalStorage()
    }
  }
}

/** This contains only wrapper methods for the real JS-API
 *
 * The main feature of this is that it throws an exception if call the JS API fails.
 * */
class JsApi {
  private static mock = isAnkiDesktop
  private static safeModeJsApi = CssVars.asBoolean('--safeModeJsApi')
  private static api: AnkiDroidJsInterface
  private static async getApi(): Promise<AnkiDroidJsInterface> {
    if (this.api)
      return this.api

    this.api =
        new AnkiDroidJS({version: "0.0.3", developer: "only_for_myself@nowhere"})

    return this.api
  }
  /** This is called after operations which cause the load of the next card or the back
   * in order to speed things up by avoiding unnecessary compute. */
  private static stopTheWorld = () => {
    try {
      window.stop()
    } catch (e) {
      // intentionally empty block
    }
    throw "ignoredException"
  }
  public static async addTagToCard() {
    if (JsApi.mock) return

    await (await JsApi.getApi()).ankiAddTagToCard()
  }
  public static async buryCard() {
    if (JsApi.mock || JsApi.safeModeJsApi)
      return
    await (await JsApi.getApi()).ankiBuryCard()
    try {
      this.stopTheWorld()
    } catch (e) {
      // yes, ignore any exceptions from this
    }
  }
  public static answerEase(easeButtonNumber: number) {
    if (JsApi.mock || JsApi.safeModeJsApi)
      return

    if (isMobile) {
      (window as any)["buttonAnswerEase" + easeButtonNumber]()
      try {
        this.stopTheWorld()
      } catch (e) {
        // yes, ignore any exceptions from this
      }
    } else
    if (debug)
      console.log("Called buttonAnswerEase"+easeButtonNumber)
  }
  private static wrapString = (value: string): JsApiAny => {
    return {success: true, value: value}
  }
  public static nextTimeStringForButtonRaw = async (i: number): Promise<string> => {
    if (JsApi.mock)
      return JSON.stringify(this.wrapString("2mock"))

    return await (await JsApi.getApi())["ankiGetNextTime" + i]()
  }
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
  public static async cardStatus() {
    if (JsApi.mock) {
      return 2
    }
    return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardType"))
  }
  /**
   * new: note id or random int
   * due: integer day, relative to the collection's creation time
   * learning: integer timestamp
   *
   * source: https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#due
   */
  public static async cardDue(): Promise<number> {
    if (JsApi.mock)
      return 0

    return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardDue"))
  }
  public static async cardDueRaw() {
    if (JsApi.mock) return {value: 0}

    return (await (await JsApi.getApi()).ankiGetCardDue())
  }
  /**
   * original due: In filtered decks, it's the original due date that the card had before
   * moving to filtered. (integer day, relative to the collection's creation time)
   *                     -- If the card lapsed in scheduler1, then it's the value before
   * the lapse. (This is used when switching to scheduler
   * 2. At this time, cards in learning becomes due again, with their previous due date)
   *                     -- In any other case it's 0.
   * Source:
   * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#original-due
   */
  public static async cardOriginalDue() {
    if (JsApi.mock) return 0

    return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardODue"))
  }
  public static async intervalOfCard() {
    if (JsApi.mock) return 42
    return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardInterval"))
  }
  /**
   * @return Return ease factor of the card in permille (parts per thousand)
   *
   * Gotchas: Yes, really permille, not percent, in contrast to the UI where it is
   *     percent.
   *
   * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API/9fb80befe5c3551665a0a07886138025bcd9b4f1#card-ease-factor
   */
  public static async ease() {
    if (JsApi.mock) return 2500

    return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardFactor"))
  }
  public static showAnswer() {
    if (JsApi.mock) {
      console.log("showAnswer")
    }
    const DEBUG = false
    if (DEBUG) {
      printDebugPrj("Would show answer, but turned off."+stackTrace(new Error())
      +"Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up. Dummy text to scroll up.")
      return
    } else
      window["showAnswer"]()
    try {
      this.stopTheWorld()
    } catch (e) {
      // yes, ignore any exceptions from this
    }
  }
  /**
   * Reschedule card with x days
   *
   * "This will set the interval of the card to x (cf this issue)"
   *
   * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#reschedule-card-with-x-days
   *
   * "Turn cards into review cards, and make them due on a certain date. This can be
   * useful for moving cards forward or back a few days when your study schedule is
   * interrupted. Entering a range like 60-90 will make the selected cards due between 60
   * and 90 days from now. New cards will have their interval set to the same delay, but
   * reviews will be rescheduled without changing their current interval, unless '!' is
   * included at the end of the range. (Note that answer time is not recorded when
   * manually scheduling cards, since the action can be performed even outside of review,
   * and Anki isn’t aware of which card may or may not be shown at the time.)" Source:
   * https://docs.ankiweb.net/browsing.html#cards
   */
  public static async setCardDue(days: number) {
    if (JsApi.mock || JsApi.safeModeJsApi)
      return

    await (await JsApi.getApi()).ankiSetCardDue(days)
    try {
      this.stopTheWorld()
    } catch (e) {
      // yes, ignore any exceptions from this
    }
  }
  public static async cardId(): Promise<number> {
    if (JsApi.mock)
      return 12345
    return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardId"))
  }
  public static async noteId(): Promise<number> {
    if (JsApi.mock)
      return 12345
    return (await JsApi.CallWithFailNotification.asNumber("ankiGetCardNid"))
  }
  /**
   https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#last-modified-time-of-card
   If a card was never modified, this does NOT give the time when it was added,
   but some other unknown value, which does not seem to be in relation to to the
   added time. Maybe it is like the return value of the "cardDue" API method which returns "note id or random int" for new cards.
   */
  public static async cardMod() {
    if (JsApi.mock) return 0

    return await this.CallWithFailNotification.asNumber("ankiGetCardMod")
  }
  public static async toggleFlag() {
    if (JsApi.mock)
      return
    return (await JsApi.getApi())["ankiToggleFlag"]()
  }
  public static async toggleMarkCard() {
    if (JsApi.mock)
      return
    return (await JsApi.getApi())["ankiMarkCard"]()
  }
  public static async eta() {
    if (JsApi.mock) return 1

    return await this.CallWithFailNotification.asNumber("ankiGetETA")
  }
  public static async searchCard(query: string) {
    if (JsApi.mock) return

    await (await JsApi.getApi())["ankiSearchCard"](query)
  }
  /** @deprecated */
  public static async cardInterval() {
    return  this.intervalOfCard()
  }
  public static async showToast(msg: string) {
    if (testingMode) {
      console.log(msg)
      return
    }
    await (await JsApi.getApi())["ankiShowToast"](msg)
  }
  public static TTS = class {
    public static readonly QUEUE_ADD = 1
    public static readonly QUEUE_FLUSH = 0

    public static async setLanguage(language: string) {
      if (JsApi.mock)
        return

      await (await JsApi.getApi())["ankiTtsSetLanguage"](language)
    }

    /**
     * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#speak
     */
    public static async speak(text: string, queueMode = 0) {
      const emojisRemovedText = removeEmojis(text)
      if (testingMode) {
        console.log("TTS1 speakFirstElement: " + emojisRemovedText)
      }
      if (JsApi.mock) return

      await (await JsApi.getApi())["ankiTtsSpeak"](emojisRemovedText,queueMode)
    }

    /**
     * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#set-tts-speed
     */
    public static async setSpeed(speed: number) {
      if (JsApi.mock)
        return

      await (await JsApi.getApi())["ankiTtsSetSpeechRate"](speed)
    }
    public static async stop() {
      if (JsApi.mock) return

      await (await JsApi.getApi())["ankiTtsStop"]()
    }
    public static async isSpeaking() {
      if (JsApi.mock)
        return false

      return JsApi.CallWithFailNotification.asBoolean("ankiTtsIsSpeaking")
    }
    public static async english() {
      if (JsApi.mock) return

      (await JsApi.getApi())["ankiTtsSetLanguage"]('en-US').then()
    }
    public static async setDefaultLanguage() {
      if (JsApi.mock) return

      (await JsApi.getApi())["ankiTtsSetLanguage"](ttsDefaultLanguage).then()
    }
    public static async flushQueue() {
      await JsApi.TTS.speak("", JsApi.TTS.QUEUE_FLUSH)
      // console.trace()
    }
    // end of TTS class
  }
  private static CallWithFailNotification = class {
    private static valueAsAnyIfSuccess =
        async (methodName: string): Promise<any> =>
        {
          const retVal = await (await JsApi.getApi())[methodName]()

          if (retVal?.success!==true)
            printError("JS API did NOT return success===true")

          return retVal["value"]
        }

    public static asString =
        async (methodName: string): Promise<string> =>
        {
          const retVal: string = await this.valueAsAnyIfSuccess(methodName)
          assertTypeEquals(retVal,"string")
          return retVal
        }

    public static asNumber =
        async (methodName: string): Promise<number> =>
        {
          const retVal: number = await this.valueAsAnyIfSuccess(methodName)
          assertTypeEquals(retVal,"number")
          return retVal
        }

    public static asBoolean =
        async (methodName: string): Promise<boolean> =>
        {
          const retVal: boolean = await this.valueAsAnyIfSuccess(methodName)
          assertTypeEquals(retVal,"boolean")
          return retVal
        }
    public static asVoid =
        async (methodName: string): Promise<void> =>
        {
          await this.valueAsAnyIfSuccess(methodName)
        }
  }
  // end of JsApi class
}
/** My card code talks to Anki through this class. */
class Anki {
  private static readonly numToStr = HelgeUtils.Strings.numToStr
  /** The date when the collection was created.
   * Unconveniently, this is needed to calculate the due date from
   * the value the API returns. */
  private static dateOfCreationOfCollection = new Date(2023, 5, 12)
  /** @param i A number between 1 and 4.
   */
  public static async answerButtonLabel(i: number) {
    const nextTimeString = await this.nextTimeStringForButton(i)

    const nextTimeValueAndUnit = this.parseButtonTimeStrNumberAndUnit(nextTimeString)
    let value = nextTimeValueAndUnit.value

    if (isNaN(value)) {
      // This is an error case fallback.
      return nextTimeString
    }
    const unit = nextTimeValueAndUnit.unit

    { /* Round the value if it is close to an integer */
      const roundedRatio = value/Math.round(value)
      if (Math.abs(roundedRatio-1)<0.15)
        value = Math.round(value)
    }

    if (label_only_min_and_hour_default_buttons) {
      if (unit==="h" || unit==="min")
        return value+" "+unit

      return ""
    }
    const next = this.tryToConvertButtonTimeStrToDays(nextTimeString)
    const ifNumberAppendD = (input: number | string ) => {
      if (typeof input === "number")
        return input + " d"
      return input
    }
    const buttonRatio = await this.buttonRatio(next)
    const daysStr = (days: string) => {
      const buttonRatioIsEmpty = buttonRatio === ""
      if (buttonRatioIsEmpty)
        return days
      return `x<p class="nextTimeOnButtons">(${days})</p>`
    }
    return buttonRatio + daysStr(ifNumberAppendD(next))
  }
  public static async nextTimeStringForButton(i: number):Promise<string> {
    const returnValueFromApi: string = await JsApi.nextTimeStringForButtonRaw(i)

    let corrected: JsApiString

    const retType = typeof returnValueFromApi

    if (retType==="string") {
      corrected = JSON.parse(returnValueFromApi)
    } else if (retType==="object") {
      corrected = returnValueFromApi["value"]
    } else {
      throw new Error("nextTimeStringForButton: unexpected return type")
    }
    if (!corrected.success)
      printDebug("JS API returned success===false")

    if (autoSkipMode.enabled() && corrected.value==="") {
      autoSkipMode.disable()
      printDebugPrj("nextTimeStringForButton(...) is empty. Probably the setting Appearance>Show button time is" +
          " disabled. Please enable it.")
    }

    return corrected.value
  }
  public static async nextTimeValueAndUnitForButton(i: number) {
    return this.parseButtonTimeStrNumberAndUnit(await this.nextTimeStringForButton(i))
  }
  static async buttonRatio(daysOfButton: number | string ) {
    const daysSinceLastSeen = await this.daysSinceLastSeen()
    if (typeof daysOfButton === "string" || daysSinceLastSeen=== 0)
      return ""
    try {
      const ratio = daysOfButton / daysSinceLastSeen
      let roundedAsString: string
      if (ratio>=1.7)
        roundedAsString = ratio.toFixed(0)
      else if (.7 < ratio && ratio<1.3)
        roundedAsString = "1"
      else if (.4 < ratio && ratio<=.7)
        roundedAsString = "½"
      else if (.2 < ratio && ratio<=.4)
        roundedAsString = "⅓"
      else if (ratio && ratio<=.2)
        roundedAsString = "⅟ₓ"
      else
        roundedAsString = ratio.toFixed(1)
      return this.numToStr(roundedAsString)
    } catch (err) {
      return "" // Intentially swallowed.
    }
  }
  public static parseButtonTimeStrNumberAndUnit(input: string) {
    if (!input) {
      const value = NaN
      const unit = "parseButtonTimeStrNumberAndUnit: No input"
      return {value, unit}
    }
    const step1 = input.replace(/⁨/g, "").replace(/⁩/g, "")
    const digitRegex = /^[\d.,']+/
    const match = step1.match(digitRegex)

    if (match) {
      const value = parseFloat(match[0])
      const unit = step1.substring(match[0].length).trim()
      return {value, unit}
    } else {
      // printError(`Error in parseButtonTimeStrNumberAndUnit: input: "${step1}" match: "${match}"`)
      const value = NaN
      const unit = "parseButtonTimeStrNumberAndUnit: No match"
      return {value, unit}
    }

  }
  private static testParseButtonTimeStrNumberAndUnit() {
    assertEquals(
        this.parseButtonTimeStrNumberAndUnit("⁨10⁩m"),
        {value: 10, unit: "m"})
    assertEquals(
        this.parseButtonTimeStrNumberAndUnit("⁨11.9⁩mo"),
        {value: 11.9, unit: "mo"})
  }
  public static runTests() {
    this.testParseButtonTimeStrNumberAndUnit()
  }
  public static tryToConvertButtonTimeStrToDays(input: string) {
    try {
      const {value, unit} = this.parseButtonTimeStrNumberAndUnit(input)

      if (unit === 'mo') {
        return Math.round(value * 30/10)*10
      } else if (unit === 'yr') {
        return Math.round(value * 365/10)*10
      } else if (unit === 'd') {
        return value
      } else {
        return input
      }
    } catch (err) {
      return input
    }
  }
  public static async daysSinceCardModified() {
    const unixTimestamp = await JsApi.cardMod()
    // 10 digits, in the number of seconds since the Unix Epoch (January 1 1970 00:00:00 GMT).
    const cardModDate = new Date(
        unixTimestamp * 1000 // convert to milliseconds
    )
    const todayDate = new Date()
    const getTimeDifference = todayDate.getTime() - cardModDate.getTime()
    const differenceInDays = getTimeDifference / (1000 * 3600 * 24)
    return Math.round(differenceInDays)
  }
  public static daysSinceCreationOfCollection() {
    const diffTime = Math.abs(new Date().getTime() - this.dateOfCreationOfCollection.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  /** @return the number of days since the card was due.
   * */
  public static async daysSinceCardWasDue() {

    const daysSinceCreationOfCollection = this.daysSinceCreationOfCollection()

    { const due = await JsApi.cardDue()
      if (0 <= due && due < 10 * 365)
        return daysSinceCreationOfCollection - due
    }
    // Strange number of days.  Thus, we assume that it is a new card,
    // for which the API function above returns a random integer.
    // Let's try something else:
    { const oDue = await JsApi.cardOriginalDue(); /*original due: In filtered decks, it's the original due date that the
     card had before moving to filtered. https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#original-due*/
      if (0 < oDue && oDue < 10 * 365)
        return daysSinceCreationOfCollection - oDue
    }
    return Math.round(await this.daysSinceCardModified())
  }
  /** @return the time since the card was last shown to the user
   * or "" if the card is due today or not due yet.
   *
   * I have lots of overdue cards and I find it very useful to display the number of
   * days since the card was last seen. */
  public static async timeSinceLastSeenAsString() {
    const daysSince = await this.daysSinceLastSeen()
    if (daysSince === 0) {
      return "0"
    }
    return Math.round(daysSince) + "d"
  }
  /** @return the time since the card was last shown to the user
   * */
  public static async daysSinceLastSeen() {
    if (testingMode)
      return 15

    const daysSinceCardWasDue = await this.daysSinceCardWasDue()

    if (daysSinceCardWasDue === 0) {
      return 0
    }

    if (await JsApi.cardStatus()===2)
      return daysSinceCardWasDue + await JsApi.intervalOfCard()

    return daysSinceCardWasDue
  }
  /* Proxy methods for the JsApi: */
  public static async addTag(): Promise<void> {
    return JsApi.addTagToCard()

  }
  public static async buryCard(): Promise<void> {
    return JsApi.buryCard()

  }
  public static answerEase(easeButtonNumber: number): void {
    JsApi.answerEase(easeButtonNumber)
  }
  public static async nextTimeStringForButtonRaw(i: number): Promise<string> {
    return JsApi.nextTimeStringForButtonRaw(i)

  }
  public static async statusOfCard(): Promise<number> {
    return JsApi.cardStatus()
  }
  public static async dueDate(): Promise<number> {
    return JsApi.cardDue()
  }
  public static async dueDateRaw(): Promise<any> {
    return JsApi.cardDueRaw()
  }
  public static async originalDueDate(): Promise<number> {
    return JsApi.cardOriginalDue()
  }
  public static async intervalOfCard(): Promise<number> {
    return JsApi.intervalOfCard()
  }
  public static async easeOfCard(): Promise<number> {
    return JsApi.ease()
  }
  public static showAnswer(): void {
    JsApi.showAnswer()
  }
  public static async setDueDate(days: number): Promise<void> {
    return JsApi.setCardDue(days)
  }
  public static async cardId(): Promise<number> {
    return JsApi.cardId()
  }
  public static async noteId(): Promise<number> {
    return JsApi.noteId()
  }
  public static async modificationDate(): Promise<number> {
    return JsApi.cardMod()
  }
  public static async showToast(msg: string): Promise<void> {
    await JsApi.showToast(msg)
  }
  public static async toggleFlag(): Promise<void> {
    return JsApi.toggleFlag()
  }
  public static async toggleMarkCard(): Promise<void> {
    return JsApi.toggleMarkCard()
  }
  public static async eta(): Promise<number> {
    return JsApi.eta()
  }
  public static async searchCard(query: string): Promise<void> {
    return JsApi.searchCard(query)
  }
  public static TTS = class {
    public static async setLanguage(language: string): Promise<void> {
      return JsApi.TTS.setLanguage(language)

    }
    public static async speak(text: string, queueMode = 0): Promise<void> {
      return JsApi.TTS.speak(text, queueMode)

    }
    public static async setSpeed(speed: number): Promise<void> {
      return JsApi.TTS.setSpeed(speed)

    }
    public static async stop(): Promise<void> {
      return JsApi.TTS.stop()

    }
    public static async isSpeaking(): Promise<boolean> {
      return JsApi.TTS.isSpeaking()

    }
    public static async english(): Promise<void> {
      return JsApi.TTS.english()

    }
    public static async setDefaultLanguage(): Promise<void> {
      return JsApi.TTS.setDefaultLanguage()

    }
    public static async flushQueue(): Promise<void> {
      return JsApi.TTS.flushQueue()

    }
    public static speakEnglish = async (text: string | null) => {
      if (! text) {
        return
      }
      await JsApi.TTS.english()
      await JsApi.TTS.speak(text)
    }
    public static speakDefaultLanguage = async (text: string | null) => {
      if (! text) {
        return
      }
      await JsApi.TTS.setDefaultLanguage()
      await JsApi.TTS.speak(text)
    }
  }
}
