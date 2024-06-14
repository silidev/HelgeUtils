import {HelgeUtils} from './HelgeUtils.js'
import suppressUnusedWarning = HelgeUtils.suppressUnusedWarning
// import {Deepgram} from "../node_modules/@deepgram/sdk/dist/module/index.js"

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

