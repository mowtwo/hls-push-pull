export function buildFFHlsPusher(
  recorder: MediaRecorder,
  stream: MediaStream,
  options?: {
    segDuration?: number
    videoCodec?: string
    audioCodec?: string
    m3u8Name?: string
  }
) {
  const {
    segDuration = 1,
    videoCodec = 'libx264',
    audioCodec = 'aac'
  } = options ?? {}

  let segIndex = 0

  const stop = () => {
    recorder.stop()
    stream.getTracks().forEach(tracker => tracker.stop())
  }

  const start = async (startHooks?: {
    recorderStop?: () => void
    recorderDenied?: (start: () => Promise<void>, recorder: MediaRecorder, stream: MediaStream) => Promise<void> | void
    pushSeg?: (data: Uint8Array, index: number, options?: {
      segDuration?: number
      videoCodec?: string
      audioCodec?: string
    }) => Promise<void> | void
  }) => {

    recorder.onstop = startHooks?.recorderStop!


    recorder.ondataavailable = async e => {
      try {
        const blob = e.data

        if (blob.size <= 0) {
          return
        }

        const data = new Uint8Array(await new Blob([blob], {
          type: 'video/webm; codecs=vp8,opus'
        }).arrayBuffer())

        await startHooks?.pushSeg?.(
          data, segIndex,
          {
            segDuration,
            audioCodec,
            videoCodec
          }
        )
      } catch (err) {
      } finally {
        segIndex++
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
