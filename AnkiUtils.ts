/* Well, to be precise this is utility code for AnkiDroid
*
* Copyright 2024 by Helge Kosuch
* */

/* Wrapper around the AnkDroid API.
 * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API */
import printDebug = HtmlUtils.ErrorHandling.printDebug;
import assertTypeEquals = HelgeUtils.Misc.assertTypeEquals;

class Anki {

  private static mock = isAnkiDesktop
  private static disableDangerousActions = false

  private static api: AnkiDroidJsInterface

  private static async getApi(): Promise<AnkiDroidJsInterface> {
    if (this.api)
      return this.api

    this.api =
        new AnkiDroidJS({version: "0.0.3", developer: "only_for_myself@nowhere"})

    return this.api
  }

  private static readonly numToStr = HelgeUtils.Strings.numToStr
  /** The date when the collection was created.
   * Unconveniently, this is needed to calculate the due date from
   * the value the API returns. */
  private static dateOfCreationOfCollection = new Date(2023, 5, 12)

  public static async addTagToCard() {
    if (Anki.mock) return

    await (await Anki.getApi()).ankiAddTagToCard()
  }

  public static async buryCard() {
    if (Anki.mock || Anki.disableDangerousActions)
      return

    await (await Anki.getApi()).ankiBuryCard()
  }

  public static answerEase(easeButtonNumber: number) {
    if (Anki.mock || Anki.disableDangerousActions)
      return

    if (isMobile)
      (window as any)["buttonAnswerEase" + easeButtonNumber]()
    else
    if (debug)
      console.log("Called buttonAnswerEase"+easeButtonNumber)
  }

  /**
   * @param i A number between 1 and 4.
   */
  public static async answerButtonLabel(i: number) {
    if (Anki.mock) return "2 mock"

    const nextTimeString = await this.nextTimeStringForButton(i)

    const nextTimeValueAndUnit = this.parseButtonTimeStrNumberAndUnit(nextTimeString)
    let value = nextTimeValueAndUnit.value
    const unit = nextTimeValueAndUnit.unit

    { /* Round the value if it is close to an integer */
      const roundedRatio = value/Math.round(value);
      if (Math.abs(roundedRatio-1)<0.15)
        value = Math.round(value)
    }

    if (label_only_min_and_hour_default_buttons) {
      if (unit==="h" || unit==="m")
        return value+unit

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
      return `x<p class="nextTimeOnButtons">(${days})</p>`;
    };
    return buttonRatio + daysStr(ifNumberAppendD(next))
  }

  public static async nextTimeStringForButton(i: number):Promise<string> {
    if (Anki.mock)
      return "1mocked"

    const returnValueFromApi: string = await Anki.nextTimeStringForButtonRaw(i)

    let corrected: JsApiString

    const retType = typeof returnValueFromApi

    if (retType==="string") {
      corrected = JSON.parse(returnValueFromApi)
    } else if (retType==="object")
      corrected = returnValueFromApi["value"]
    else
      throw new Error("nextTimeStringForButton: unexpected return type")

    if (!corrected.success)
      printDebug("JS API returned success===false")

    return corrected.value
  }

  private static wrapString = (value: string): JsApiAny => {
    return {success: true, value: value}
  }

  private static nextTimeStringForButtonRaw = async (i: number): Promise<string> => {
    if (Anki.mock)
      return JSON.stringify(this.wrapString("2mock"))

    return await (await Anki.getApi())["ankiGetNextTime" + i]()
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
    if (Anki.mock) {
      return 2
    }
    return (await Anki.CallWithFailNotification.asNumber("ankiGetCardType"))
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
      const unit = step1.substring(match[0].length)
      return {value, unit}
    } else {
      printError(`Error in parseButtonTimeStrNumberAndUnit: input: "${step1}" match: "${match}"`)
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
    const unixTimestamp = await this.cardMod()
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

  /**
   * @return the number of days since the card was due.
   * */
  public static async daysSinceCardWasDue() {

    const daysSinceCreationOfCollection = this.daysSinceCreationOfCollection()

    { const due = await this.cardDue()
      if (0 <= due && due < 10 * 365)
        return daysSinceCreationOfCollection - due
    }
    // Strange number of days.  Thus, we assume that it is a new card,
    // for which the API function above returns a random integer.
    // Let's try something else:
    { const oDue = await this.cardOriginalDue(); /*original due: In filtered decks, it's the original due date that the
     card had before moving to filtered. https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#original-due*/
      if (0 < oDue && oDue < 10 * 365)
        return daysSinceCreationOfCollection - oDue
    }
    return Math.round(await this.daysSinceCardModified())
  }

  /**
   * new: note id or random int
   * due: integer day, relative to the collection's creation time
   * learning: integer timestamp
   *
   * source: https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#due
   */
  public static async cardDue(): Promise<number> {
    if (Anki.mock)
      return 0

    return (await Anki.CallWithFailNotification.asNumber("ankiGetCardDue"))
  }

  public static async cardDueRaw() {
    if (Anki.mock) return {value: 0}

    return (await (await Anki.getApi()).ankiGetCardDue())
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
  public static async cardOriginalDue() {
    if (Anki.mock) return 0

    return (await Anki.CallWithFailNotification.asNumber("ankiGetCardODue"))
  }
  public static async intervalOfCard() {
    if (Anki.mock) return 42
    return (await Anki.CallWithFailNotification.asNumber("ankiGetCardInterval"))
  }

  /**
   * @return Return ease factor of the card in permille (parts per thousand)
   *
   * Gotchas: Yes, really permille, not percent, in contrast to the UI where it is percent.
   *
   * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API/9fb80befe5c3551665a0a07886138025bcd9b4f1#card-ease-factor
   */
  public static async ease() {
    if (Anki.mock) return 2500

    return (await Anki.CallWithFailNotification.asNumber("ankiGetCardFactor"))
  }
  public static showAnswer() {
    window["showAnswer"]()
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
  public static async setCardDue(days: number) {
    if (Anki.mock || Anki.disableDangerousActions)
      return

    await (await Anki.getApi()).ankiSetCardDue(days)
  }

  /**
   * @return the time since the card was last shown to the user
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

  /**
   * @return the time since the card was last shown to the user
   * */
  public static async daysSinceLastSeen() {
    if (testingMode)
      return 15

    const daysSinceCardWasDue = await this.daysSinceCardWasDue()

    if (daysSinceCardWasDue === 0) {
      return 0
    }

    if (await this.cardStatus()===2)
      return daysSinceCardWasDue + await this.intervalOfCard()

    return daysSinceCardWasDue
  }

  public static async cardId(): Promise<number> {
    if (Anki.mock)
      return 12345
    return (await Anki.CallWithFailNotification.asNumber("ankiGetCardId"))
  }

  /**
   https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#last-modified-time-of-card
   If a card was never modified, this does NOT give the time when it was added,
   but some other unknown value, which does not seem to be in relation to to the
   added time. Maybe it is like the return value of the "cardDue" API method which returns "note id or random int" for new cards.
   */
  public static async cardMod() {
    if (Anki.mock) return 0

    return await this.CallWithFailNotification.asNumber("ankiGetCardMod")
  }
  public static async toggleFlag() {
    if (Anki.mock)
      return
    return (await Anki.getApi())["ankiToggleFlag"]()
  }
  public static async toggleMarkCard() {
    if (Anki.mock)
      return
    return (await Anki.getApi())["ankiMarkCard"]()
  }
  // noinspection JSUnusedGlobalSymbols
  public static TTS = class {
    public static readonly QUEUE_ADD = 1
    public static readonly QUEUE_FLUSH = 0

    public static async setLanguage(language: string) {
      if (Anki.mock)
        return

      await (await Anki.getApi())["ankiTtsSetLanguage"](language)
    }

    /**
     * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#speak
     */
    public static async speak(text: string, queueMode = 0) {
      if (Anki.mock) return

      await (await Anki.getApi())["ankiTtsSpeak"](text,queueMode)
    }

    /**
     * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-Javascript-API#set-tts-speed
     */
    public static async setSpeed(speed: number) {
      if (Anki.mock)
        return

      await (await Anki.getApi())["ankiTtsSetSpeechRate"](speed)
    }
    public static async stop() {
      if (Anki.mock) return

      await (await Anki.getApi())["ankiTtsStop"]()
    }
    public static async isSpeaking() {
      if (Anki.mock)
        return false

      return Anki.CallWithFailNotification.asBoolean("ankiTtsIsSpeaking")
    }
    public static async english() {
      if (Anki.mock) return

      await (await Anki.getApi())["ankiTtsSetLanguage"]('en-US')
    }
    public static async german() {
      if (Anki.mock) return

      await (await Anki.getApi())["ankiTtsSetLanguage"]('de-de')
    }
    public static async flushQueue() {
      await Anki.TTS.speak("", Anki.TTS.QUEUE_FLUSH)
    }
  }

  public static async eta() {
    if (Anki.mock) return 1

    return await this.CallWithFailNotification.asNumber("ankiGetETA")
  }
  public static async searchCard(query: string) {
    if (Anki.mock) return

    await (await Anki.getApi())["ankiSearchCard"](query)
  }
  /** @deprecated */
  public static async cardInterval() {
    return  this.intervalOfCard()
  }
  public static async showToast(s: string) {
    HtmlUtils.showToast(s)
  }

  private static CallWithFailNotification = class {
    private static valueAsAnyIfSuccess =
        async (methodName: string): Promise<any> =>
        {
          const retVal = await (await Anki.getApi())[methodName]();

          if (retVal?.success!==true)
            printError("JS API did NOT return success===true")

          return retVal["value"]
        }

    public static asString =
        async (methodName: string): Promise<string> =>
        {
          const retVal: string = await this.valueAsAnyIfSuccess(methodName)
          assertTypeEquals(retVal,"string");
          return retVal
        }

    public static asNumber =
        async (methodName: string): Promise<number> =>
        {
          const retVal: number = await this.valueAsAnyIfSuccess(methodName)
          assertTypeEquals(retVal,"number");
          return retVal
        }

    public static asBoolean =
        async (methodName: string): Promise<boolean> =>
        {
          const retVal: boolean = await this.valueAsAnyIfSuccess(methodName)
          assertTypeEquals(retVal,"boolean");
          return retVal
        }
  }
}
