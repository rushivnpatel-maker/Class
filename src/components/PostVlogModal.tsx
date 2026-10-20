/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Video,
  Disc,
  StopCircle,
  Play,
  RotateCcw,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Image as ImageIcon,
  FolderOpen,
} from 'lucide-react';
import type { Vlog } from '../types';

interface PostVlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vlog: Omit<Vlog, 'id' | 'createdAt' | 'views' | 'likes' | 'likedBy' | 'comments'>) => void;
  currentNickname: string;
  avatarColor: string;
}

const PRESET_VIDEOS = [
  {
    name: 'Tokyo Rain & Lights',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: '/src/assets/images/vlog_tokyo_night_1792408300054.jpg',
    duration: '12:40',
    location: 'Tokyo, Japan',
    tags: ['Tokyo', 'NightWalk', 'Atmosphere'],
  },
  {
    name: 'Creative Studio Session',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: '/src/assets/images/vlog_creative_loft_1792408300509.jpg',
    duration: '08:15',
    location: 'Brooklyn, NY',
    tags: ['CreativeSpace', 'Studio', 'Routine'],
  },
  {
    name: 'Modular Synth Jam',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    thumbnail: '/src/assets/images/vlog_dj_soundset_1792408300829.jpg',
    duration: '15:20',
    location: 'Berlin, Germany',
    tags: ['Music', 'ModularSynth', 'LiveBeats'],
  },
  {
    name: 'Creator Direct Vlog',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnail: '/src/assets/images/hero_vlogger_studio_1792408298736.jpg',
    duration: '10:05',
    location: 'London, UK',
    tags: ['VlogTalk', 'Creator', 'TheClass'],
  },
];

export function PostVlogModal({
  isOpen,
  onClose,
  onSubmit,
  currentNickname,
  avatarColor,
}: PostVlogModalProps) {
  const [activeMode, setActiveMode] = useState<'upload' | 'record' | 'preset'>('upload');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('vlog, creative');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [duration, setDuration] = useState('02:00');

  // Device file info
  const [deviceFileName, setDeviceFileName] = useState<string | null>(null);
  const [deviceFileSize, setDeviceFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Webcam recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoStreamRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  if (!isOpen) return null;

  // Process a video file from device
  const processVideoFile = (file: File) => {
    setDeviceFileName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setDeviceFileSize(`${sizeInMb} MB`);

    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);

    if (!title) {
      // Clean filename for vlog title
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setTitle(cleanName);
    }

    // Auto extract duration and snapshot thumbnail from the device video
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;
    tempVideo.muted = true;
    tempVideo.playsInline = true;

    tempVideo.onloadedmetadata = () => {
      const dur = Math.floor(tempVideo.duration);
      if (!isNaN(dur) && dur > 0) {
        const m = Math.floor(dur / 60);
        const s = dur % 60;
        setDuration(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
      // Seek to capture frame
      tempVideo.currentTime = Math.min(1, tempVideo.duration / 2);
    };

    tempVideo.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = tempVideo.videoWidth || 640;
        canvas.height = tempVideo.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setThumbnailUrl(dataUrl);
        }
      } catch (err) {
        console.warn('Could not auto-generate thumbnail from device video:', err);
      }
    };
  };

  const handleDeviceFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      processVideoFile(file);
    }
  };

  const handleThumbnailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setThumbnailUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoStreamRef.current) {
        videoStreamRef.current.srcObject = stream;
        videoStreamRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access not granted or unavailable. You can upload any video file from your device.');
    }
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        setVideoUrl(url);
        setDeviceFileName('Live Camera Recording.webm');
        const mins = Math.floor(recordSeconds / 60);
        const secs = recordSeconds % 60;
        setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);
    } catch (e) {
      console.error('Failed to start MediaRecorder', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const resetRecording = () => {
    setRecordedBlobUrl(null);
    setVideoUrl('');
    setRecordSeconds(0);
    startCamera();
  };

  const handlePresetSelect = (preset: typeof PRESET_VIDEOS[0]) => {
    setVideoUrl(preset.url);
    setThumbnailUrl(preset.thumbnail);
    setDuration(preset.duration);
    setLocation(preset.location);
    if (!title) setTitle(preset.name);
    setTagsInput(preset.tags.join(', '));
    setDeviceFileName(preset.name);
    setDeviceFileSize('HD Sample');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const chosenVideo =
      videoUrl ||
      recordedBlobUrl ||
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
    const chosenThumbnail =
      thumbnailUrl || '/src/assets/images/hero_vlogger_studio_1792408298736.jpg';

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSubmit({
      author: currentNickname,
      authorAvatarColor: avatarColor,
      title: title.trim(),
      description: description.trim() || 'Video file added from device into The Class.',
      thumbnailUrl: chosenThumbnail,
      videoUrl: chosenVideo,
      duration: duration || '03:45',
      tags: tags.length > 0 ? tags : ['Vlog', 'DeviceUpload'],
      location: location.trim() || 'Local Studio',
    });

    stopCameraStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                Post A New Vlog
              </h2>
              <p className="text-xs text-slate-400">
                Add video files directly from your device or record live
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveMode('upload');
                stopCameraStream();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeMode === 'upload'
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add From Device</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('record');
                startCamera();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeMode === 'record'
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Record Live Camera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('preset');
                stopCameraStream();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeMode === 'preset'
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Creator Samples</span>
            </button>
          </div>

          {/* MODE: ADD FROM DEVICE */}
          {activeMode === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-400 bg-amber-400/10 scale-[1.01]'
                    : videoUrl
                    ? 'border-emerald-500/50 bg-slate-950/70'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/mkv,video/*"
                  onChange={handleDeviceFileInput}
                  className="hidden"
                />

                {videoUrl ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {deviceFileName || 'Device Video Loaded'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {deviceFileSize && <span>{deviceFileSize} · </span>}
                        <span>{duration} duration</span>
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-xs text-amber-400 hover:underline inline-flex items-center gap-1"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Choose another file from device
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center mx-auto mb-3">
                      <FileVideo className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Choose video file from your device
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                      Drag & drop your video here, or click to open your device's file manager. Supports MP4, WebM, MOV, and MKV.
                    </p>
                    <button
                      type="button"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 border border-slate-700 pointer-events-none"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      Browse Device Files
                    </button>
                  </div>
                )}
              </div>

              {/* Video Preview & Custom Thumbnail from Device */}
              {videoUrl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {/* Video Player Preview */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                      Video Playback Preview
                    </span>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                      <video
                        src={videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Thumbnail from Device */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-slate-400">
                        Cover Thumbnail
                      </span>
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Upload Image
                      </button>
                    </div>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailInput}
                      className="hidden"
                    />
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-500">Auto-captured frame</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE: RECORD LIVE CAMERA */}
          {activeMode === 'record' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
              {recordedBlobUrl ? (
                <div className="w-full space-y-3">
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                    <video
                      src={recordedBlobUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Vlog recorded successfully ({duration})
                    </span>
                    <button
                      type="button"
                      onClick={resetRecording}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retake Video
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    <video
                      ref={videoStreamRef}
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {isRecording && (
                      <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded bg-rose-600/90 text-white font-mono text-xs shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>REC</span>
                        <span className="tabular-nums">
                          {Math.floor(recordSeconds / 60)
                            .toString()
                            .padStart(2, '0')}
                          :{(recordSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    {!mediaStreamRef.current && (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg flex items-center gap-2 border border-slate-700 cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-amber-400" />
                        Enable Camera & Mic
                      </button>
                    )}
                  </div>

                  {cameraError && (
                    <div className="flex items-center gap-2 p-3 bg-amber-950/40 border border-amber-900/60 rounded-lg text-amber-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {mediaStreamRef.current && (
                    <div className="flex justify-center gap-3 pt-1">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors cursor-pointer"
                        >
                          <Disc className="w-4 h-4" />
                          Start Recording
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 hover:bg-white text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
                        >
                          <StopCircle className="w-4 h-4 text-rose-600" />
                          Finish Recording
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE: CREATOR SAMPLES */}
          {activeMode === 'preset' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_VIDEOS.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={`border rounded-xl p-3 flex gap-3 cursor-pointer transition-all ${
                    videoUrl === preset.url
                      ? 'border-amber-400 bg-amber-400/5'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={preset.thumbnail}
                    alt={preset.name}
                    className="w-20 h-14 object-cover rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">
                      {preset.name}
                    </h4>
                    <span className="text-[11px] text-slate-400 block">
                      {preset.location} · {preset.duration}
                    </span>
                    <span className="text-[10px] text-amber-400/80 truncate block">
                      #{preset.tags.join(' #')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Metadata Fields Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vlog Title *
              </label>
              <input
                type="text"
                required
                placeholder="Give your vlog a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Story & Notes for Followers
              </label>
              <textarea
                rows={3}
                placeholder="What happened in this video? Behind the scenes notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. My Studio, Tokyo, Brooklyn"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="vlog, documentary, creative"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Publish Vlog To The Class
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
