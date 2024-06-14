/**
 * Updates: https://github.com/silidev/HelgeUtils/blob/main/HelgeUtils.ts
 *
 * HelgeUtils.ts V1.0
 * @description A collection of general utility functions not connected to a
 * specific project.
 *
 * Copyright by Helge Tobias Kosuch 2024 */

  // import {Deepgram} from "../node_modules/@deepgram/sdk/dist/module/index.js";


export namespace HelgeUtils {

  /** Config */
  /** You can turn this off for debugging */
  export namespace Config {
    export namespace Debug {
      export let debug = false;

      export namespace Misc {
        /** Misc because these are used in the Misc namespace below */
        export let bufferFunctionReturnValues = debug
      }
    }
  }

  export namespace Exceptions {
    /**
     * This is just a template to inline. */
    export const defineCustom = () => {
      class MyCustomException
          extends Error {
        constructor(message: string) {
          super(message)
          this.name = "MyCustomException"
        }
      }
      suppressUnusedWarning(MyCustomException)
    }

    export const stackTrace = (e: unknown) => {
      let str = ""
      if (e instanceof Error) {
        str += ", Stack trace:\n"
        str += e.stack
      }
      return str;
    }
    /**
     * Reporting of exceptions in callbacks is sometimes very bad.
     * Therefore, exceptions should always be caught and then passed
     * to this function, which alerts in a useful way.
     *
     * This also used to re-throw, but sometimes that is not good,
     * thus think about if you want to do this after calling this.
     *
     * Use this to throw an exception with a stack trace:
     *    throw new Error("Some useful error message")
     *
     * @return void
     *
     * @param e {Error} The exception, preferably of type Error,
     *        because then a stack trace will be displayed.
     <pre>
     IntelliJ Live Template
     <template name="try-catch-unhandled-exception" value="try {&#10;    $SELECTION$&#10;} catch(e) {&#10;    unhandledExceptionAlert(e);&#10;}" description="" toReformat="true" toShortenFQNames="true">
     <context>
     <option name="JAVA_SCRIPT" value="true" />
     <option name="JSX_HTML" value="false" />
     <option name="JS_CLASS" value="false" />
     <option name="JS_DOT_PROPERTY_ACCESS" value="false" />
     <option name="JS_EXPRESSION" value="false" />
     </context>
     </template>
     </pre>*/
    export const unhandledExceptionAlert = (e: any) => {
      let str = "Unhandled EXCEPTION! :" + e
      str += stackTrace(e)
      /* Do NOT call console.trace() here because the stack trace
         of this place here is not helpful, but instead very
         confusing. */
      console.log(str)
      alert(str)
      return str
    }

    /** swallowAll
     * Wraps the given void function in a try-catch block and swallows any exceptions.
     *
     * Example use:
     const produceError = () => {throw "error"}
     const noError = swallowAll(produceError);
     noError(); // Does NOT throw an exception.
     *
     * @param func
     */
    export const swallowAll =
        <T>(func: (...args: T[]) => void): (...args: T[]) => void => {
          return (...args: T[]): void => {
            try {
              func(...args)
            } catch (e) {
              // empty on purpose
            }
          }
        }
    ;

    /** Alias for swallowAll
     * @deprecated */
    export const catchAll = swallowAll;

    /** Alias for swallowAll
     * @deprecated */
    export const unthrow = swallowAll;


    /** callAndAlertAboutException(...)
     *
     * Used to wrap around UI function which would otherwise just fail silently.
     *
     * Often it is good to copy this function to your code
     * and bake an even better reporting mechanism in.
     *
     Use this template to use this:
     <pre>
     buttonWhatever: () => callAndAlertAboutException(() => {
     // your code here
     })
     </pre>
     */
    export const callAndAlertAboutException = function (f: () => void) {
      try {
        f()
      } catch (error) {
        unhandledExceptionAlert(error)
        throw error
      }
    }

    /**
     * Calls the function and swallows any exceptions. */
    export const callSwallowingExceptions = (f: () => void) => {
      try {
        f()
      } catch (err) {
        console.log("Ignored: ")
        console.log(err)
      }
    }

    /** @deprecated Inline this everywhere! */
    export const throwError = (msg: string) => {
      throw new Error(msg)
    }

    /**
     *
     * See also {@link Exceptions.defineCustom}
     *
     * Example:
     * <pre>
     try {
     } catch (error) {
     catchSpecificError(RangeError, 'Invalid time value', (error) => {}
     }
     </pre>
     *
     * @param errorType
     * @param callback
     * @param wantedErrorMsg
     */
    export const catchSpecificError = (
        errorType: any
        , callback: (error: Error) => void
        , wantedErrorMsg: string | null = null) => (error: Error) => {
      if (error instanceof errorType
          && (wantedErrorMsg === null && error.message === wantedErrorMsg)) {
        callback(error)
      } else {
        throw error
      }
    }
  }

  export namespace Eval {

    /**
     * Like "eval(...)" but a little safer and with better performance.
     *
     * The codeStr must be known to be from a secure source, because
     * injection of code through this is easy. This is intentional to
     * allow important features.
     * */
    export const evalBetter = function (codeStr: string, args: any) {
      if (Strings.isBlank(codeStr)) {
        throw ("evalBetter(): codeStr must not be empty")
      }
      return executeFunctionBody(" return (" + codeStr + ")", args)
    }

    /**
     * Somewhat like eval(...) but a little safer and with better performance.
     *
     * In contrast to {@link evalBetter} here you can and must use a return
     * statement if you want to return a value.
     *
     * Docs about the method:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
     *
     * @param functionBodyStr
     * @param args {object} An object with entities, which you want to give the code
     *        in the string access to.
     * */
    export const executeFunctionBody = (functionBodyStr: string, args: object) => Function(`
            "use strict"
            return function(args) {
                ` + functionBodyStr + `
            }
          `)()(args)
  }

  export namespace Conversions {
    export const parseIntWithNull = (input: string | null) => {
      if (input==null) {
        return null
      }
      return parseInt(input)
    }

    export const parseFloatWithNull = (input: string | null) => {
      if (input==null) {
        return null
      }
      return parseFloat(input)
    }
  }

  export namespace Types {
    export class TypeException extends Error {
      constructor(message: string) {
        super(message)
        this.name = "MyCustomException"
      }
    }

    export namespace SafeConversions {
      export const toNumber = (input: string): number => {
        const result = parseFloat(input)
        if (isNaN(result)) {
          throw new Error(`Not a number: "${input}"`)
        }
        return result
      }

      export const toBoolean = (resultAsString: string) => {
        switch (resultAsString.trim()) {
          case "t":
          case "tt":
          case "true":
          case "on":
          case "ON":
            return true
          case "f":
          case "ff":
          case "off":
          case "OFF":
          case "false":
            return false
          default:
            throw new TypeException(`Not a boolean: "${resultAsString}"`)
        }
      }
    }
  }


  /** Returns true if the parameter is not undefined. */
  export const isDefined = (x: any) => {
    let u: any
    // noinspection JSUnusedAssignment
    return x !== u
  }

  /**
   * This is only useful in JS. Not needed in TS.
   *
   * createImmutableStrictObject({}).doesNotExist will
   * throw an error, in contrast to {}.whatEver, which
   * will not.
   */
  export const createImmutableStrictObject = (input: object) => {
    const handler = {
      get: function (target: any, prop: any) {
        if (prop in target) {
          return target[prop]
        } else {
          throw new Error("Property ${prop} does not" +
              " exist on target object.")
        }
      },
      set: function (target: any, prop: any, value: any) {
        HelgeUtils.suppressUnusedWarning(target,prop,value)
        throw new Error("This object is immutable." +
            " You cannot change ${prop}.")
      }
    }
    return new Proxy(input, handler)
  }

  export namespace MarkDown {
    /** Returns the text of only the == ==-highlighted text. */
    export const extractHighlights = (input: string): string[] => {
      const regex = /={2,3}([^=]+)={2,3}/g
      let matches: string[] = []
      let match: string[] | null

      while ((match = regex.exec(input)) !== null) {
        matches.push(match[1].trim())
      }

      return matches
    }
  }

  /**
   * A function that does nothing. I use it to avoid "unused variable" warnings.
   *
   * Old name: nop
   *
   * @param args
   */
  export const suppressUnusedWarning = (...args: any[]) => {
    const flag = false
    if (flag) {
      console.log(args)
    }
  }
  export namespace Tests {

    /** This function is a copy template. */
    export const runTestsOnlyToday = () => {
      const RUN_TESTS = new Date().toISOString().slice(0, 10) === "2024-01-24"
      suppressUnusedWarning(RUN_TESTS)
    }

    // eslint-disable-next-line no-shadow
    export const assert = (condition: boolean, ...output: any[]) => {
      if (condition)
          // Everything is fine, just return:
        return
      // It is NOT fine! Throw an error:
      console.log(...output)
      throw new Error(output.join(","))
    }

    /**
     * V2 27.04.2024
     */
        // eslint-disable-next-line no-shadow
    export const assertEquals = (actual: any, expected: any, message: string | null = null) => {
      const expectedJson = JSON.stringify(expected)
      const actualJson = JSON.stringify(actual)
      if (actualJson !== expectedJson) {
        if (actual instanceof Date && expected instanceof Date
            && actual.getTime()===expected.getTime())
          return
        console.log("*************** actual  :\n" + actualJson)
        console.log("*************** expected:\n" + expectedJson)
        if (typeof expected === 'string' && typeof actual === 'string') {
          const expectedShortened = expected.substring(0, 20).replace(/\n/g, '')
          const actualShortened = actual.substring(0, 20).replace(/\n/g, '')
          throw new Error(message
              || `Assertion failed: Actual: ${actualShortened}, but expected ${expectedShortened}`)
        }
        throw new Error(message
            || `Assertion failed: Actual: ${actualJson}, but expected ${expectedJson}`)
      }
    }
  }

  export const consoleLogTmp = (...args: any[]) => {
    args.forEach(arg => console.log(arg))
  }

  export const consoleLogTheDifference = (actual: string, expected: string) => {
    console.log("*************** actual  :\n" + actual)
    // @ts-expect-error
    if (1 === 0) {
      console.log("*************** expected:\n" + expected)
    }
    let diffCount = 0
    // @ts-expect-error
    if (1 === 0) {
      for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
        if (expected[i] !== actual[i]) {
          if (diffCount === 0) {
            console.log("Difference at index " + i)
            console.log(expected.substring(i, i + 80))
            console.log(actual.substring(i, i + 80))
          }
          console.log(expected[i] + "," + actual[i])
          diffCount++
          if (diffCount > 8) {
            break
          }
        }
      }
    }
  }

  import assert = Tests.assert
  import assertEquals = Tests.assertEquals

  export const testRemoveElements = () => {
    const tagsToRemove = ['tag1', 'tag2', 'tag3']
    // Deep copy of tagsToRemove
    const testTagsArray = JSON.parse(JSON.stringify(tagsToRemove))
    //print('testTagsArray: '+testTagsArray.join(' ')+'<br>')
    testTagsArray.push('NotToBeRemoved')
    //print('removeElements test: '
    //  +removeElements(testTagsArray,tagsToRemove)+'<br>')
    assert(
        HelgeUtils.removeElements(testTagsArray, tagsToRemove).length === 1,
        "removeElements failed"
    )
  }
  /**
   * removeElements
   *
   * @param input is an array of elements
   * @param toBeRemoved a list of elements which should be removed.
   *
   * @return *[] list with the elements removed
   */
  export const removeElements = (input: any[], toBeRemoved: any) => {
    let output: string[] = []
    for (let i = 0; i < input.length; i++) {
      let element = input[i]
      if (!toBeRemoved.includes(element)) {
        output.push(element)
      }
    }
    return output
  }
  export namespace Strings {
    export namespace Regexes {
      // const removeFirstAndLastChar = (input: string) => input.substring(1, input.length - 1)
      // const assertFirstAndLastCharAreSpaces = (input: string): string => {
      //   if (input.length < 2 || input[0] !== ' ' || input[input.length - 1] !== ' ') {
      //     throw new Error('The first and last characters must be spaces')
      //   }
      //   return input
      // }

      /**
       * Replaces parts of a string based on a list of regular expression and replacement
       * pairs.
       *
       * @param {string} input - The input string to be processed.
       * @param {Array.<[RegExp, string]>} replacementList - An array of arrays, where
       *     each inner array contains a RegExp object and a string. and the
       *     corresponding strings are used to replace those matches.
       *
       * @returns {string} - The processed string with replacements applied.
       *
       * The function first pads the input string with spaces at the beginning and end.
       * Then, for each pair in the replacement list, it performs a replacement operation
       *     using the given regular expression and replacement string. Finally, it
       *     ensures the first and last characters of the resulting string are spaces,
       *     removes them, and returns the modified string.
       *
       * Example:
       * ```
       * const input = "example text";
       * const replacementList = [
       *   [/\bexample\b/g, "sample"],
       *   [/\btext\b/g, "string"]
       * ];
       * const result = replaceFromList(input, replacementList);
       * console.log(result); // Outputs: "sample string"
       * ```
       */
      export const replaceFromList = (input: string,
          replacementList: [RegExp | string, string][]): string => {
        let result = input

        replacementList.forEach(([regex, replacement]) => {
          result = result.replace(regex, replacement)
        })
        return result
      }
    }
    /** Returns the index of the first occurrence of the given regex in the string.
     *
     * @param input
     * @param regex
     * @param startpos
     */
    export const regexIndexOf = (input: string, regex: RegExp, startpos: number) => {
      const indexOf = input.substring(startpos || 0).search(regex);
      return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
    };

    /**
     * @deprecated Use regexIndexOf instead.
     * @see regexIndexOf
     */
    export const indexOfWithRegex = regexIndexOf

    export const regexLastIndexOf = (input: string, regex: RegExp, startpos: number) => {
      regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiline ? "m" : ""));
      if (typeof (startpos) == "undefined") {
        startpos = input.length;
      } else if (startpos < 0) {
        startpos = 0;
      }
      const stringToWorkWith = input.substring(0, startpos + 1);
      let lastIndexOf = -1;
      let nextStop = 0;
      let result: RegExpExecArray | null;
      while ((result = regex.exec(stringToWorkWith)) != null) {
        lastIndexOf = result.index;
        regex.lastIndex = ++nextStop;
      }
      return lastIndexOf;
    };

    /**
     * @deprecated Use regexLastIndexOf instead.
     */
    export const lastIndexOfWithRegex = regexLastIndexOf

    /**
     * Trim whitespace but leave a single newline at the end if there is
     * any whitespace that includes a newline.
     */
    export const trimExceptASingleNewlineAtTheEnd = (input: string): string => {
      // Check for whitespace including a newline at the end
      if (/\s*\n\s*$/.test(input)) {
        // Trim and leave a single newline at the end
        return input.replace(/\s+$/, '\n')
      } else {
        // Just trim normally
        return input.trim()
      }
    }

    export const toUppercaseFirstChar = (input: string): string => {
      if (input.length === 0) return input

      const specialChars: { [key: string]: string } = {
        'ü': 'Ü',
        'ö': 'Ö',
        'ä': 'Ä'
      }

      const firstChar = input.charAt(0)
      return (specialChars[firstChar] || firstChar.toLocaleUpperCase()) + input.slice(1)
    }

    export const escapeRegExp = (str: string): string => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    export const runTests = function (){
      testRemoveEmojis()
      Whitespace.runTests()
      testCapitalizeSentences()
    }

    export const removeEmojis = (str: string): string => str.replace(/[^a-zA-Z0-9 _\-üöäÜÖÄß]/g, "")
    export const testRemoveEmojis = () => {
      const runTest = (input: string, expected: string) => {
        assertEquals(Strings.removeEmojis(input), expected
            , "testRemoveEmojis failed")
      }
      runTest("a👨‍👩‍👧‍👦b","ab")
      runTest("Td🏗️","Td")
    }

    /** Return a string representation of a number, with the leading zero removed.
     * Example: numToStr(0.5) returns ".5". */
    export const numToStr = (num: number| string) => num.toString().replace("0.", ".")

    export const tagsStringToArray = (input: string) => Whitespace.replaceWhitespaceStretchesWithASingleSpace(input).trim().split(" ")

    export const Whitespace = class WhitespaceClass {

      public static runTests() {
        this.testRemoveLeadingWhitespace()
        this.testReplaceWhitespaceStretchesWithASingleSpace()
      }

      /*************
       * Replace each stretch of whitespace in a string with a single underscore.
       * Gotchas: This also removes leading and trailing whitespace.
       * For easier comparing in unit tests. */
      public static replaceWhitespaceStretchesWithASingleUnderscore(inputString: string) {
        return inputString.replace(/[ \t]+/gm, '_')
      }

      public static replaceTabAndSpaceStretchesWithASingleSpace(inputString: string) {
        return inputString.replace(/[ \t]+/gm, ' ')
      }

      /************* replaceWhitespaceStretchesWithASingleSpace
       * replace each stretch of whitespace in a string with a single space
       */
      public static replaceWhitespaceStretchesWithASingleSpace(str: string) {
        return str.replace(/\s+/g, " ")
      }

      public static testReplaceWhitespaceStretchesWithASingleSpace() {
        let str =
            "This   is \t\t\n\n\r  a  \t  string   with   multiple   spaces"
        let replaced = this.replaceWhitespaceStretchesWithASingleSpace(str)
        if (replaced === "This is a string with multiple spaces") {
          // blank on purpose
        } else {
          throw "testReplaceWhitespaceStretchesWithASingleSpace failed."
        }
      }

      public static standardizeLeadingWhitespace(inputString: string) {
        return WhitespaceClass.replaceLeadingWhitespace(
            (" " + inputString).replace(/^/gm, " ")
            , '      ')
      }

      public static replaceLeadingWhitespace(inputString: string, replacement: string) {
        return inputString.replace(/^\s+/gm, replacement)
      }

      public static removeLeadingWhitespace(inputString: string) {
        return WhitespaceClass.replaceLeadingWhitespace(inputString, '')
      }

      public static testRemoveLeadingWhitespace () {
        const input = `
    This is a test.`
        const expected = `This is a test.`
        const result = this.removeLeadingWhitespace(input)
        if (result !== expected) {
          console.log('testRemoveLeadingWhitespace failed')
          HelgeUtils.consoleLogTheDifference(result, expected)
          throw "testRemoveLeadingWhitespace failed"
        }
      }

      public static removeAllSpaces(inputString: string) {
        return inputString.replace(/\s/g, '')
      }
    }

    /**
     * In the given template input string, replace all occurrences of ${key}
     * with the value of the key in the replacements object.
     * Example:
     * const input = "Hello ${name}, you are ${age} years old."
     * const replacements = { name: "John", age: 25 }
     * const result = formatString(input, replacements)
     * // result is now "Hello John, you are 25 years old." */
    export const formatString = (input: string, replacements: object): string => input.replace(/\${(.*?)}/g, (_, key) => {
      // @ts-expect-error
      return replacements[key]
    })

    export const isBlank = (input: string) => {
      if (!input) {
        return true
      }
      return input.trim() === ""
    }

    /* As of 2023 this is not built into JS or TS. */
    export const isNotBlank = (input: string) => input.trim().length !== 0

    export const removeLineBreaks = (input: string) => {
      if (!input) {
        return input
      }
      return input.replace(/(\r\n|\n|\r)/gm,"")
    }

    export const capitalizeSentences = (text: string
        , sentenceEndMarkerRegex: RegExp = /([.!:?]\s)|(\{\{c\d\d?::)/g) /*
        Was, seems stupid, delete finally: /([.!:?]\s|\.$)/g */
        : string => {
      const parts = text.split(sentenceEndMarkerRegex)
          // Remove all falsy values:
          .filter( // The function Boolean converts everything to boolean:
              Boolean)

      return parts
          .map((part, index) => {
            if (index % 2 === 0) {
              return part.charAt(0).toUpperCase() + part.slice(1)
            } else {
              return part
            }
          })
          .join('')
    }
    export const testCapitalizeSentences = () => {
      const minimumBetweenSentenceEndMarkers = "  " /* If this would be only a single space,
       capitalization will fail. That is fine. Not worth the time to fix it. */
      const text =
          "this is a sentence.. here is another one! yet another sentence? And the answer is:"
          + minimumBetweenSentenceEndMarkers
          +"{{c1::and a special case. And more."
      const expectedOutput =
          "This is a sentence.. Here is another one! Yet another sentence? And the answer is:"
          +minimumBetweenSentenceEndMarkers
          +"{{c1::And a special case. And more."
      const result = capitalizeSentences(text)

      assertEquals(result, expectedOutput, `testCapitalizeSentences failed`)
    }
  }

  /* Returns a random element of the given array */
  export const randomElementOf = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

  export const runTests = function (){
    testRemoveElements()
    DatesAndTimes.runTests()
    Strings.runTests()
  }

  export namespace TTS {
    /**
     * Always fails with error code 400 :(
     *
     * https://platform.openai.com/docs/api-reference/audio/createSpeech
     */
    export const withOpenAi = async (input: string, apiKey: string) => {
      const formData = new FormData()
      formData.append("model","tts-1") // One of the available TTS models: tts-1 or tts-1-hd
      formData.append('input', input)
      formData.append('voice', "alloy") //  Supported voices are alloy, echo, fable, onyx, nova, and shimmer. Previews of the voices are available in the Text to speech guide: https://platform.openai.com/docs/guides/text-to-speech/voice-options
      // formData.append('speed', ".5") // from 0.25 to 4.0

      console.log("apiKey=="+apiKey)

      const response = await fetch(
          // "https://corsproxy.io/?" + encodeURIComponent
          ("https://api.openai.com/v1/audio/speech")
          , {
            method: 'GET', // GET only for testing, must be POST later!
            // headers: {
            //   'Authorization': `Bearer ${apiKey}`,
            //   "Content-Type": "application/json"
            // },
            // body: formData
          })

      if (!response.ok) {
        const message = `Failed to fetch audio file: ${response.status} ${JSON.stringify(response.body)}`
        console.log(message)
        throw new Error(message)
      }
      const audioBlob = await response.blob();
      const audioContext = new AudioContext();

      const audioSource = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());

      const playSound = audioContext.createBufferSource();
      playSound.buffer = audioSource;
      playSound.connect(audioContext.destination);

      playSound.start();
    }
  }

  export namespace Transcription {

    export class TranscriptionError extends Error {
      public payload: object
      constructor(payload: object) {
        super("TranscriptionError")
        this.name = "TranscriptionError"
        this.payload = payload
      }
    }

    export type ApiName = "OpenAI" | "Gladia" | "Deepgram-nova-2" | "Deepgram-whisper"

    /**
     *
     * Docs: https://docs.speechmatics.com/features
     *
     * @param audioBlob
     * @param apiKey
     **/
    const withSpeechmatics = async (audioBlob: Blob, apiKey: string) => {

      const formData = new FormData()
      formData.append('data_file', audioBlob)
      formData.append('config', JSON.stringify({
        // docs: https://docs.speechmatics.com/jobsapi#tag/JobConfig
        type: 'transcription',
        transcription_config: {
          operating_point: 'enhanced',
          language: 'de'
        }
      }))

      const response = await fetch(
          /* Docs: https://docs.speechmatics.com/introduction/batch-guide */
          "https://asr.api.speechmatics.com/v2/jobs/?"
          , {
            method: 'POST',
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: formData
          })
      const result = await response.json()
      return result
    }

    /**
     *
     * Docs: https://developers.deepgram.com/reference/listen-file
     *
     * @param audioBlob
     * @param apiKey
     * @param useWhisper If false, nova-2 is used currently.
     **/
    const withDeepgram = async (audioBlob: Blob, apiKey: string,
                                useWhisper = false) => {
      const response = await fetch(
          /* Docs: https://developers.deepgram.com/reference/listen-file */
          "https://api.deepgram.com/v1/listen?" +
          (useWhisper?
            "model=whisper-large" +
            "&language=de"
          :
            "&detect_language=de" +
            "&detect_language=en" +
            // "&dictation=true" + // Will convert comma to , etc
            "&model=nova-2"+
            "&numerals=true" +
            "&punctuate=true"
          )
          , {
            method: 'POST',
            headers: {
              Accept: "application/json",
              Authorization: `Token ${apiKey}`,
              "Content-Type": "audio/wav",
            },
            body: audioBlob
          })
      const result = await response.json()
      // noinspection JSUnresolvedReference
      const maybeTranscription = result?.results?.channels[0]?.alternatives[0]?.transcript
      if (typeof maybeTranscription === "string") return maybeTranscription
      return result
    }

    /** Transcribes the given audio blob using the given API key and prompt.
     *
     * @param audioBlob
     * @param apiKey
     * @param prompt Ignored if translateToEnglish==true
     * @param language
     * @param translateToEnglish
     */
    const withOpenAi = async (audioBlob: Blob, apiKey: string, prompt: string,
                              language: string = "", translateToEnglish = false) => {
      const formData = new FormData()
      formData.append('file', audioBlob)
      formData.append('model', 'whisper-1'); // Using the largest model
      if (!translateToEnglish)
      formData.append('prompt', prompt)
      /* Language. Anything in a different language will be translated to the target language. */
      formData.append('language', language)

      /*  */
      formData.append('language', language) // e.g. "en". The language of the input audio. Supplying the input language in ISO-639-1 format will improve accuracy and latency.

      // formData.append('temperature', WHISPER_TEMPERATURE) // temperature number Optional
      // Defaults to 0 The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use log probability to automatically increase the temperature until certain thresholds are hit. https://platform.openai.com/docs/api-reference/audio/createTranscription#audio-createtranscription-temperature

      /* Docs: https://platform.openai.com/docs/api-reference/audio/createTranscription */
      const response = await fetch(
          "https://api.openai.com/v1/audio/"
          +(translateToEnglish?'translations':'transcriptions')
          , {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      })
      const result = await response.json()
      if (typeof result.text === "string") return result.text
      return result
    }

    const withGladia = async (audioBlob: Blob,
                              apiKey: string,
                              prompt: string = '',
                              language: string | null = null
    ) => {
      suppressUnusedWarning(prompt)
      // Docs: https://docs.gladia.io/reference/pre-recorded
      const formData = new FormData()
      formData.append('audio', audioBlob)
      /*Value	Description
manual	manually define the language of the transcription using the language parameter
automatic single language	default value and recommended choice for most cases - the model will auto-detect the prominent language in the audio, then transcribe the full audio to that language. Segments in other languages will automatically be translated to the prominent language. The mode is also recommended for scenarios where the audio starts in one language for a short while and then switches to another for the majority of the duration
automatic multiple languages	For specific scenarios where language is changed multiple times throughout the audio (e.g. a conversation between 2 people, each speaking a different language.).
The model will continuously detect the spoken language and switch the transcription language accordingly.
Please note that certain strong accents can possibly cause this mode to transcribe to the wrong language.
*/
      if (language)
        formData.append('language_behaviour', 'automatic multiple languages')

      formData.append('toggle_diarization', 'false')
      // formData.append('transcription_hint', prompt)
      formData.append('output_format', 'txt')

      interface GladiaResult {
        prediction: string
      }
      const result: GladiaResult = await (await fetch('https://api.gladia.io/audio/text/audio-transcription/', {
        method: 'POST',
        headers: {
          'x-gladia-key': apiKey
        },
        body: formData
      })).json()
      const resultText = result?.prediction
      return resultText
    }

    export const transcribe = async (api: ApiName, audioBlob: Blob, apiKey: string,
                                     prompt: string = '', language: string = "",
                                     translateToEnglish = false) =>
    {
      if (!audioBlob || audioBlob.size===0) return ""
      const output =
          api === "OpenAI" ?
              await withOpenAi(audioBlob, apiKey, prompt, language, translateToEnglish)
          : api === "Deepgram-whisper" ?
              await withDeepgram(audioBlob, apiKey, true)
          : api === "Deepgram-nova-2" ?
              await withDeepgram(audioBlob, apiKey)
      // @ts-expect-error
          : api === "Speechmatics" ?
              await withSpeechmatics(audioBlob, apiKey)

          :  await withGladia(audioBlob, apiKey)
      if (typeof output === "string") return output
      throw new TranscriptionError(output)
    }
  }

  /* NOT reliable in Anki and AnkiDroid. */
  export namespace ReplaceByRules {
    export class ReplaceRules {
      public constructor(private rules: string) {
      }

      public applyTo = (subject: string) => {
        return replaceByRules(subject, this.rules, false, false).resultingText
      }
      public applyToWithLog = (subject: string) => {
        return replaceByRules(subject, this.rules, false, true)
      }
    }

    export class WholeWordReplaceRules {
      public constructor(private rules: string) {
      }

      public applyTo = (subject: string) => {
        return replaceByRules(subject, this.rules, true, false).resultingText
      }
      public applyToWithLog = (subject: string) => {
        return replaceByRules(subject, this.rules, true, true)
      }
    }

    export class WholeWordPreserveCaseReplaceRules {
      public constructor(private rules: string) {
      }

      public applyTo = (subject: string) => {
        return replaceByRules(subject, this.rules, true, false, true).resultingText
      }
      public applyToWithLog = (subject: string) => {
        return replaceByRules(subject, this.rules, true, true, true)
      }
    }

    /**
     * NOT reliable in Anki and AnkiDroid.
     *
     * Deprecated! Use ReplaceRules or WholeWordReplaceRules instead.
     *
     * Do NOT change the syntax of the rules, because they must be kept compatible with
     * https://github.com/No3371/obsidian-regex-pipeline#readme
     *
     * @param subject - The text to replace in.
     * @param allRules - The rules to apply.
     * @param wholeWords - If true, only whole words are replaced.
     * @param logReplacements - If true, a log of the replacements is returned.
     * @param preserveCase - If true, the case of the replaced word is preserved.
     */
    export const replaceByRules = (subject: string, allRules: string, wholeWords = false
        , logReplacements = false, preserveCase = false) => {
      const possiblyWordBoundaryMarker = wholeWords ? '\\b' : ''
      let appliedRuleNumber = 0
      let log = 'input string before replacements == \n' + subject + "\n)))---(((\n"

      function applyRule(rawTarget: string, regexFlags: string, replacementString: string, replacementFlags: string) {
        const target = possiblyWordBoundaryMarker + rawTarget + possiblyWordBoundaryMarker
        // console.log("\n" + target + "\n↓↓↓↓↓\n"+ replacement)
        let regex = regexFlags.length == 0 ?
          new RegExp(target, 'gm') // Noted that gm flags are basically
          // necessary for this plugin to be useful, you seldom want to
          // replace only 1 occurrence or operate on a note only contains 1 line.
            : new RegExp(target, regexFlags)
        if (logReplacements && subject.search(regex) !== -1) {
          const countRegexMatches = (input: string, pattern: RegExp): number => {
            const matches = input.match(pattern)
            return matches ? matches.length : 0
          }
          const n = countRegexMatches(subject, regex)
          const ruleStr = `"${rawTarget}"${regexFlags}`
              +`->"${replacementString}"${replacementFlags}`
          log += `(${appliedRuleNumber}) n=${n}: ${ruleStr};\n`
          appliedRuleNumber++
        }
        if (replacementFlags == 'x')
          subject = subject.replace(regex, '')
        else
          subject = subject.replace(regex, replacementString)
      }

      let rule: RegExpExecArray | null
      const ruleParser = /^"(.+?)"([a-z]*?)(?:\r\n|\r|\n)?->(?:\r\n|\r|\n)?"(.*?)"([a-z]*?)(?:\r\n|\r|\n)?$/gmus
      while (
          (rule = ruleParser.exec(allRules)) /* This works fine in a Chrome
           but at least sometimes returns falsely null inside Anki and
            AnkiDroid. */
          ) {
        const [
          , target
          , regexFlags
          , replacementString
          , replacementFlags
        ] = rule
        applyRule(target, regexFlags, replacementString, replacementFlags)
        if (preserveCase) {
          applyRule(
              Strings.toUppercaseFirstChar(target), regexFlags,
              Strings.toUppercaseFirstChar(replacementString), replacementFlags)
        }
      }
      return {
        resultingText: subject,
        log: log
      }
    }

  /**
   * Deprecated! Use ReplaceRules or WholeWordReplaceRules instead.
   */
    export const replaceByRulesAsString = (subject: string, allRules: string) => {
      return replaceByRules(subject, allRules, false, false).resultingText
    }
  }

  export const memoize = <T, R>(func: (...args: T[]) => R): (...args: T[]) => R => {
    const cache = new Map<string, R>()

    return (...args: T[]): R => {
      const key = JSON.stringify(args)
      if (cache.has(key) && Config.Debug.Misc.bufferFunctionReturnValues) {
        return cache.get(key)!
      } else {
        const result = func(...args)
        cache.set(key, result)
        return result
      }
    }
  }

  export namespace Misc {


    /** This is NOT only for unit tests! */
    export const assertTypeEquals = (value: any, expectedType: string) => {
      const actual = typeof value;
      if (actual !== expectedType) {
        throw new Error(
            `Got type ${actual
            }, but expected type ${expectedType
            }/ toString()===${value.toString()
            }/ JSON===${JSON.stringify(value)
            }`)
      }
    }

    /** nullFilter
     *
     * Throws an exception if the input is null.
     *
     * This canNOT be replace with the ?? in assignments.
     *
     * I use "strictNullChecks": true to avoid bugs. Therefore, I need this
     * where that is too strict.
     *
     * Use example:
     * const elementWithId = (id: string) =>
     *   nullFilter<HTMLElement>(HtmlUtils.elementWithId(id)) */
    export const nullFilter = <U>(input: U | null): U => {
      if (input === null)
        throw new Error(`Unexpected null value.`)
      return input
    }

    //end of namespace Misc:
  }

  /**
   * Source:
   * https://stackoverflow.com/questions/17528749/semaphore-like-queue-in-javascript
   */
  export namespace Semaphore {
    export class Queue {
      private running: any;
      private readonly autorun: boolean;
      private queue: any[];

      constructor(autorun = true, queue = []) {
        this.running = false;
        this.autorun = autorun;
        this.queue = queue;
      }

      //ts-ignore
      add(cb: (arg0: any) => any) {
        this.queue.push((value: any) => {
          const finished = new Promise((resolve, reject) => {
            const callbackResponse = cb(value);

            if (callbackResponse !== false) {
              resolve(callbackResponse);
            } else {
              reject(callbackResponse);
            }
          });
          finished.then(this.dequeue.bind(this), (() => {
          }));
        });

        if (this.autorun && !this.running) {
          // @ts-expect-error
          this.dequeue();
        }
        return this;
      }

      dequeue(value: any) {
        this.running = this.queue.shift();
        if (this.running) {
          this.running(value);
        }
        return this.running;
      }

      get next() {
        return this.dequeue;
      }
    }

    // noinspection JSUnusedLocalSymbols
    const test = () => {
      // passing false into the constructor makes it so
      // the queue does not start till we tell it to
      const q = new Queue(false).add(function () {
        //start running something
      }).add(function () {
        //start running something 2
      }).add(function () {
        //start running something 3
      });

      setTimeout(function () {
        // start the queue
        // @ts-expect-error
        q.next();
      }, 2000);
    }
    suppressUnusedWarning(test)
  }

  export namespace Net {
    export namespace OpenAi {
      export namespace Test {
        export const testApiUp = async () => {
          const url = "https://api.openai.com/v1/audio/speech"
          assertEquals((await fetch(url))["type"], "invalid_request_error")
        }
      }
    }
    //end of namespace Net:
  }

  export namespace Debugging {

    export namespace DevConsoles {

      export namespace Eruda {

        /**
         * Often you should inline this function and load it before other scripts.
         * */
        export const load = () => {
          // Import from here instead: HelgeLoadFirst.Debug.DevConsole.Eruda.load()
        }
      }
    }
  }

  class DatesAndTimesInternal {

    static Weekdays = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    } as const

    private static pad = (n: number) => n < 10 ? '0' + n : n
    public static nextWeekdayLocalIsoDate(weekday: number, now = new Date()) {
      const currentDay = now.getDay()

      const daysUntilDesiredDay = (weekday - currentDay + 7) % 7 || 7
      const desiredDayDate = new Date(now)
      desiredDayDate.setDate(now.getDate() + daysUntilDesiredDay)

      return desiredDayDate
    }

    public static isValidISODate (str: string) {
      const date = new Date(str)
      return this.isValidDate(date) && date.toISOString() === str
    }

    public static isValidDate(date: Date) {
      return !isNaN(date.getTime())
    }
    public static cutAfterMinutesFromISODate(isoDate: string) {
      return isoDate.slice(0, 16)
    }
    public static cutAfterHourFromISODate(isoDate: string) {
      return isoDate.slice(0, 13)
    }
    public static parseRelaxedIsoDate(input: string): Date | null {
      const isoTime = input.replace(',', 'T')
      const date = new Date(isoTime)
      return isNaN(date.getTime()) ? null : date
    }
    public static testParseRelaxedIsoDate() {
      const parse = this.parseRelaxedIsoDate
      const expected = new Date('2022-01-01T00:00:00.000Z').toISOString()
      assertEquals((parse('2022-01-01') as Date).toISOString(), expected)
      assertEquals((parse('2022-01-01') as Date).toISOString(), expected)
      assert(parse('not a date') === null)
    }


    private static year(date: Date, twoDigitYear: boolean) {
      return (twoDigitYear ? date.getFullYear().toString().slice(-2) : date.getFullYear())
    }

    private static date2yyyymmddDashedYearDigits(date: Date, twoDigitYear: boolean) {
      return this.year(date, twoDigitYear)
        + '-'
        + this.twoDigitMonth(date)
        + '-'
        + this.twoDigitDay(date)
    }

    private static day(date: Date) {
      return date.getDate()
    }

    private static month(date: Date) {
      return date.getMonth() + 1
    }

    private static twoDigitDay(date: Date) {
      return this.pad(this.day(date));
    }

    private static twoDigitMonth(date: Date) {
      return this.pad(this.month(date));
    }

    public static date2ddmmyyPointed(date: Date, twoDigitYear: boolean) {
      return ""
        + this.twoDigitDay(date)
        + '.'
        + this.twoDigitMonth(date)
        + '.'
        + this.year(date, twoDigitYear)
    }

    public static date2dmyyPointed(date: Date, twoDigitYear: boolean) {
      return ""
        + this.day(date)
        + '.'
        + this.month(date)
        + '.'
        + this.year(date, twoDigitYear)
    }

    /** Return a string representation of a date in the format YYYY-MM-DD.
     * Example: date2yyyymmddDashed(new Date(2022, 0, 1)) returns "2022-01-01". */
    public static date2yyyymmddDashed(date: Date) {
      return DatesAndTimes.date2yyyymmddDashedYearDigits(date, false)
    }
    public static date2yymmddDashed(date: Date) {
      return DatesAndTimes.date2yyyymmddDashedYearDigits(date, true)
    }

    public static Timestamps = class {
      public static yymmddDashed() {
        return DatesAndTimes.date2yymmddDashed(new Date())
      }

      public static ddmmyyPointed() {
        return DatesAndTimes.date2dmyyPointed(new Date(),true)
      }
    }

    /**
     * Converts a Date object to an ISO 8601 formatted string using the local time zone.
     *
     * @param {Date} date - The Date object to be converted.
     * @returns {string} An ISO 8601 formatted date string in the local time zone.
     */
    public static dateToLocalIsoDate (date: Date): string {
      const offset = date.getTimezoneOffset()
      const localDate = new Date(date.getTime() - offset * 60 * 1000)
      return localDate.toISOString().slice(0, -1)
    }
    public static runTests() {
      this.testParseRelaxedIsoDate()
    }
    // end of DatesAndTimes:
  }

  export const DatesAndTimes = DatesAndTimesInternal;
}