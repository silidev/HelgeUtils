import {HelgeUtils} from './HelgeUtils.js'
import assertEquals = HelgeUtils.Tests.assertEquals

/**
 * text.substring(leftIndex, rightIndex) is the string between the delimiters. */
export class DelimiterSearch {
  constructor(public delimiter: string) {
  }
  public leftIndex(text: string, startIndex: number) {
    return DelimiterSearch.index(this.delimiter, text, startIndex, false)
  }
  public rightIndex(text: string, startIndex: number) {
    return DelimiterSearch.index(this.delimiter, text, startIndex, true)
  }
  /** If search backwards the position after the delimiter is */
  private static index(delimiter: string, text: string, startIndex: number, searchForward: boolean) {
    const searchBackward = !searchForward
    if (searchBackward) {
      if (startIndex === 0) return 0
      // If the starIndex is at the start of a delimiter we want to return the index of the start of the string before this delimiter:
      startIndex--
    }
    const step = searchForward ? 1 : -1
    for (let i = startIndex; searchForward ? i < text.length : i >= 0; i += step) {
      if (text.substring(i, i + delimiter.length) === delimiter) {
        return i
            + (searchForward ? 0 : delimiter.length)
      }
    }
    return searchForward ? text.length : 0
  }
  public static runTests = () => {
    this.testDelimiterSearch()
    this.testDeleteBetweenDelimiters()
  }
  private static testDelimiterSearch = () => {
    const delimiter = '---\n'
    const instance = new DelimiterSearch(delimiter)

    const runTest = (input: string, index: number, expected: string) =>
        assertEquals(input.substring(
                instance.leftIndex(input, index),
                instance.rightIndex(input, index)),
            expected)
    {
      const inputStr = "abc" + delimiter
      runTest(inputStr, 0, "abc")
      runTest(inputStr, 3, "abc")
      runTest(inputStr, 4, "")
      runTest(inputStr, 3+delimiter.length, "")
      runTest(inputStr, 3+delimiter.length+1, "")
    }
    {
      const inputStr =  delimiter + "abc"
      runTest(inputStr, 0, "")
      runTest(inputStr, delimiter.length, "abc")
      runTest(inputStr, delimiter.length+3, "abc")
    }
  }
  /** Deletes a note from the given text.
   * @param input - The text to delete from.
   * @param left - The index of the left delimiter.
   * @param right - The index of the right delimiter.
   * @param delimiter - The delimiter.
   * */
  public static deleteNote = (input: string, left: number, right: number, delimiter: string) => {
    const str1 = (input.substring(0, left) + input.substring(right)).replaceAll(delimiter+delimiter, delimiter)
    if (str1===delimiter+ delimiter) return ""
    if (str1.startsWith(delimiter)) return str1.substring(delimiter.length)
    if (str1.endsWith(delimiter)) return str1.substring(0, str1.length - delimiter.length)
    return str1
  }
  private static testDeleteBetweenDelimiters = () => {
    const delimiter = ')))---(((\n'
    const runTest = (cursorPosition: number, input: string, expected: string) => {
      const delimiterSearch = new DelimiterSearch(delimiter)
      const left = delimiterSearch.leftIndex(input, cursorPosition)
      const right = delimiterSearch.rightIndex(input, cursorPosition)
      assertEquals(DelimiterSearch.deleteNote(input, left, right, delimiter), expected)
    }
    runTest(0, "abc" + delimiter, "")
    runTest(delimiter.length, delimiter + "abc", "")
    runTest(delimiter.length, delimiter + "abc" + delimiter, "")
    runTest(1+delimiter.length, "0" + delimiter + "abc" + delimiter + "1",  "0"+delimiter+"1")
  }
}