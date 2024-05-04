// noinspection JSUnusedGlobalSymbols

/** Copyright by Helge Tobias Kosuch 2023
 *
 * Should be named DomUtils... but I am used to HtmlUtils.
 * */
import {HelgeUtils} from "./HelgeUtils.js"

declare global {
  interface Window {
    getCaretCoordinates: (element: HTMLElement, position: number) => {
      top: number, left: number }
  }
}

const MAX_COOKIE_SIZE = 4096

export namespace HtmlUtils {

  const memoize = HelgeUtils.memoize

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
    const element = document.getElementById(id);
    if (element === null) {
      printError(`Element with ID ${id} not found.`);
      return null;
    }
    return element as HTMLElement
  })

  export const buttonWithId = elementWithId as (id: string) => HTMLButtonElement | null
  export const textAreaWithId = elementWithId as (id: string) => HTMLTextAreaElement | null
  export const inputElementWithId = elementWithId as (id: string) => HTMLInputElement | null

  /** These never return null. Instead, they throw a runtime error. */
  export namespace NeverNull {
    import nullFilter = HelgeUtils.Misc.nullFilter

    export const elementWithId = (id: string) =>
        nullFilter<HTMLElement>(HtmlUtils.elementWithId, id)
    export const buttonWithId = (id: string) =>
        nullFilter<HTMLButtonElement>(HtmlUtils.buttonWithId, id)
    export const inputElementWithId = (id: string) =>
        nullFilter<HTMLInputElement>(HtmlUtils.inputElementWithId, id)
    export const textAreaWithId = (id: string) =>
        nullFilter<HTMLTextAreaElement>(HtmlUtils.textAreaWithId, id)
  }


  export namespace TextAreas {

    import textAreaWithId = HtmlUtils.NeverNull.textAreaWithId
    import trimExceptASingleNewlineAtTheEnd = HelgeUtils.Strings.trimExceptASingleNewlineAtTheEnd
    import Strings = HelgeUtils.Strings;
    // npm import textarea-caret:

    export class TextAreaWrapper {
      constructor(private textArea: HTMLTextAreaElement) {
      }

      public findAndSelect(search: string) {
        TextAreas.findAndSelect(this.textArea, search)
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
     * Makes a text area element auto-save its content to a cookie after each modified character (input event).
     * @param storageKey - The name of the cookie to store the text area content.
     * @param id - The ID of the text area element.
     * @param handleError - A function to call when an error occurs.
     * @param storage
     */
    export const setAutoSave = (storageKey: string, id: string, handleError: (msg: string) => void, storage: BrowserStorage.BsProvider) => {
      textAreaWithId(id).addEventListener('input', () => {
        const text = textAreaWithId(id).value
        try {
          storage.set(storageKey, text)
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
     * "^3.1.0" is included in the HTML file.
     * */
    export const findAndSelect = (textArea: HTMLTextAreaElement,
                                  target: string) => {
      const regex = new RegExp(`\\b${target.toLowerCase()}\\b`);
      const cursor = Strings.regexIndexOf(textArea.value.toLowerCase(),
          regex,
          textArea.selectionEnd);
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
  }

  export namespace Media {
    export const releaseMicrophone = (stream: MediaStream) => {
      if (!stream) return
      stream.getTracks().forEach(track => track.stop())
    }
  }

  export namespace BrowserStorage {

    export interface BsProvider {
      set: (key: string, value: string) => void
      get: (key: string) => string | null
    }

    export namespace LocalStorageVerified {
      export const set = (itemName: string, itemValue: string) => {
        LocalStorage.set(itemName, itemValue)
        // console.log(`itemValue: ${itemValue.length}`)
        const reread = LocalStorage.get(itemName);
        // console.log(`reread: ${reread?.length}`)
        if (reread !== itemValue) {
          throw new Error(`Local storage item "${itemName}"'s was not stored correctly!`)
        }
      }
      export const get = (name: string) => {
        return LocalStorage.get(name)
      }
    }

    export namespace LocalStorage {
      /**
       * Sets a local storage item with the given name and value.
       *
       * @throws Error if the local storage item value exceeds 5242880 characters.*/
      export const set = (itemName: string, itemValue: string) => {
        localStorage.setItem(itemName, itemValue)
      }

      export const get = (name: string) => {
        return localStorage.getItem(name)
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
  }
  /**
   * Known "problems": If the user clicks on the button multiple times in a row, the checkmark will
   * be appended multiple times. ... no time for that. Where possible just use HtmlUtils.addClickListener(...).
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
      printError(`Element with ID ${buttonId} not found.`)
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

  export namespace ErrorHandling {
    import Exceptions = HelgeUtils.Exceptions
    import callSwallowingExceptions = Exceptions.callSwallowingExceptions
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
          return true; // Prevents the default browser error handling
        }
      }
    }

  /**
     * Should be named "outputError" because it uses alert and console.log, but
     * I am used to "printError".
   * This outputs aggressively on top of everything to the user. */
    export const printError = (input: any) => {
      console.log(input)
      alert(input)

      callSwallowingExceptions(() => {
      document.body.insertAdjacentHTML('afterbegin',
          `<div 
              style="position: fixed; z-index: 9999; background-color: #000000; color:red;"> 
            <p style="font-size: 30px;">###### printDebug</p>
            <p style="font-size:18px;">${escapeHtml(input.toString())}</p>`
          + `########</div>`)
    })
  }

  /**
   * This outputs gently. Might not be seen by the user.  */
  export const printDebug = (str: string, parentElement = document.body) => {
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

  export const printDebug = ErrorHandling.printDebug
  export const printError = ErrorHandling.printError

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
  export namespace Clipboard {
    /** @deprecated */
    export const read = () => {
      throw new Error("Deprecated! Use navigator.clipboard.readText instead.");
    }
    /** @deprecated */
    export const write = () => {
      throw new Error("Deprecated! Use navigator.clipboard.readText instead.");
    }
  }

  /** @deprecated Inline this and replace the error handler with your own
   * error reporting. */
  export namespace clipboard {
    /** @deprecated Inline this and replace the error handler with your own
     * error reporting. */
    export const read = (f: (text: string) => void) => {
      navigator.clipboard.readText().then(text => {
        f(text);
      }).catch(err => {
        console.error('Failed to read clipboard contents: ', err);
        throw err
      })
      //end of namespace Misc:
    }

    /** @deprecated Rather use read() */
    export const readText = () => navigator.clipboard.readText();

    export const writeText = (text: string) => navigator.clipboard.writeText(text);
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
      import elementWithId = NeverNull.elementWithId

      export const close = (menuHeadingId: string) => {
        elementWithId(menuHeadingId).dispatchEvent(new CustomEvent('rootMenuClose'))
      };
      export const addItem = (menuHeadingId: string) => {
        return (id: string, menuFunction: () => void) => {
          HtmlUtils.addClickListener(id, () => {
            menuFunction()
            close(menuHeadingId);
          })
        }
      }
    }
  }

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
    export const toggleDisplayNone = (element: HTMLElement, visibleDisplayStyle = "block") => {
      if (element.style.display === "none") {
        element.style.display = visibleDisplayStyle
      } else {
        element.style.display = "none"
      }
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
   * @param duration
   */
  export const showToast = (message: string, duration = 500) => {
    const alertBox = document.createElement("div");

    alertBox.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translateX(-50%);
    background-color: lightblue;
    padding: 10px;
    border-radius: 5px;
    z-index: 999999;
  `
    alertBox.textContent = message
    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.remove();
    }, duration);
  }

  /**
   * @deprecated Use showToast instead. */
  export const alertAutoDismissing = showToast

  export namespace Misc {
    export const loadScript = (srcUri: string,
        afterLoad: ((this: GlobalEventHandlers, ev: Event) => any) | null
        ) =>
    {
      const script = document.createElement('script')
      script.src = srcUri
      script.async = true
      script.onload = afterLoad
      document.head.appendChild(script)
    }
  }
}
