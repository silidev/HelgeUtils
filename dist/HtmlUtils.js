"use strict";
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
const MAX_COOKIE_SIZE = 4096;
var HtmlUtils;
(function (HtmlUtils) {
    var memoize = HelgeUtils.memoize;
    let ErrorHandling;
    (function (ErrorHandling) {
        var Exceptions = HelgeUtils.Exceptions;
        var unhandledExceptionAlert = Exceptions.unhandledExceptionAlert;
        let ExceptionHandlers;
        (function (ExceptionHandlers) {
            ExceptionHandlers.installGlobalDefault = () => {
                window.onerror = (message, source, lineNo, colNo, error) => {
                    const errorMessage = `An error occurred: ${message}\nSource: ${source}\nLine: ${lineNo}\nColumn: ${colNo}\nError Object: ${error}`;
                    ErrorHandling.printError(unhandledExceptionAlert(error ?? errorMessage)
                    /* unhandledExceptionAlert is sometimes executed twice here. I
                     don't know why. The debugger didn't help. This shouldn't
                     happen anyway. Don't invest more time. */
                    );
                    return true; // Prevents the default browser error handling
                };
            };
        })(ExceptionHandlers = ErrorHandling.ExceptionHandlers || (ErrorHandling.ExceptionHandlers = {}));
        /**
         * This outputs aggressively on top of everything to the user. */
        // eslint-disable-next-line no-shadow
        ErrorHandling.printError = (input) => {
            console.log(input);
            // alert(input)
            document.body.insertAdjacentHTML('afterbegin', `<div style="position: fixed; z-index: 9999; background-color: #000000; color:red;"> 
            <p style="font-size: 30px;">###### printError</p>
            <p style="font-size:18px;">${HtmlUtils.escapeHtml(input.toString())}</p>`
                + `########</div>`);
        };
        /**
         * This outputs gently. Might not be seen by the user.  */
        ErrorHandling.printDebug = (str, parentElement = document.body) => {
            HtmlUtils.showToast(str.substring(0, 80));
            console.log(str);
            HelgeUtils.Exceptions.callSwallowingExceptions(() => {
                parentElement.insertAdjacentHTML('beforeend', `<div 
              style="z-index: 9999; background-color: #00000000; color:red;"> 
            <p style="font-size:18px;">${HtmlUtils.escapeHtml(str)}</p>`
                    + `</div>`);
            });
        };
    })(ErrorHandling = HtmlUtils.ErrorHandling || (HtmlUtils.ErrorHandling = {}));
    var printError = HtmlUtils.ErrorHandling.printError;
    HtmlUtils.createFragmentFromHtml = (html) => {
        const fragment = document.createDocumentFragment();
        {
            const tempElement = document.createElement('div');
            tempElement.innerHTML = html;
            while (tempElement.firstChild) {
                fragment.appendChild(tempElement.firstChild);
            }
        }
        return fragment;
    };
    // ########## Blinking fast and slow ##########
    // https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow
    /**
     * .blinkingFast {
     *  animation: blink 1s linear infinite
     * }
     */
    HtmlUtils.blinkFast = (message) => `<span class="blinkingFast">${message}</span>`;
    /**
     * .blinkingSlow {
     *  animation: blink 2s linear infinite
     * }
     */
    HtmlUtils.blinkSlow = (message) => `<span class="blinkingSlow">${message}</span>`;
    HtmlUtils.elementWithId = memoize((id) => {
        return document.getElementById(id);
    });
    HtmlUtils.buttonWithId = HtmlUtils.elementWithId;
    HtmlUtils.textAreaWithId = HtmlUtils.elementWithId;
    HtmlUtils.inputElementWithId = HtmlUtils.elementWithId;
    /** These never return null. Instead, they throw a runtime error. */
    let NeverNull;
    (function (NeverNull) {
        var nullFilter = HelgeUtils.Misc.nullFilter;
        /** @see NeverNull */
        NeverNull.elementWithId = (id) => nullFilter(HtmlUtils.elementWithId, id);
        /** @see NeverNull */
        NeverNull.buttonWithId = (id) => nullFilter(HtmlUtils.buttonWithId, id);
        /** @see NeverNull */
        NeverNull.inputElementWithId = (id) => nullFilter(HtmlUtils.inputElementWithId, id);
        /** @see NeverNull */
        NeverNull.textAreaWithId = (id) => nullFilter(HtmlUtils.textAreaWithId, id);
    })(NeverNull = HtmlUtils.NeverNull || (HtmlUtils.NeverNull = {}));
    // Merge help: The following lines must be commented out in the Project Anca:
    // end of Merge help
    let Media;
    (function (Media) {
        Media.releaseMicrophone = (stream) => {
            if (!stream)
                return;
            stream.getTracks().forEach(track => track.stop());
        };
    })(Media = HtmlUtils.Media || (HtmlUtils.Media = {}));
    let BrowserStorage;
    (function (BrowserStorage) {
        let LocalStorageVerified;
        (function (LocalStorageVerified) {
            LocalStorageVerified.set = (itemName, itemValue) => {
                LocalStorage.set(itemName, itemValue);
                // console.log(`itemValue: ${itemValue.length}`)
                const reread = LocalStorage.get(itemName);
                // console.log(`reread: ${reread?.length}`)
                if (reread !== itemValue) {
                    throw new Error(`Local storage item "${itemName}"'s was not stored correctly!`);
                }
            };
            LocalStorageVerified.get = (name) => {
                return LocalStorage.get(name);
            };
        })(LocalStorageVerified = BrowserStorage.LocalStorageVerified || (BrowserStorage.LocalStorageVerified = {}));
        let LocalStorage;
        (function (LocalStorage) {
            /**
             * Sets a local storage item with the given name and value.
             *
             * @throws Error if the local storage item value exceeds 5242880 characters.*/
            LocalStorage.set = (itemName, itemValue) => {
                localStorage.setItem(itemName, itemValue);
            };
            LocalStorage.get = (name) => {
                return localStorage.getItem(name);
            };
        })(LocalStorage = BrowserStorage.LocalStorage || (BrowserStorage.LocalStorage = {}));
        let Cookies;
        (function (Cookies) {
            /**
             * Sets a cookie with the given name and value.
             *
             * @throws Error if the cookie value exceeds 4095 characters.*/
            Cookies.set = (cookieName, cookieValue) => {
                const expirationTime = new Date(Date.now() + 2147483647000).toUTCString();
                document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)};expires=${expirationTime};path=/`;
                const message = `Cookie "${cookieName}"'s value exceeds maximum characters of ${MAX_COOKIE_SIZE}.`;
                if (document.cookie.length > MAX_COOKIE_SIZE) {
                    throw new Error(message);
                }
            };
            Cookies.get = (name) => {
                let cookieArr = document.cookie.split(";");
                for (let i = 0; i < cookieArr.length; i++) {
                    let cookiePair = cookieArr[i].split("=");
                    if (name === cookiePair[0].trim()) {
                        return decodeURIComponent(cookiePair[1]);
                    }
                }
                return null;
            };
        })(Cookies = BrowserStorage.Cookies || (BrowserStorage.Cookies = {}));
    })(BrowserStorage = HtmlUtils.BrowserStorage || (HtmlUtils.BrowserStorage = {}));
    /**
     * Known "problems": If the user clicks on the button multiple times in a row, the checkmark will
     * be appended multiple times. ... no time for that. Where possible just use HtmlUtils.addClickListener(...).
     */
    HtmlUtils.signalClickToUser = (element) => {
        const before = element.innerHTML;
        element.innerHTML += "✔️";
        setTimeout(() => element.innerHTML = before, 500);
    };
    /**
     * Adds a click listener to a button that appends a checkmark to the button
     * text when clicked. */
    HtmlUtils.addClickListener = (buttonId, callback) => {
        const element = HtmlUtils.buttonWithId(buttonId);
        if (element === null) {
            printError(`Button with ID ${buttonId} not found.`);
            return;
        }
        const initialHTML = element.innerHTML; // Read initial HTML from the button
        const checkmark = ' ✔️'; // Unicode checkmark
        element.addEventListener('click', () => {
            callback();
            element.innerHTML += checkmark; // Append checkmark to the button HTML
            setTimeout(() => {
                element.innerHTML = initialHTML; // Reset the button HTML after 2 seconds
            }, 500);
        });
    };
    HtmlUtils.scrollToBottom = () => {
        window.scrollBy(0, 100000);
    };
    HtmlUtils.escapeHtml = (input) => {
        const element = document.createElement("div");
        element.innerText = input;
        return element.innerHTML;
    };
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
    let Clipboard;
    (function (Clipboard) {
        /** @deprecated */
        Clipboard.read = () => {
            throw new Error("Deprecated! Use navigator.clipboard.readText instead.");
        };
        /** @deprecated */
        Clipboard.write = () => {
            throw new Error("Deprecated! Use navigator.clipboard.readText instead.");
        };
    })(Clipboard = HtmlUtils.Clipboard || (HtmlUtils.Clipboard = {}));
    /** @deprecated Inline this and replace the error handler with your own
     * error reporting. */
    let clipboard;
    (function (clipboard) {
        /** @deprecated Inline this and replace the error handler with your own
         * error reporting. */
        clipboard.read = (f) => {
            navigator.clipboard.readText().then(text => {
                f(text);
            }).catch(err => {
                console.error('Failed to read clipboard contents: ', err);
                throw err;
            });
            //end of namespace Misc:
        };
        /** @deprecated Rather use read() */
        clipboard.readText = () => navigator.clipboard.readText();
    })(clipboard = HtmlUtils.clipboard || (HtmlUtils.clipboard = {}));
    /**
     * @deprecated Use copyToClipboard instead.
     * @param str
     */
    HtmlUtils.putIntoClipboard = (str) => {
        navigator.clipboard.writeText(str).then().catch(ErrorHandling.printError);
    };
    HtmlUtils.stripHtmlTags = (input) => {
        return input.replace(/<\/?[^>]+(>|$)/g, "");
    };
    HtmlUtils.isMsWindows = () => {
        return navigator.userAgent.match(/Windows/i);
    };
    let Menus;
    (function (Menus) {
        /** https://www.webcomponents.org/element/@vanillawc/wc-menu-wrapper */
        let WcMenu;
        (function (WcMenu) {
            var elementWithId = NeverNull.elementWithId;
            WcMenu.close = (menuHeadingId) => {
                elementWithId(menuHeadingId).dispatchEvent(new CustomEvent('rootMenuClose'));
            };
            WcMenu.addItem = (menuHeadingId) => {
                return (id, menuFunction) => {
                    HtmlUtils.addClickListener(id, () => {
                        menuFunction();
                        WcMenu.close(menuHeadingId);
                    });
                };
            };
        })(WcMenu = Menus.WcMenu || (Menus.WcMenu = {}));
    })(Menus = HtmlUtils.Menus || (HtmlUtils.Menus = {}));
    // eslint-disable-next-line no-shadow
    let Keyboard;
    (function (Keyboard) {
        /**
         * Inline this function!
         */
        Keyboard.addKeyboardBindings = () => {
            document.addEventListener('keyup', (event) => {
                //console.log(event.key, event.shiftKey, event.ctrlKey, event.altKey)
                if (event.key === 'X' && event.shiftKey && event.ctrlKey) {
                    // Prevent default action to avoid any browser shortcut conflicts
                    event.preventDefault();
                    // Do something here!
                }
            });
        };
    })(Keyboard = HtmlUtils.Keyboard || (HtmlUtils.Keyboard = {}));
    let Styles;
    (function (Styles) {
        Styles.toggleDisplayNone = (element, visibleDisplayStyle) => {
            if (element.style.display === "none") {
                element.style.display = visibleDisplayStyle;
            }
            else {
                element.style.display = "none";
            }
        };
    })(Styles = HtmlUtils.Styles || (HtmlUtils.Styles = {}));
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
    HtmlUtils.showToast = (message, duration = 500) => {
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
  `;
        alertBox.textContent = message;
        document.body.appendChild(alertBox);
        setTimeout(() => {
            alertBox.remove();
        }, duration);
    };
    /**
     * @deprecated Use showToast instead. */
    HtmlUtils.alertAutoDismissing = HtmlUtils.showToast;
    let Misc;
    (function (Misc) {
        /** Offers a string or blob as a file to the user for download. */
        Misc.downloadOffer = (input, filename) => {
            let blob;
            // If input is a string convert it to a Blob
            if (typeof input === 'string') {
                blob = new Blob([input], { type: 'text/plain' });
            }
            else {
                blob = input;
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };
        Misc.loadScript = (srcUri, afterLoad) => {
            const script = document.createElement('script');
            script.src = srcUri;
            script.async = true;
            script.onload = afterLoad;
            document.head.appendChild(script);
        };
    })(Misc = HtmlUtils.Misc || (HtmlUtils.Misc = {}));
})(HtmlUtils || (HtmlUtils = {}));
//# sourceMappingURL=HtmlUtils.js.map