export {}

declare global {

  type JsApiAny = {"success": boolean, value: any}
  type JsApiString = {"success": boolean, value: string}
  type JsApiStringArray = {"success": boolean, value: string[]}
  type JsApiNumber = {"success": boolean, value: number}
  type JsApiBoolean = {"success": boolean, value: boolean}

  export interface AnkiDroidJsInterface {
    ankiAddTagToCard: () => Promise<void>,
    ankiBuryCard: () => Promise<void>,
    ankiGetCardDue: () => Promise<JsApiNumber>,
    ankiGetCardId: () => Promise<JsApiNumber>,
    ankiGetCardInterval: () => Promise<JsApiNumber>,
    ankiGetCardMod: () => Promise<JsApiNumber>,
    ankiGetCardODue: () => Promise<JsApiNumber>,
    ankiGetCardType: () => Promise<JsApiNumber>,
    ankiGetETA: () => Promise<JsApiNumber>,

    /* These should be Promise<JsApiString>, but because of a bug they are
     Promise<String> filled with JSON of JsApiSting. */
    ankiGetNextTime1: () => Promise<string>,
    ankiGetNextTime2: () => Promise<string>,
    ankiGetNextTime3: () => Promise<string>,
    ankiGetNextTime4: () => Promise<string>,

    ankiIsDisplayingAnswer: () => Promise<JsApiBoolean>,
    ankiSearchCard: (query: string) => Promise<any>,
    ankiSetCardDue: (days: number) => Promise<void>,
    ankiShowToast: (msg: string) => Promise<void>,
    init: (str?: string) => Promise<any>,
    mocked: boolean,
    ankiGetCardFactor: () => Promise<JsApiNumber>,
    ankiTtsSpeak: (text: string, queueMode: number) => Promise<void>,
    ankiTtsStop: () => Promise<void>,
    ankiTtsIsSpeaking: () => Promise<JsApiBoolean>,
    ankiTtsSetLanguage: (lang: string) => Promise<void>,
    ankiTtsSetSpeechRate: (speed: number) => Promise<void>,
    ankiGetNoteTags: (noteId: string) => Promise<JsApiStringArray>,
    ankiSetNoteTags: (noteId: string, tags: string[]) => Promise<JsApiStringArray>,
  }

  class AnkiDroidJS implements AnkiDroidJsInterface {

    constructor(options: { version: string; developer: string })

    ankiGetNoteTags: () => Promise<JsApiStringArray>

    ankiSetNoteTags(noteId: string, tags: string[]): Promise<JsApiStringArray>

    ankiAddTagToCard(): Promise<void>

    ankiGetCardDue(): Promise<JsApiNumber>

    ankiGetCardFactor(): Promise<JsApiNumber>

    ankiGetCardId(): Promise<JsApiNumber>

    ankiGetCardInterval(): Promise<JsApiNumber>

    ankiGetCardMod(): Promise<JsApiNumber>

    ankiGetCardODue(): Promise<JsApiNumber>

    ankiGetCardType(): Promise<JsApiNumber>

    ankiGetETA(): Promise<JsApiNumber>

    /* These should be Promise<JsApiString>, but because of a bug they are
     Promise<String> filled with JSON of JsApiSting. */
    ankiGetNextTime1(): Promise<string>

    ankiGetNextTime2(): Promise<string>

    ankiGetNextTime3(): Promise<string>

    ankiGetNextTime4(): Promise<string>

    ankiIsDisplayingAnswer(): Promise<JsApiBoolean>

    ankiSearchCard(query: string): Promise<JsApiString>

    ankiSetCardDue(days: number): Promise<void>

    ankiTtsIsSpeaking(): Promise<JsApiBoolean>

    ankiTtsSetLanguage(lang: string): Promise<void>

    ankiTtsSetSpeechRate(speed: number): Promise<void>

    ankiTtsSpeak(text: string, queueMode: number): Promise<void>

    ankiTtsStop(): Promise<void>

    ankiBuryCard(): Promise<void>

    init(str: string | undefined): Promise<string>

    mocked: boolean

    ankiShowToast(msg: string): Promise<void>
  }

  // eslint-disable-next-line no-shadow
  interface Window {
    buttonAnswerEase1: () => Promise<void>
    buttonAnswerEase2: () => Promise<void>
    buttonAnswerEase3: () => Promise<void>
    buttonAnswerEase4: () => Promise<void>
  }
}
