'use client'

import {
  Camera,
  Download,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Settings,
  Subtitles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const QUALITY_OPTIONS = [
  {
    name: 'Auto',
    filter: 'filter-none',
  },
  {
    name: '720p',
    filter: 'contrast-100 saturate-100 brightness-100',
  },
  {
    name: '1080p',
    filter: 'contrast-105 saturate-105 brightness-105',
  },
  {
    name: '2K',
    filter: 'contrast-110 saturate-105 brightness-105',
  },
  {
    name: '4K',
    filter: 'contrast-125 saturate-110 brightness-105',
  },
  {
    name: '5K',
    filter: 'contrast-125 saturate-125 brightness-105',
  },
  {
    name: '6K',
    filter: 'contrast-150 saturate-125 brightness-110',
  },
  {
    name: '7K',
    filter: 'contrast-150 saturate-150 brightness-110',
  },
  {
    name: '8K',
    filter: 'contrast-175 saturate-150 brightness-110',
  },
]

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export default function VideoPlayer({ src, poster, title = 'Video', subtitle }) {
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const progressRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [quality, setQuality] = useState(QUALITY_OPTIONS[0])

  const [speed, setSpeed] = useState(1)
  const [showSettings, setShowSettings] = useState(false)

  const [fullscreen, setFullscreen] = useState(false)
  const [loop, setLoop] = useState(false)

  const [showControls, setShowControls] = useState(true)

  const controlsTimer = useRef(null)

  /* ---------------- PLAY / PAUSE ---------------- */

  const togglePlay = async () => {
    const video = videoRef.current

    if (!video) return

    if (video.paused) {
      await video.play()
    } else {
      video.pause()
    }
  }

  /* ---------------- TIME ---------------- */

  const formatTime = (time) => {
    if (!Number.isFinite(time)) return '00:00'

    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0'
      )}:${String(seconds).padStart(2, '0')}`
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const seek = (seconds) => {
    const video = videoRef.current

    if (!video) return

    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration || 0))
  }

  const handleProgress = (e) => {
    const video = videoRef.current

    if (!video) return

    const rect = e.currentTarget.getBoundingClientRect()

    const percentage = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))

    video.currentTime = percentage * video.duration
  }

  /* ---------------- VOLUME ---------------- */

  const toggleMute = () => {
    const video = videoRef.current

    if (!video) return

    video.muted = !video.muted
    setMuted(video.muted)
  }

  const handleVolume = (e) => {
    const value = Number(e.target.value)

    const video = videoRef.current

    if (!video) return

    video.volume = value

    if (value === 0) {
      video.muted = true
      setMuted(true)
    } else {
      video.muted = false
      setMuted(false)
    }

    setVolume(value)
  }

  /* ---------------- FULLSCREEN ---------------- */

  const toggleFullscreen = async () => {
    const player = playerRef.current

    if (!player) return

    if (!document.fullscreenElement) {
      await player.requestFullscreen()
      setFullscreen(true)
    } else {
      await document.exitFullscreen()
      setFullscreen(false)
    }
  }

  /* ---------------- PICTURE IN PICTURE ---------------- */

  const togglePiP = async () => {
    const video = videoRef.current

    if (!video) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture()
      }
    } catch (error) {
      console.error(error)
    }
  }

  /* ---------------- SPEED ---------------- */

  const changeSpeed = (value) => {
    const video = videoRef.current

    if (!video) return

    video.playbackRate = value
    setSpeed(value)
  }

  /* ---------------- LOOP ---------------- */

  const toggleLoop = () => {
    const video = videoRef.current

    if (!video) return

    video.loop = !video.loop
    setLoop(video.loop)
  }

  /* ---------------- SCREENSHOT ---------------- */

  const screenshot = () => {
    const video = videoRef.current

    if (!video) return

    const canvas = document.createElement('canvas')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')

    if (!ctx) return

    /*
      CSS filterga yaqin visual enhancement.
      Bu screenshotga ham selected quality
      enhancementini qo'llaydi.
    */

    const filterMap = {
      Auto: 'none',
      '720p': 'contrast(1) saturate(1) brightness(1)',
      '1080p': 'contrast(1.05) saturate(1.05) brightness(1.05)',
      '2K': 'contrast(1.1) saturate(1.05) brightness(1.05)',
      '4K': 'contrast(1.25) saturate(1.1) brightness(1.05)',
      '5K': 'contrast(1.25) saturate(1.25) brightness(1.05)',
      '6K': 'contrast(1.5) saturate(1.25) brightness(1.1)',
      '7K': 'contrast(1.5) saturate(1.5) brightness(1.1)',
      '8K': 'contrast(1.75) saturate(1.5) brightness(1.1)',
    }

    ctx.filter = filterMap[quality.name] || 'none'

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const link = document.createElement('a')

    link.download = `screenshot-${quality.name}.png`
    link.href = canvas.toDataURL('image/png')

    link.click()
  }

  /* ---------------- DOWNLOAD ---------------- */

  const downloadVideo = () => {
    const link = document.createElement('a')

    link.href = src
    link.download = title || 'video'

    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  /* ---------------- CONTROLS AUTO HIDE ---------------- */

  const showPlayerControls = () => {
    setShowControls(true)

    clearTimeout(controlsTimer.current)

    controlsTimer.current = setTimeout(() => {
      if (playing) {
        setShowControls(false)
      }
    }, 3000)
  }

  /* ---------------- KEYBOARD ---------------- */

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName

      if (tag === 'INPUT') return

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break

        case 'arrowleft':
          seek(-10)
          break

        case 'arrowright':
          seek(10)
          break

        case 'arrowup':
          e.preventDefault()

          setVolume((prev) => {
            const next = Math.min(1, prev + 0.05)

            if (videoRef.current) {
              videoRef.current.volume = next
            }

            return next
          })

          break

        case 'arrowdown':
          e.preventDefault()

          setVolume((prev) => {
            const next = Math.max(0, prev - 0.05)

            if (videoRef.current) {
              videoRef.current.volume = next
            }

            return next
          })

          break

        case 'm':
          toggleMute()
          break

        case 'f':
          toggleFullscreen()
          break

        case 'p':
          togglePiP()
          break

        case 'l':
          toggleLoop()
          break

        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  })

  /* ---------------- VIDEO EVENTS ---------------- */

  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const onLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoadedMetadata)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [])

  /* ---------------- CLEANUP ---------------- */

  useEffect(() => {
    return () => {
      clearTimeout(controlsTimer.current)
    }
  }, [])

  return (
    <div
      ref={playerRef}
      onMouseMove={showPlayerControls}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl"
    >
      {/* VIDEO */}

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className={`h-full w-full object-contain ${quality.filter}`}
      >
        {subtitle && <track kind="subtitles" src={subtitle} srcLang="en" label="English" default />}
      </video>

      {/* TOP QUALITY BAR */}

      <div
        className={`absolute left-1/2 top-4 z-30 -translate-x-1/2 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-5 opacity-0'
        }`}
      >
        <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/60 p-1.5 shadow-2xl backdrop-blur-2xl">
          {QUALITY_OPTIONS.map((item) => (
            <button
              key={item.name}
              onClick={() => setQuality(item)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                quality.name === item.name
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* CENTER PLAY */}

      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-2xl transition hover:scale-110"
        >
          <Play size={28} fill="currentColor" className="ml-1" />
        </button>
      )}

      {/* BOTTOM CONTROLS */}

      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-4 pt-16 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        {/* PROGRESS */}

        <div
          ref={progressRef}
          onClick={handleProgress}
          className="group/progress mb-4 h-1.5 w-full cursor-pointer rounded-full bg-white/20"
        >
          <div
            className="relative h-full rounded-full bg-white transition-all"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
            }}
          >
            <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 scale-0 rounded-full bg-white shadow transition-transform group-hover/progress:scale-100" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* LEFT */}

          <div className="flex items-center gap-1">
            {/* PLAY */}

            <button
              onClick={togglePlay}
              className="rounded-lg p-2 text-white transition hover:bg-white/10"
            >
              {playing ? (
                <Pause size={19} fill="currentColor" />
              ) : (
                <Play size={19} fill="currentColor" />
              )}
            </button>

            {/* BACK */}

            <button
              onClick={() => seek(-10)}
              className="rounded-lg p-2 text-white transition hover:bg-white/10"
              title="10 seconds back"
            >
              <RotateCcw size={18} />
            </button>

            {/* FORWARD */}

            <button
              onClick={() => seek(10)}
              className="rounded-lg p-2 text-white transition hover:bg-white/10"
              title="10 seconds forward"
            >
              <RotateCw size={18} />
            </button>

            {/* VOLUME */}

            <button
              onClick={toggleMute}
              className="rounded-lg p-2 text-white transition hover:bg-white/10"
            >
              {muted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>

            {/* VOLUME SLIDER */}

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={handleVolume}
              className="h-1 w-20 cursor-pointer accent-white"
            />

            {/* TIME */}

            <span className="ml-2 whitespace-nowrap text-xs font-medium text-white/70">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-1">
            {/* QUALITY */}

            <div className="relative">
              <button
                onClick={() => setShowSettings((prev) => !prev)}
                className="flex items-center gap-1 rounded-lg p-2 text-white transition hover:bg-white/10"
              >
                <Settings size={18} />
                <span className="hidden text-xs sm:block">{quality.name}</span>
              </button>

              {showSettings && (
                <div className="absolute bottom-12 right-0 w-48 rounded-2xl border border-white/10 bg-black/90 p-2 shadow-2xl backdrop-blur-2xl">
                  <div className="mb-2 px-2 py-1 text-xs font-semibold text-white/40">QUALITY</div>

                  {QUALITY_OPTIONS.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        setQuality(item)
                        setShowSettings(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                        quality.name === item.name
                          ? 'bg-white text-black'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{item.name}</span>

                      {quality.name === item.name && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SPEED */}

            <div className="group/speed relative">
              <button className="rounded-lg px-2 py-2 text-xs font-semibold text-white transition hover:bg-white/10">
                {speed}x
              </button>

              <div className="pointer-events-none absolute bottom-11 right-0 w-28 translate-y-2 rounded-xl border border-white/10 bg-black/90 p-1 opacity-0 shadow-2xl backdrop-blur-xl transition group-hover/speed:pointer-events-auto group-hover/speed:translate-y-0 group-hover/speed:opacity-100">
                {SPEEDS.map((item) => (
                  <button
                    key={item}
                    onClick={() => changeSpeed(item)}
                    className={`w-full rounded-lg px-3 py-1.5 text-left text-xs ${
                      speed === item
                        ? 'bg-white text-black'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item}x
                  </button>
                ))}
              </div>
            </div>

            {/* LOOP */}

            <button
              onClick={toggleLoop}
              className={`rounded-lg p-2 transition ${
                loop ? 'bg-white text-black' : 'text-white hover:bg-white/10'
              }`}
              title="Loop"
            >
              <Repeat size={18} />
            </button>

            {/* SUBTITLE */}

            {subtitle && (
              <button
                className="rounded-lg p-2 text-white transition hover:bg-white/10"
                title="Subtitles"
              >
                <Subtitles size={18} />
              </button>
            )}

            {/* SCREENSHOT */}

            <button
              onClick={screenshot}
              className="rounded-lg p-2 text-white transition hover:bg-white/10"
              title="Screenshot"
            >
              <Camera size={18} />
            </button>

            {/* PIP */}

            <button
              onClick={togglePiP}
              className="rounded-lg p-2 text-white transition hover:bg-white/10"
              title="Picture in Picture"
            >
              <PictureInPicture2 size={18} />
            </button>

            {/* DOWNLOAD */}

            <button
              onClick={downloadVideo}
              className="rounded-lg p-2 text-white transition hover:bg-white/10"
              title="Download"
            >
              <Download size={18} />
            </button>

            {/* FULLSCREEN */}

            <button
              onClick={toggleFullscreen}
              className="rounded-lg p-2 text-white transition hover:bg-white/10"
              title="Fullscreen"
            >
              {fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
            </button>
          </div>
        </div>
      </div>

      {/* QUALITY BADGE */}

      <div className="pointer-events-none absolute bottom-20 left-4 z-10 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/60 backdrop-blur-md">
        {quality.name}
      </div>
    </div>
  )
}
