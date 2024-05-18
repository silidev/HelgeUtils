"use strict";
/**
 * Updates: https://github.com/silidev/HelgeUtils/blob/main/HelgeUtils.ts
 *
 * HelgeUtils.ts V1.0
 * @description A collection of general utility functions not connected to a
 * specific project.
 *
 * Copyright by Helge Tobias Kosuch 2024 */
// import {Deepgram} from "../node_modules/@deepgram/sdk/dist/module/index.js";
var HelgeUtils;
(function (HelgeUtils) {
    let Exceptions;
    (function (Exceptions) {
        /**
         * This is just a template to inline. */
        Exceptions.defineCustom = () => {
            class MyCustomException extends Error {
                constructor(message) {
                    super(message);
                    this.name = "MyCustomException";
                }
            }
            HelgeUtils.suppressUnusedWarning(MyCustomException);
        };
        Exceptions.stackTrace = (e) => {
            let str = "";
            if (e instanceof Error) {
                str += ", Stack trace:\n";
                str += e.stack;
            }
            return str;
        };
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
        Exceptions.unhandledExceptionAlert = (e) => {
            let str = "Unhandled EXCEPTION! :" + e;
            str += Exceptions.stackTrace(e);
            /* Do NOT call console.trace() here because the stack trace
               of this place here is not helpful, but instead very
               confusing. */
            console.log(str);
            alert(str);
            return str;
        };
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
        Exceptions.swallowAll = (func) => {
            return (...args) => {
                try {
                    func(...args);
                }
                catch (e) {
                    // empty on purpose
                }
            };
        };
        /** Alias for swallowAll
         * @deprecated */
        Exceptions.catchAll = Exceptions.swallowAll;
        /** Alias for swallowAll
         * @deprecated */
        Exceptions.unthrow = Exceptions.swallowAll;
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
        Exceptions.callAndAlertAboutException = function (f) {
            try {
                f();
            }
            catch (error) {
                Exceptions.unhandledExceptionAlert(error);
                throw error;
            }
        };
        /**
         * Calls the function and swallows any exceptions. */
        Exceptions.callSwallowingExceptions = (f) => {
            try {
                f();
            }
            catch (err) {
                console.log("Ignored: ");
                console.log(err);
            }
        };
        /**
         * Displays an alert with the given message and throws the message as an exception.
         * TODO: Rework this. Seems not well thought through.
         * @param msg {String} */
        Exceptions.alertAndThrow = (...msg) => {
            console.trace();
            // alert(msg)
            throw new Error(...msg);
        };
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
        Exceptions.catchSpecificError = (errorType, callback, wantedErrorMsg = null) => (error) => {
            if (error instanceof errorType
                && (wantedErrorMsg === null && error.message === wantedErrorMsg)) {
                callback(error);
            }
            else {
                throw error;
            }
        };
    })(Exceptions = HelgeUtils.Exceptions || (HelgeUtils.Exceptions = {}));
    let Eval;
    (function (Eval) {
        var alertAndThrow = HelgeUtils.Exceptions.alertAndThrow;
        /**
         * Like "eval(...)" but a little safer and with better performance.
         *
         * The codeStr must be known to be from a secure source, because
         * injection of code through this is easy. This is intentional to
         * allow important features.
         * */
        Eval.evalBetter = function (codeStr, args) {
            if (Strings.isBlank(codeStr)) {
                alertAndThrow("evalBetter(): codeStr must not be empty");
            }
            return Eval.executeFunctionBody(" return (" + codeStr + ")", args);
        };
        /**
         * Somewhat like eval(...) but a little safer and with better performance.
         *
         * In contrast to {@link evalBetter} here you can and must use a return
         * statement if you want to return a value.
         *
         * Docs about the method: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
         *
         * @param functionBodyStr
         * @param args {object} An object with entities, which you want to give the code
         *        in the string access to.
         * */
        Eval.executeFunctionBody = (functionBodyStr, args) => Function(`
            "use strict"
            return function(args) {
                ` + functionBodyStr + `
            }
          `)()(args);
    })(Eval = HelgeUtils.Eval || (HelgeUtils.Eval = {}));
    let Types;
    (function (Types) {
        class TypeException extends Error {
            constructor(message) {
                super(message);
                this.name = "MyCustomException";
            }
        }
        Types.TypeException = TypeException;
        let SafeConversions;
        (function (SafeConversions) {
            SafeConversions.toNumber = (input) => {
                const result = parseFloat(input);
                if (isNaN(result)) {
                    throw new Error(`Not a number: "${input}"`);
                }
                return result;
            };
            SafeConversions.toBoolean = (resultAsString) => {
                switch (resultAsString.trim()) {
                    case "t":
                    case "true":
                        return true;
                    case "f":
                    case "false":
                        return false;
                    default:
                        throw new TypeException(`Not a boolean: "${resultAsString}"`);
                }
            };
        })(SafeConversions = Types.SafeConversions || (Types.SafeConversions = {}));
    })(Types = HelgeUtils.Types || (HelgeUtils.Types = {}));
    /** Returns true if the parameter is not undefined. */
    HelgeUtils.isDefined = (x) => {
        let u;
        // noinspection JSUnusedAssignment
        return x !== u;
    };
    /**
     * This is only useful in JS. Not needed in TS.
     *
     * createImmutableStrictObject({}).doesNotExist will
     * throw an error, in contrast to {}.whatEver, which
     * will not.
     */
    HelgeUtils.createImmutableStrictObject = (input) => {
        const handler = {
            get: function (target, prop) {
                if (prop in target) {
                    return target[prop];
                }
                else {
                    throw new Error("Property ${prop} does not" +
                        " exist on target object.");
                }
            },
            set: function (target, prop, value) {
                HelgeUtils.suppressUnusedWarning(target, prop, value);
                throw new Error("This object is immutable." +
                    " You cannot change ${prop}.");
            }
        };
        return new Proxy(input, handler);
    };
    let MarkDown;
    (function (MarkDown) {
        /** Returns the text of only the == ==-highlighted text. */
        MarkDown.extractHighlights = (input) => {
            const regex = /={2,3}([^=]+)={2,3}/g;
            let matches = [];
            let match;
            while ((match = regex.exec(input)) !== null) {
                matches.push(match[1].trim());
            }
            return matches;
        };
    })(MarkDown = HelgeUtils.MarkDown || (HelgeUtils.MarkDown = {}));
    /**
     * A function that does nothing. I use it to avoid "unused variable" warnings.
     *
     * Old name: nop
     *
     * @param args
     */
    HelgeUtils.suppressUnusedWarning = (...args) => {
        const flag = false;
        if (flag) {
            console.log(args);
        }
    };
    let Tests;
    (function (Tests) {
        /** Inline this function! */
        Tests.runTestsOnlyToday = () => {
            const RUN_TESTS = new Date().toISOString().slice(0, 10) === "2024-01-24";
            HelgeUtils.suppressUnusedWarning(RUN_TESTS);
        };
        // eslint-disable-next-line no-shadow
        Tests.assert = (condition, ...output) => {
            if (condition)
                // Everything is fine, just return:
                return;
            // It is NOT fine! Throw an error:
            console.log(...output);
            HelgeUtils.Exceptions.alertAndThrow(...output);
        };
        /**
         * V2 27.04.2024
         */
        // eslint-disable-next-line no-shadow
        Tests.assertEquals = (actual, expected, message = null) => {
            const expectedJson = JSON.stringify(expected);
            const actualJson = JSON.stringify(actual);
            if (actualJson !== expectedJson) {
                if (actual instanceof Date && expected instanceof Date
                    && actual.getTime() === expected.getTime())
                    return;
                console.log("*************** actual  :\n" + actualJson);
                console.log("*************** expected:\n" + expectedJson);
                if (typeof expected === 'string' && typeof actual === 'string') {
                    const expectedShortened = expected.substring(0, 20).replace(/\n/g, '');
                    const actualShortened = actual.substring(0, 20).replace(/\n/g, '');
                    HelgeUtils.Exceptions.alertAndThrow(message
                        || `Assertion failed: Actual: ${actualShortened}, but expected ${expectedShortened}`);
                }
                HelgeUtils.Exceptions.alertAndThrow(message
                    || `Assertion failed: Actual: ${expectedJson}, but expected ${actualJson}`);
            }
        };
    })(Tests = HelgeUtils.Tests || (HelgeUtils.Tests = {}));
    HelgeUtils.consoleLogTmp = (...args) => {
        args.forEach(arg => console.log(arg));
    };
    HelgeUtils.consoleLogTheDifference = (actual, expected) => {
        console.log("*************** actual  :\n" + actual);
        // @ts-expect-error
        if (1 === 0) {
            console.log("*************** expected:\n" + expected);
        }
        let diffCount = 0;
        // @ts-expect-error
        if (1 === 0) {
            for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
                if (expected[i] !== actual[i]) {
                    if (diffCount === 0) {
                        console.log("Difference at index " + i);
                        console.log(expected.substring(i, i + 80));
                        console.log(actual.substring(i, i + 80));
                    }
                    console.log(expected[i] + "," + actual[i]);
                    diffCount++;
                    if (diffCount > 8) {
                        break;
                    }
                }
            }
        }
    };
    var assert = Tests.assert;
    var assertEquals = Tests.assertEquals;
    HelgeUtils.testRemoveElements = () => {
        const tagsToRemove = ['tag1', 'tag2', 'tag3'];
        // Deep copy of tagsToRemove
        const testTagsArray = JSON.parse(JSON.stringify(tagsToRemove));
        //print('testTagsArray: '+testTagsArray.join(' ')+'<br>')
        testTagsArray.push('NotToBeRemoved');
        //print('removeElements test: '
        //  +removeElements(testTagsArray,tagsToRemove)+'<br>')
        assert(HelgeUtils.removeElements(testTagsArray, tagsToRemove).length === 1, "removeElements failed");
    };
    /**
     * removeElements
     *
     * @param input is an array of elements
     * @param toBeRemoved a list of elements which should be removed.
     *
     * @return *[] list with the elements removed
     */
    HelgeUtils.removeElements = (input, toBeRemoved) => {
        let output = [];
        for (let i = 0; i < input.length; i++) {
            let element = input[i];
            if (!toBeRemoved.includes(element)) {
                output.push(element);
            }
        }
        return output;
    };
    let Strings;
    (function (Strings) {
        /** Returns the index of the first occurrence of the given regex in the string.
         *
         * @param input
         * @param regex
         * @param startpos
         */
        Strings.regexIndexOf = (input, regex, startpos) => {
            const indexOf = input.substring(startpos || 0).search(regex);
            return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
        };
        /**
         * @deprecated Use regexIndexOf instead.
         * @see regexIndexOf
         */
        Strings.indexOfWithRegex = Strings.regexIndexOf;
        Strings.regexLastIndexOf = (input, regex, startpos) => {
            regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiline ? "m" : ""));
            if (typeof (startpos) == "undefined") {
                startpos = input.length;
            }
            else if (startpos < 0) {
                startpos = 0;
            }
            const stringToWorkWith = input.substring(0, startpos + 1);
            let lastIndexOf = -1;
            let nextStop = 0;
            let result;
            while ((result = regex.exec(stringToWorkWith)) != null) {
                lastIndexOf = result.index;
                regex.lastIndex = ++nextStop;
            }
            return lastIndexOf;
        };
        /**
         * @deprecated Use regexLastIndexOf instead.
         */
        Strings.lastIndexOfWithRegex = Strings.regexLastIndexOf;
        /**
         * Trim whitespace but leave a single newline at the end if there is
         * any whitespace that includes a newline.
         */
        Strings.trimExceptASingleNewlineAtTheEnd = (input) => {
            // Check for whitespace including a newline at the end
            if (/\s*\n\s*$/.test(input)) {
                // Trim and leave a single newline at the end
                return input.replace(/\s+$/, '\n');
            }
            else {
                // Just trim normally
                return input.trim();
            }
        };
        Strings.toUppercaseFirstChar = (input) => {
            if (input.length === 0)
                return input;
            const specialChars = {
                'ü': 'Ü',
                'ö': 'Ö',
                'ä': 'Ä'
            };
            const firstChar = input.charAt(0);
            return (specialChars[firstChar] || firstChar.toLocaleUpperCase()) + input.slice(1);
        };
        Strings.escapeRegExp = (str) => {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        };
        /**
         * text.substring(leftIndex, rightIndex) is the string between the delimiters. */
        Strings.runTests = function () {
            Strings.testRemoveEmojis();
            Strings.Whitespace.runTests();
        };
        Strings.removeEmojis = (str) => str.replace(/[^a-zA-Z0-9 _\-üöäÜÖÄß]/g, "");
        Strings.testRemoveEmojis = () => {
            const runTest = (input, expected) => {
                assertEquals(Strings.removeEmojis(input), expected, "testRemoveEmojis failed");
            };
            runTest("a👨‍👩‍👧‍👦b", "ab");
            runTest("Td🏗️", "Td");
        };
        /** Return a string representation of a number, with the leading zero removed.
         * Example: numToStr(0.5) returns ".5". */
        Strings.numToStr = (num) => num.toString().replace("0.", ".");
        Strings.tagsStringToArray = (input) => Strings.Whitespace.replaceWhitespaceStretchesWithASingleSpace(input).trim().split(" ");
        Strings.Whitespace = class WhitespaceClass {
            static runTests() {
                this.testRemoveLeadingWhitespace();
                this.testReplaceWhitespaceStretchesWithASingleSpace();
            }
            /*************
             * Replace each stretch of whitespace in a string with a single underscore.
             * Gotchas: This also removes leading and trailing whitespace.
             * For easier comparing in unit tests. */
            static replaceWhitespaceStretchesWithASingleUnderscore(inputString) {
                return inputString.replace(/[ \t]+/gm, '_');
            }
            static replaceTabAndSpaceStretchesWithASingleSpace(inputString) {
                return inputString.replace(/[ \t]+/gm, ' ');
            }
            /************* replaceWhitespaceStretchesWithASingleSpace
             * replace each stretch of whitespace in a string with a single space
             */
            static replaceWhitespaceStretchesWithASingleSpace(str) {
                return str.replace(/\s+/g, " ");
            }
            static testReplaceWhitespaceStretchesWithASingleSpace() {
                let str = "This   is \t\t\n\n\r  a  \t  string   with   multiple   spaces";
                let replaced = this.replaceWhitespaceStretchesWithASingleSpace(str);
                if (replaced === "This is a string with multiple spaces") {
                    // blank on purpose
                }
                else {
                    throw "testReplaceWhitespaceStretchesWithASingleSpace failed.";
                }
            }
            static standardizeLeadingWhitespace(inputString) {
                return WhitespaceClass.replaceLeadingWhitespace((" " + inputString).replace(/^/gm, " "), '      ');
            }
            static replaceLeadingWhitespace(inputString, replacement) {
                return inputString.replace(/^\s+/gm, replacement);
            }
            static removeLeadingWhitespace(inputString) {
                return WhitespaceClass.replaceLeadingWhitespace(inputString, '');
            }
            static testRemoveLeadingWhitespace() {
                const input = `
    This is a test.`;
                const expected = `This is a test.`;
                const result = this.removeLeadingWhitespace(input);
                if (result !== expected) {
                    console.log('testRemoveLeadingWhitespace failed');
                    HelgeUtils.consoleLogTheDifference(result, expected);
                    throw "testRemoveLeadingWhitespace failed";
                }
            }
            static removeAllSpaces(inputString) {
                return inputString.replace(/\s/g, '');
            }
        };
        /**
         * In the given template input string, replace all occurrences of ${key}
         * with the value of the key in the replacements object.
         * Example:
         * const input = "Hello ${name}, you are ${age} years old."
         * const replacements = { name: "John", age: 25 }
         * const result = formatString(input, replacements)
         * // result is now "Hello John, you are 25 years old." */
        Strings.formatString = (input, replacements) => input.replace(/\${(.*?)}/g, (_, key) => {
            return replacements[key];
        });
        Strings.isBlank = (input) => {
            if (!input) {
                return true;
            }
            return input.trim() === "";
        };
        /* As of 2023 this is not built into JS or TS. */
        Strings.isNotBlank = (input) => input.trim().length !== 0;
        Strings.removeLineBreaks = (input) => {
            if (!input) {
                return input;
            }
            return input.replace(/(\r\n|\n|\r)/gm, "");
        };
    })(Strings = HelgeUtils.Strings || (HelgeUtils.Strings = {}));
    /* Returns a random element of the given array */
    HelgeUtils.randomElementOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
    HelgeUtils.runTests = function () {
        HelgeUtils.testRemoveElements();
        HelgeUtils.DatesAndTimes.runTests();
        Strings.runTests();
    };
    let TTS;
    (function (TTS) {
        /**
         * Always fails with error code 400 :(
         *
         * https://platform.openai.com/docs/api-reference/audio/createSpeech
         */
        TTS.withOpenAi = async (input, apiKey) => {
            const formData = new FormData();
            formData.append("model", "tts-1"); // One of the available TTS models: tts-1 or tts-1-hd
            formData.append('input', input);
            formData.append('voice', "alloy"); //  Supported voices are alloy, echo, fable, onyx, nova, and shimmer. Previews of the voices are available in the Text to speech guide: https://platform.openai.com/docs/guides/text-to-speech/voice-options
            // formData.append('speed', ".5") // from 0.25 to 4.0
            console.log("apiKey==" + apiKey);
            const response = await fetch(
            // "https://corsproxy.io/?" + encodeURIComponent
            ("https://api.openai.com/v1/audio/speech"), {
                method: 'GET', // GET only for testing, must be POST later!
                // headers: {
                //   'Authorization': `Bearer ${apiKey}`,
                //   "Content-Type": "application/json"
                // },
                // body: formData
            });
            if (!response.ok) {
                const message = `Failed to fetch audio file: ${response.status} ${JSON.stringify(response.body)}`;
                console.log(message);
                throw new Error(message);
            }
            const audioBlob = await response.blob();
            const audioContext = new AudioContext();
            const audioSource = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
            const playSound = audioContext.createBufferSource();
            playSound.buffer = audioSource;
            playSound.connect(audioContext.destination);
            playSound.start();
        };
    })(TTS = HelgeUtils.TTS || (HelgeUtils.TTS = {}));
    HelgeUtils.memoize = (func) => {
        const cache = new Map();
        return (...args) => {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            else {
                const result = func(...args);
                cache.set(key, result);
                return result;
            }
        };
    };
    let Misc;
    (function (Misc) {
        /** This is NOT only for unit tests! */
        Misc.assertTypeEquals = (value, expectedType) => {
            const actual = typeof value;
            if (actual !== expectedType) {
                throw new Error(`Got type ${actual}, but expected type ${expectedType}/ toString()===${value.toString()}/ JSON===${JSON.stringify(value)}`);
            }
        };
        /** nullFilter
         *
         * Throws an exception if the input is null.
         *
         * I use "strictNullChecks": true to avoid bugs. Therefore, I need this
         * where that is too strict.
         *
         * Use example:
         * const elementWithId = (id: string) =>
         *   nullFilter<HTMLElement>(HtmlUtils.elementWithId, id)
         */
        // eslint-disable-next-line @typescript-eslint/ban-types
        Misc.nullFilter = (f, ...parameters) => {
            const untypedNullFilter = (input) => {
                if (input === null)
                    Exceptions.alertAndThrow(`Unexpected null value.`);
                return input;
            };
            return untypedNullFilter(f(...parameters));
        };
        //end of namespace Misc:
    })(Misc = HelgeUtils.Misc || (HelgeUtils.Misc = {}));
    /**
     * Source: https://stackoverflow.com/questions/17528749/semaphore-like-queue-in-javascript
     */
    let Net;
    (function (Net) {
        let OpenAi;
        (function (OpenAi) {
            let Test;
            (function (Test) {
                Test.testApiUp = async () => {
                    const url = "https://api.openai.com/v1/audio/speech";
                    assertEquals((await fetch(url))["type"], "invalid_request_error");
                };
            })(Test = OpenAi.Test || (OpenAi.Test = {}));
        })(OpenAi = Net.OpenAi || (Net.OpenAi = {}));
        //end of namespace Net:
    })(Net = HelgeUtils.Net || (HelgeUtils.Net = {}));
    let Debugging;
    (function (Debugging) {
        let DevConsoles;
        (function (DevConsoles) {
            let Eruda;
            (function (Eruda) {
                /**
                 * Often you should inline this function and load it before other scripts.
                 * */
                Eruda.load = () => {
                    // Import from here instead: HelgeLoadFirst.Debug.DevConsole.Eruda.load()
                };
            })(Eruda = DevConsoles.Eruda || (DevConsoles.Eruda = {}));
        })(DevConsoles = Debugging.DevConsoles || (Debugging.DevConsoles = {}));
    })(Debugging = HelgeUtils.Debugging || (HelgeUtils.Debugging = {}));
    class DatesAndTimesInternal {
        static Weekdays = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6
        };
        static pad = (n) => n < 10 ? '0' + n : n;
        static nextWeekdayLocalIsoDate(weekday, now = new Date()) {
            const currentDay = now.getDay();
            const daysUntilDesiredDay = (weekday - currentDay + 7) % 7 || 7;
            const desiredDayDate = new Date(now);
            desiredDayDate.setDate(now.getDate() + daysUntilDesiredDay);
            return desiredDayDate;
        }
        static isValidISODate(str) {
            const date = new Date(str);
            return this.isValidDate(date) && date.toISOString() === str;
        }
        static isValidDate(date) {
            return !isNaN(date.getTime());
        }
        static cutAfterMinutesFromISODate(isoDate) {
            return isoDate.slice(0, 16);
        }
        static cutAfterHourFromISODate(isoDate) {
            return isoDate.slice(0, 13);
        }
        static parseRelaxedIsoDate(input) {
            const isoTime = input.replace(',', 'T');
            const date = new Date(isoTime);
            return isNaN(date.getTime()) ? null : date;
        }
        static testParseRelaxedIsoDate() {
            const parse = this.parseRelaxedIsoDate;
            const expected = new Date('2022-01-01T00:00:00.000Z').toISOString();
            assertEquals(parse('2022-01-01').toISOString(), expected);
            assertEquals(parse('2022-01-01').toISOString(), expected);
            assert(parse('not a date') === null);
        }
        static year(date, twoDigitYear) {
            return (twoDigitYear ? date.getFullYear().toString().slice(-2) : date.getFullYear());
        }
        static date2yyyymmddDashedYearDigits(date, twoDigitYear) {
            return this.year(date, twoDigitYear)
                + '-'
                + this.twoDigitMonth(date)
                + '-'
                + this.twoDigitDay(date);
        }
        static day(date) {
            return date.getDate();
        }
        static month(date) {
            return date.getMonth() + 1;
        }
        static twoDigitDay(date) {
            return this.pad(this.day(date));
        }
        static twoDigitMonth(date) {
            return this.pad(this.month(date));
        }
        static date2ddmmyyPointed(date, twoDigitYear) {
            return ""
                + this.twoDigitDay(date)
                + '.'
                + this.twoDigitMonth(date)
                + '.'
                + this.year(date, twoDigitYear);
        }
        static date2dmyyPointed(date, twoDigitYear) {
            return ""
                + this.day(date)
                + '.'
                + this.month(date)
                + '.'
                + this.year(date, twoDigitYear);
        }
        /** Return a string representation of a date in the format YYYY-MM-DD.
         * Example: date2yyyymmddDashed(new Date(2022, 0, 1)) returns "2022-01-01". */
        static date2yyyymmddDashed(date) {
            return HelgeUtils.DatesAndTimes.date2yyyymmddDashedYearDigits(date, false);
        }
        static date2yymmddDashed(date) {
            return HelgeUtils.DatesAndTimes.date2yyyymmddDashedYearDigits(date, true);
        }
        static Timestamps = class {
            static yymmddDashed() {
                return HelgeUtils.DatesAndTimes.date2yymmddDashed(new Date());
            }
            static ddmmyyPointed() {
                return HelgeUtils.DatesAndTimes.date2dmyyPointed(new Date(), true);
            }
        };
        /**
         * Converts a Date object to an ISO 8601 formatted string using the local time zone.
         *
         * @param {Date} date - The Date object to be converted.
         * @returns {string} An ISO 8601 formatted date string in the local time zone.
         */
        static dateToLocalIsoDate(date) {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - offset * 60 * 1000);
            return localDate.toISOString().slice(0, -1);
        }
        static runTests() {
            this.testParseRelaxedIsoDate();
        }
    }
    HelgeUtils.DatesAndTimes = DatesAndTimesInternal;
})(HelgeUtils || (HelgeUtils = {}));
//# sourceMappingURL=HelgeUtils.js.map