// noinspection JSUnusedGlobalSymbols

/** Copyright by Helge Tobias Kosuch 2023
 *
 * Should be named DomUtils... but I am used to HtmlUtils.
 * */

// Merge help: The following lines must be commented out in the Project Anca:
/*
import {HelgeUtils} from "./HelgeUtils.js"

declare global {
  interface Window {
    getCaretCoordinates: (element: HTMLElement, position: number) => {
      top: number, left: number }
  }
}
*/
// Merge help end

import parseFloatWithNull = HelgeUtils.Conversions.parseFloatWithNull

// ***** Config ****
const globalDefaultExceptionHandler = true

const MAX_COOKIE_SIZE = 4096

namespace HtmlUtils { /* Putting this in a namespace is needed for my AnkiDroid project, which
 doesn't allow modules. */

  import memoize = HelgeUtils.memoize

  export namespace ErrorHandling {
    import Exceptions = HelgeUtils.Exceptions

    import unhandledExceptionAlert = Exceptions.unhandledExceptionAlert

    export namespace ExceptionHandlers {
      export const installGlobalDefault = () => {
        window.onerror = (message, source, lineNo, colNo, error) => {
          const errorMessage = `An error occurred: ${message}\nSource: ${source}\nLine: ${lineNo}\nColumn: ${colNo}\nError Object: ${error}`

          printError(
              unhandledExceptionAlert(error??errorMessage)
              /* unhandledExceptionAlert is sometimes executed twice here. I
               don't know why. The debugger didn't help. This shouldn't
               happen anyway. Don't invest more time. */
          )
          throw "Was handled by installGlobalDefault"
          // return true; // Prevents the default browser error handling
        }
      }

      if (globalDefaultExceptionHandler) {
        installGlobalDefault()
      }
    }

    /**
     * This outputs aggressively on top of everything to the user. */
    // eslint-disable-next-line no-shadow
    export const printError = (input: any) => {
      console.log(input)
      // alert(input)

      document.body.insertAdjacentHTML('afterbegin',
          `<div style="position: fixed; z-index: 9999; background-color: #000000; color:red;"> 
            <p style="font-size: 30px;">###### printError</p>
            <p style="font-size:18px;">${escapeHtml(input.toString())}</p>`
          + `########</div>`)
    }

    /**
     * This outputs gently. Might not be seen by the user.  */
    export const printDebug = (str: string, parentElement = document.body) => {
      if (!str) {
        printDebug("printDebug called with falsy str.")
        return
      }
      showToast(str.substring(0, 80))

      console.log(str)
      HelgeUtils.Exceptions.callSwallowingExceptions(() => {
        parentElement.insertAdjacentHTML('beforeend',
            `<div 
              style="z-index: 9999; background-color: #00000000; color:red;"> 
            <p style="font-size:18px;">${escapeHtml(str)}</p>`
            + `</div>`)
      })
    }
  }

  import printError = HtmlUtils.ErrorHandling.printError

  export const createDivElementFromHtml = (html: string) => {
    const tempElement = document.createElement('div')
    tempElement.innerHTML = html
    return tempElement
  }

  // ########## Blinking fast and slow ##########
  // https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow
  /**
   * .blinkingFast {
   *  animation: blink 1s linear infinite
   * }
   */
  export const blinkFast = (message: string) => `<span class="blinkingFast">${message}</span>`
  /**
   * .blinkingSlow {
   *  animation: blink 2s linear infinite
   * }
   */
  export const blinkSlow = (message: string) => `<span class="blinkingSlow">${message}</span>`


  export const elementWithId = memoize((id: string): HTMLElement | null => {
    return document.getElementById(id) as HTMLElement
  })

  export const elementWithIdNte = (id: string): HTMLElement => {
    const el = elementWithId(id)
    if (!el) {
      throw new Error(`Element with id ${id} not found`)
    }
    return el as HTMLElement
  }

  export const buttonWithId = elementWithId as (id: string) => HTMLButtonElement | null
  export const textAreaWithId = elementWithId as (id: string) => HTMLTextAreaElement | null
  export const inputElementWithId = elementWithId as (id: string) => HTMLInputElement | null

  /** These never return null. Instead, they throw a runtime error.
   * "Nte" in the name means "null throws exception".
   * Old name: NullFilter */
  export namespace NullThrowsException {
    import nullFilter = HelgeUtils.Misc.nullFilter
    /** @see NullThrowsException */
    export const querySelectorNte = (element: DocumentFragment, selector: string) => {
      return nullFilter<HTMLElement>(element.querySelector(selector))

    }
    /** @see NullThrowsException */
    export const elementWithIdNte = (id: string) =>
        nullFilter<HTMLElement>(HtmlUtils.elementWithId(id))
    /** @see NullThrowsException */
    export const buttonWithIdNte = (id: string) =>
        HtmlUtils.elementWithIdNte(id) as HTMLButtonElement
    /** @see NullThrowsException */
    export const inputElementWithIdNte = (id: string) =>
        HtmlUtils.elementWithIdNte(id) as HTMLInputElement
    /** @see NullThrowsException */
    export const textAreaWithIdNte = (id: string) =>
        HtmlUtils.elementWithIdNte(id) as HTMLTextAreaElement
  }

  // Merge help: The following lines must be commented out in the Project Anca:
  export namespace TextAreas {

    // eslint-disable-next-line no-shadow
    import textAreaWithId = HtmlUtils.NullThrowsException.textAreaWithIdNte
    import trimExceptASingleNewlineAtTheEnd = HelgeUtils.Strings.trimExceptASingleNewlineAtTheEnd
    import Strings = HelgeUtils.Strings
    import escapeRegExp = HelgeUtils.Strings.escapeRegExp
    // npm import textarea-caret:

    export class TextAreaWrapper {
      constructor(private textArea: HTMLTextAreaElement) {
      }
      public findWholeWordCaseInsensitiveAndSelect(search: string) {
        TextAreas.FindCaseInsensitiveAndSelect.wholeWord(this.textArea, search)
        return this
      }
      public appendTextAndPutCursorAfter(text: string) {
        TextAreas.appendTextAndCursor(this.textArea, text)
        return this
      }
      public append(text: string) {
        TextAreas.append(this.textArea, text)
        return this
      }
      public selectedText() {
        const start = this.textArea.selectionStart
        const end = this.textArea.selectionEnd
        return this.textArea.value.substring(start, end)
      }
      public setCursor(position: number) {
        TextAreas.setCursor(this.textArea, position)
        return this
      }
      public insertAndPutCursorAfter(addedText: string) {
        TextAreas.insertAndPutCursorAfter(this.textArea, addedText)
        return this
      }
      public getCursor() {
        return TextAreas.getCursor(this.textArea)
      }
      public setAutoSave(cookieName: string, handleError: (msg: string) => void, storage: BrowserStorage.BsProvider) {
        TextAreas.setAutoSave(cookieName, this.textArea.id, handleError, storage)
        return this
      }
      public value() {
        return this.textArea.value
      }
      public setValue(value: string) {
        this.textArea.value = value
        return this
      }
      public focus() {
        this.textArea.focus()
        return this
      }
      public setCursorAtEnd() {
        this.setCursor(this.textArea.value.length)
        return this
      }
      public trim() {
        this.textArea.value = trimExceptASingleNewlineAtTheEnd(this.textArea.value)
        return this
      }
      /**
       * @deprecated */
      public goToEnd() {
        return this.setCursorAtEnd()
      }
    }

    export const appendTextAndCursor = (textArea: HTMLTextAreaElement, text: string) => {
      append(textArea, text)
      setCursor(textArea, textArea.value.length)
    }
    export const append = (textArea: HTMLTextAreaElement, text: string) => {
      textArea.value += text
    }
    export const selectedText = (textArea: HTMLTextAreaElement) => {
      const start = textArea.selectionStart
      const end = textArea.selectionEnd
      return textArea.value.substring(start, end)
    }

    /**
     * Makes a text area element auto-save its content to a cookie after each modified
     * character (input event).
     * @param storageKey - The name of the cookie to store the text area content.
     * @param id - The ID of the text area element.
     * @param handleError - A function to call when an error occurs.
     * @param storage
     */
    export const setAutoSave = (storageKey: string, id: string, handleError: (msg: string) => void, storage: BrowserStorage.BsProvider) => {
      textAreaWithId(id).addEventListener('input', () => {
        const text = textAreaWithId(id).value
        try {
          storage.setString(storageKey, text)
        } catch (e) {
          handleError(`${storageKey}: Text area content exceeds 4095 characters. Content will not be saved.`)
        }
      })
    }

    export const getCursor = (textArea: HTMLTextAreaElement) => {
      return textArea.selectionStart
    }

    export const setCursor = (textArea: HTMLTextAreaElement, position: number) => {
      textArea.setSelectionRange(position, position)
    }

    /**
     * Inserts text at the cursor position in a text area. If something is
     * selected it will be overwritten. */
    export const insertAndPutCursorAfter = (textarea: HTMLTextAreaElement, addedText: string) => {

      if (!addedText)
        return

      const textBeforeSelection = textarea.value.substring(0, textarea.selectionStart)
      const textAfterSelection = textarea.value.substring(textarea.selectionEnd)

      setCursor(textarea, 0)
      textarea.value = textBeforeSelection + addedText + textAfterSelection
      setCursor(textarea, textBeforeSelection.length + addedText.length)
      textarea.focus()
    }

    export const scrollToEnd = (logTextArea: HTMLTextAreaElement) => {
      logTextArea.scrollTop = logTextArea.scrollHeight
    }

    /**
     * Find the next occurrence of a string in a text area and select it.
     *
     * It can also scroll the found occurrence into view, IF
     * script type="module" src="node_modules/textarea-caret/index.js">
     *   /script>
     * "^3.1.0" is included in the HTML file. */
    export namespace FindCaseInsensitiveAndSelect {
      const step2 = (cursor: number, textArea: HTMLTextAreaElement, target: string) => {
        if (cursor >= 0) {
          textArea.setSelectionRange(cursor, cursor + target.length)
        } else {
          // not found, start from the beginning
          setCursor(textArea, 0)
        }
        textArea.focus()

        // Scroll to selectionStart:
        {
          /** Needs
           * script type="module" src="node_modules/textarea-caret/index.js">
           *   /script>*/
          const getCaretCoordinates = window["getCaretCoordinates"]
          if (typeof getCaretCoordinates !== 'undefined') {
            textArea.scrollTop = getCaretCoordinates(textArea, textArea.selectionEnd).top
          }
        }
      }
      export const wholeWord = (textArea: HTMLTextAreaElement,
                                target: string) => {
        const regex = new RegExp(`\\b${escapeRegExp(target).toLowerCase()}\\b`)
        const cursor =
            Strings.regexIndexOf(textArea.value.toLowerCase(),regex, textArea.selectionEnd)
        step2(cursor, textArea, target)
      }
      export const normal = (textArea: HTMLTextAreaElement, target: string) => {
        const cursor =
            textArea.value.toLowerCase().indexOf(target, textArea.selectionEnd)
        step2(cursor, textArea, target)
      }
    }
  }
  // end of Merge help

  export namespace Media {
    export const releaseMicrophone = (stream: MediaStream) => {
      if (!stream) return
      stream.getTracks().forEach(track => track.stop())
    }

    /** Each instance will always be only one beep playing at any time. */
    export class Beep {
      private audioContext: AudioContext = new (window.AudioContext)()
      private oscillator: OscillatorNode | null = null
      private gainNode: GainNode | null = null

      /** This sometimes just doesn't play anything, I dont know why. */
      public start(frequency: number, duration = 300, volume = .5) {
        try {
          this.oscillator?.stop(); /* Stop any old still playing beeps. */
        } catch (error) {
          if (error instanceof DOMException && error.name === 'InvalidStateError') {
            // Ignore the error if the oscillator is already stopped
          } else {
            throw error
          }
        }
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = frequency;
        this.gainNode.gain.value = volume;

        this.oscillator.start(this.audioContext.currentTime);
        this.oscillator.stop(this.audioContext.currentTime + duration / 1000);
      }
      public stop() {
        this.oscillator?.stop();
      }
    }
    /* This is the default instance for beep which should override each other. */
    export const beep = new Beep()
  }

  export namespace BrowserStorage {
    export interface BsProvider {
      isAvailable(): boolean
      /** Delete all entries whose keys begin with prefix */
      clear(prefix: string): void
      getAllKeys(): Object
      setString(key: string, value: string | null): void
      getString(itemName: string): string | null
      getAndJsonParse<T>(name: string): T | null
      setJsonStringified(itemName: string, itemValue: unknown): void
      getNumber(name: string): number | null
      setNumber(name: string, value: number): void
      setDate(name: string, value: Date): void
      getDate(name: string): Date | null
      removeItem(name: string): void
      getBoolean(name: string): boolean
      setBoolean(name: string, value: boolean): void
    }
    export abstract class BsProviderExtras {
      abstract setString(itemName: string, itemValue: string): void
      abstract getString(name: string): string | null
      setJsonStringified(itemName: string, itemValue: unknown): void {
        this.setString(itemName, JSON.stringify(itemValue))
      }
      getAndJsonParse<T>(name: string): T | null {
        const item = this.getString(name)
        if (item) {
          try {
            return JSON.parse(item) as T
          } catch (e) {
            console.error('Error parsing JSON from localStorage', e)
          }
        }
        return null
      }
      getBoolean(name: string) {return this.getString(name)==="true"}
      setBoolean(name: string, value: boolean) {this.setString(name, value?"true":"false")}
      getNumber(name: string) {
        return parseFloatWithNull(this.getString(name))
      }
      setNumber(name: string, value: number) {
        this.setString(name,value.toString())
      }
      /** Untested */
      getDate(name: string): Date | null {
        const asString = this.getString(name)
        if (asString===null) {
          return null
        }
        return new Date(asString)
      }
      /** Untested */
      setDate(name: string, value: Date) {
        this.setString(name,value.toISOString())
      }
    }
    export class LocalStorage extends BsProviderExtras implements BsProvider {
      isAvailable(): boolean {
        return true

      }
      clear(prefix: string): void {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key)
          }
        })
      }
      getAllKeys(): Object {
        return Object.keys(localStorage)

      }
      /** Sets a local storage item with the given name and value.
       * @throws Error if the local storage item value exceeds 5242880 characters.*/
      setString(itemName: string, itemValue: string): void {
        localStorage.setItem(itemName, itemValue)

      }
      getString(name: string): string | null {
        return localStorage.getItem(name)

      }
      removeItem(name: string) {
        localStorage.removeItem(name)

      }
    }
    export namespace Cookies {
        /**
         * Sets a cookie with the given name and value.
         *
         * @throws Error if the cookie value exceeds 4095 characters.*/
      export const set = (cookieName: string, cookieValue: string) => {
        const expirationTime = new Date(Date.now() + 2147483647000).toUTCString()
        document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)};expires=${expirationTime};path=/`
          const message = `Cookie "${cookieName}"'s value exceeds maximum characters of ${MAX_COOKIE_SIZE}.`
          if (document.cookie.length > MAX_COOKIE_SIZE) {
            throw new Error(message)
          }
      }
      export const get = (name: string) => {
        let cookieArr = document.cookie.split(";")
        for (let i = 0; i < cookieArr.length; i++) {
          let cookiePair = cookieArr[i].split("=")
          if (name === cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1])
          }
        }
        return null
      }
    }
    export namespace Misc {
      import Switch = HelgeUtils.Types.Switch

      /** A mode whose status is stored to a persistent storage, e. g. localStorage. */
      export class StoredMode implements Switch {
        private _enabled: boolean
        /** key used in storage */
        private readonly _enabledKey: string
        constructor(_storageKey: string, private _storage: BsProvider, initialValue=false) {
          this._enabledKey = _storageKey+'._enabled'
          this._enabled = _storage.getAndJsonParse<boolean>(this._enabledKey) ?? initialValue
        }
        public enabled = () => {
          return this._enabled
        }
        public disabled = () => {
          return !this._enabled
        }
        private saveToStorage = () => {
          this._storage.setJsonStringified(this._enabledKey, this._enabled)
        }
        public enable = () => {
          this._enabled = true
          this.saveToStorage()
        }
        public disable = () => {
          this._enabled = false
          this.saveToStorage()
        }
        public toggle = () => {
          if (this._enabled) {
            this.disable()
            return
          }
          this.enable()
        }
      }
    }
  }
  /**
   * Known "problems": If the user clicks on the button multiple times in a row, the
   * checkmark will be appended multiple times. ... no time for that. Where possible just
   * use HtmlUtils.addClickListener(...).
   */
  export const signalClickToUser = (element: HTMLElement) => {
    const before = element.innerHTML
    element.innerHTML += "✔️"
    setTimeout(
        () => element.innerHTML = before
        , 500)
  }

  /**
   * Adds a click listener to a button that appends a checkmark to the button
   * text when clicked. */
  export const addClickListener = (buttonId: string,
                                   callback: () => void) => {
    const element = buttonWithId(buttonId)
    if (element === null) {
      printError(`Button with ID ${buttonId} not found.`)
      return
    }

    const initialHTML = element.innerHTML; // Read initial HTML from the button
    const checkmark = ' ✔️'; // Unicode checkmark

    element.addEventListener('click', () => {
      callback()
      element.innerHTML += checkmark; // Append checkmark to the button HTML
      setTimeout(() => {
        element.innerHTML = initialHTML; // Reset the button HTML after 2 seconds
      }, 500)
    })
  }

  export const scrollToBottom = () => {
    window.scrollBy(0, 100000)
  }

  export const escapeHtml = (input: string): string => {
    const element = document.createElement("div")
    element.innerText = input
    return element.innerHTML
  }

  /**
   # DOMException Read permission denied error
   you're encountering when calling navigator.clipboard.readText() is likely due to the permissions and security restrictions around accessing the clipboard in web browsers. Here are some key points to consider and potential solutions:
   User Interaction Required: Most modern browsers require a user-initiated action, like a click event, to access the clipboard. Make sure your code is triggered by such an action.
   Secure Context: Clipboard access is only allowed in a secure context (HTTPS), not on HTTP pages.
   Permissions: Depending on the browser, your site may need explicit permission from the user to access the clipboard.
   Browser Support: Ensure that the browser you are using supports the Clipboard API.
   Cross-Origin Restrictions: If your script is running in an iframe, it might be subject to cross-origin restrictions.
   */
  // eslint-disable-next-line no-shadow
  export namespace Clipboard {
    /** @deprecated */
    export const read = () => {
      throw new Error("Deprecated! Use navigator.clipboard.readText instead.")
    }
    /** @deprecated */
    export const write = () => {
      throw new Error("Deprecated! Use navigator.clipboard.readText instead.")
    }
  }

  /** @deprecated Inline this and replace the error handler with your own
   * error reporting. */
  export namespace clipboard {
    /** @deprecated Inline this and replace the error handler with your own
     * error reporting. */
    export const read = (f: (text: string) => void) => {
      navigator.clipboard.readText().then(text => {
        f(text)
      }).catch(err => {
        console.error('Failed to read clipboard contents: ', err)
        throw err
      })
      //end of namespace Misc:
    }

    /** @deprecated Rather use read() */
    export const readText = () => navigator.clipboard.readText()

  }

  /**
   * @deprecated Use copyToClipboard instead.
   * @param str
   */
  export const putIntoClipboard = (str: string) => {
    navigator.clipboard.writeText(str).then().catch(ErrorHandling.printError)
  }

  export const stripHtmlTags = (input: string): string => {
    return input.replace(/<\/?[^>]+(>|$)/g, "")
  }

  export const isMsWindows = () => {
    return navigator.userAgent.match(/Windows/i)
  }

  export namespace Menus {
    /** https://www.webcomponents.org/element/@vanillawc/wc-menu-wrapper */
    export namespace WcMenu {

      import elementWithId = NullThrowsException.elementWithIdNte

      export const close = (menuHeadingId: string) => {
        elementWithId(menuHeadingId).dispatchEvent(new CustomEvent('rootMenuClose'))
      }
      export const addItem = (menuHeadingId: string) => {
        return (id: string, menuFunction: () => void) => {
          HtmlUtils.addClickListener(id, () => {
            menuFunction()
            close(menuHeadingId)
          })
        }
      }
    }
  }
  // eslint-disable-next-line no-shadow
  export namespace Keyboard {
    /**
     * Inline this function!
     */
    export const addKeyboardBindings = () => {
      document.addEventListener('keyup', (event) => {
        //console.log(event.key, event.shiftKey, event.ctrlKey, event.altKey)
        if (event.key === 'X' && event.shiftKey && event.ctrlKey) {
          // Prevent default action to avoid any browser shortcut conflicts
          event.preventDefault()
          // Do something here!
        }
      })
    }
  }


  export namespace Styles {
    export const toggleDisplayNone = (element: HTMLElement, visibleDisplayStyle: string) => {
      if (element.style.display === "none") {
        element.style.display = visibleDisplayStyle
      } else {
        element.style.display = "none"
      }
    }
    /** If element is null, nothing happens, no error. */
    export const toggleDisplayNoneIfPossible = (element: HTMLElement | null,
        visibleDisplayStyle: string) => {
      if (!element) {
        return
      }
      toggleDisplayNone(element, visibleDisplayStyle)
    }
  }


  /**
   * showToast
   *
   * Often the project defines a project-specific showToast function.
   *
   * Search keywords: "toast message", "toast notification", "toast popup", "alert"
   *
   * @param message
   * @param durationMs
   */
  export const showToast = (message: string|null, durationMs = 1000) => {
    if (!message) return
    const alertBox = document.createElement("div")
    alertBox.classList.add("showToastMsg")

    /* Do NOT put this into the CSS. I want this to be portable.*/
    alertBox.style.cssText = `
      ;position: fixed
      ;top: 50%
      ;left: 50%
      ;transform: translateX(-50%)
      ;background-color: darkblue
      ;color: white
      ;padding: 10px
      ;border-radius: 5px
      ;z-index: 999999
    `
    alertBox.textContent = message
    document.body.appendChild(alertBox)
    console.log(message)

    setTimeout(() => {
      alertBox.remove()
    }, durationMs)
  }

  /**
   * @deprecated Use showToast instead. */
  export const alertAutoDismissing = showToast

  export namespace Misc {
    /** Offers a string or blob as a file to the user for download. */
    export const downloadOffer = (input: string | Blob, filename: string) => {
      let blob: Blob
      // If input is a string convert it to a Blob
      if (typeof input === 'string') {
        blob = new Blob([input], {type: 'text/plain'})
      } else {
        blob = input
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
    export const loadScript = (srcUri: string,
        afterLoad: ((this: GlobalEventHandlers, ev: Event) => any) | null) =>
    {
      const script = document.createElement('script')
      script.src = srcUri
      script.async = true
      script.onload = afterLoad
      document.head.appendChild(script)
    }
    export const removeBySelector = (doc: Document, selector: string) =>{
      doc.querySelectorAll(selector).forEach(e => e.remove())

    }

  }
}
