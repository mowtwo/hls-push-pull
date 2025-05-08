import type { FFmpeg, LogEvent } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export function buildFFHlsPusher(
  ffmpeg: FFmpeg,
  recorder: MediaRecorder,
  stream: MediaStream,
  options?: {
    segDuration?: number
    videoCodec?: string
    audioCodec?: string
    m3u8Name?: string
    ffmpegLog?: (logMessage: string, type: string) => void
  }
) {
  const {
    segDuration = 1,
    videoCodec = 'libx264',
    audioCodec = 'acc',
    m3u8Name = 'index',
    ffmpegLog
  } = options ?? {}

  let segIndex = 0

  const ffArgs = [
    '-c:v', videoCodec,
    '-c:a', audioCodec,
    '-f', 'hls',
    '-hls_time', segDuration.toString(),
    '-hls_list_size', '0',
    '-hls_flags', 'append_list+omit_endlist'
  ]

  const mergeArgs = (input: string, output: string) => {
    return [
      '-i', input,
      ...ffArgs,
      output
    ]
  }

  const ffLogFn = (log: LogEvent) => {
    if (typeof ffmpegLog === 'function') {
      ffmpegLog(log.message, log.type)
    }
  }

  const stop = () => {
    ffmpeg.off('log', ffLogFn)
    recorder.stop()
    stream.getTracks().forEach(tracker => tracker.stop())
  }

  const start = async (startHooks?: {
    ffmpegMustLoad?: (ffmpeg: FFmpeg) => Promise<void> | void
    recorderStop?: () => void
    recorderDenied?: (start: () => Promise<void>, recorder: MediaRecorder, stream: MediaStream) => Promise<void> | void
    transformError?: (error: Error) => void
    pushPlayList?: (data: Uint8Array, name: string) => Promise<void> | void
    pushSeg?: (data: Uint8Array, name: string) => Promise<void> | void
    cleanupError?: (
      segName: string,
      tsName: string
    ) => void
  }) => {
    if (!ffmpeg.loaded) {
      await startHooks?.ffmpegMustLoad?.(ffmpeg)
    }

    ffmpeg.on('log', ffLogFn)

    recorder.onstop = startHooks?.recorderStop!


    recorder.ondataavailable = async e => {
      const segName = `input${segIndex}.webm`
      const tsName = `${m3u8Name}${segIndex}.ts`
      const playlistName = `${m3u8Name}.m3u8`
      try {
        const blob = e.data

        await ffmpeg.writeFile(segName, await fetchFile(blob))

        console.log('开始转换',segName)

        await ffmpeg.exec(
          mergeArgs(
            segName,
            playlistName
          )
        )

        const playlist = await ffmpeg.readFile(playlistName)

        const tsData = await ffmpeg.readFile(tsName)

        await startHooks?.pushPlayList?.(playlist as Uint8Array, playlistName)
        await startHooks?.pushSeg?.(tsData as Uint8Array, tsName)
      } catch (err) {
        if (err instanceof Error) {
          startHooks?.transformError?.(err)
        } else {
          startHooks?.transformError?.(new Error(String(err)))
        }
      } finally {
        try {
          await ffmpeg.deleteFile(segName)
          await ffmpeg.deleteFile(tsName)
        } catch {
          startHooks?.cleanupError?.(segName, tsName)
        } finally {
          segIndex++
        }
      }
    }

    try {
      recorder.start(segDuration * 1000)
    } catch {
      await startHooks?.recorderDenied?.(async () => {
        recorder.start(segDuration * 1000)
      }, recorder, stream)
    }


    return stop
  }

  return {
    start, stop
  }
}
