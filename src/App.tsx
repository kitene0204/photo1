/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  FolderOpen,
  Image as ImageIcon,
  Film,
  Music,
  Youtube,
  Trash2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Sparkles,
  Shuffle,
  CheckCircle,
  AlertCircle,
  Upload,
  X
} from 'lucide-react';
import { SAMPLE_MEDIA_ITEMS } from './sampleData.ts';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  file?: File;
}

type FrameStyle = 'frame-none' | 'frame-polaroid' | 'frame-wood' | 'frame-film';

interface AppSettings {
  title: string;
  frameStyle: FrameStyle;
  videoAudioEnabled: boolean;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const EFFECTS = ['effect-fade', 'effect-zoom', 'effect-pan-right', 'effect-pan-left'];

export default function App() {
  // App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('classPhotoSettings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return {
      title: '우리반 추억 사진관',
      frameStyle: 'frame-none',
      videoAudioEnabled: false,
    };
  });

  // Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(settings.title);
  const [tempFrameStyle, setTempFrameStyle] = useState<FrameStyle>(settings.frameStyle);
  const [tempVideoAudio, setTempVideoAudio] = useState(settings.videoAudioEnabled);

  // Media items state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Playback settings
  const [imageDuration, setImageDuration] = useState<number>(4);
  const [videoDuration, setVideoDuration] = useState<number>(10);

  // Music State
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [volume, setVolume] = useState<number>(70);

  // Slideshow State
  const [isSlideshow, setIsSlideshow] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [showTitleOverlay, setShowTitleOverlay] = useState<boolean>(false);
  const [currentEffect, setCurrentEffect] = useState<string>(EFFECTS[0]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Refs
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const slideshowContainerRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Initialize YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isYtReadyRef.current = true;
    } else {
      window.onYouTubeIframeAPIReady = () => {
        isYtReadyRef.current = true;
      };
    }
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Helper to extract YouTube video ID
  const getYouTubeId = (url: string): string | null => {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Add files to media items
  const handleFileList = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newItems: MediaItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type.startsWith('image/')) {
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          type: 'image',
          url: URL.createObjectURL(file),
          name: file.name,
          file,
        });
      } else if (file.type.startsWith('video/')) {
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          type: 'video',
          url: URL.createObjectURL(file),
          name: file.name,
          file,
        });
      }
    }

    if (newItems.length > 0) {
      setMediaItems((prev) => [...prev, ...newItems]);
      showToast(`${newItems.length}개의 미디어 파일이 추가되었습니다!`, 'success');
    } else {
      showToast('지원되는 이미지나 동영상 파일이 없습니다.', 'error');
    }
  };

  // Load sample photos
  const loadSamplePhotos = () => {
    const sampleItems: MediaItem[] = SAMPLE_MEDIA_ITEMS.map((item, index) => ({
      id: `sample-${index}-${Date.now()}`,
      type: 'image',
      url: item.url,
      name: item.name,
    }));
    setMediaItems((prev) => [...prev, ...sampleItems]);
    showToast('추억 샘플 사진 5장을 불러왔습니다! 바로 시작해보세요.', 'success');
  };

  // Remove individual photo
  const removeMediaItem = (id: string) => {
    setMediaItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && target.file) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Clear all photos
  const clearAllMedia = () => {
    mediaItems.forEach((item) => {
      if (item.file) URL.revokeObjectURL(item.url);
    });
    setMediaItems([]);
    showToast('모든 파일이 비워졌습니다.', 'info');
  };

  // Shuffle media items
  const shuffleMedia = () => {
    if (mediaItems.length <= 1) return;
    setMediaItems((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
    showToast('재생 순서를 무작위로 섞었습니다!', 'success');
  };

  // Audio file select
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(file);
      setAudioFile(file);
      setAudioUrl(url);
      showToast(`배경 음악 등록 완료: ${file.name}`, 'success');
    }
  };

  // Apply YouTube link
  const handleApplyYoutube = () => {
    const vid = getYouTubeId(youtubeUrl.trim());
    if (vid) {
      showToast('유튜브 배경음악이 성공적으로 설정되었습니다.', 'success');
    } else {
      showToast('올바른 유튜브 링크를 입력해주세요. (예: https://youtu.be/...)', 'error');
    }
  };

  // Open YouTube search
  const openYoutubeSearch = () => {
    window.open('https://www.youtube.com/results?search_query=감동적인+bgm+동요', '_blank');
  };

  // Settings Save
  const saveSettings = () => {
    const newSettings: AppSettings = {
      title: tempTitle.trim() || '우리반 추억 사진관',
      frameStyle: tempFrameStyle,
      videoAudioEnabled: tempVideoAudio,
    };
    setSettings(newSettings);
    localStorage.setItem('classPhotoSettings', JSON.stringify(newSettings));
    setIsSettingsOpen(false);
    showToast('디자인 및 제목 설정이 저장되었습니다!', 'success');
  };

  // Setup BGM when slideshow starts
  const startMusic = useCallback(() => {
    const vol = volume / 100;
    if (audioUrl && audioRef.current) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }
      audioRef.current.volume = vol;
      audioRef.current.play().catch((e) => console.warn('Audio play prevented:', e));
    } else if (youtubeUrl.trim()) {
      const vid = getYouTubeId(youtubeUrl.trim());
      if (vid && isYtReadyRef.current) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById(vid);
          ytPlayerRef.current.setVolume(volume);
          ytPlayerRef.current.playVideo();
        } else {
          try {
            ytPlayerRef.current = new window.YT.Player('youtube-player', {
              height: '240',
              width: '240',
              videoId: vid,
              playerVars: {
                autoplay: 1,
                controls: 0,
                loop: 1,
                playlist: vid,
                origin: window.location.origin,
              },
              events: {
                onReady: (e: any) => {
                  e.target.setVolume(volume);
                  e.target.playVideo();
                },
                onStateChange: (e: any) => {
                  if (e.data === 0) e.target.playVideo(); // Loop
                },
              },
            });
          } catch (e) {
            console.error('YT init failed:', e);
          }
        }
      }
    }
  }, [audioUrl, youtubeUrl, volume]);

  const pauseMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      ytPlayerRef.current.pauseVideo();
    }
  }, []);

  const resumeMusic = useCallback(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch((e) => console.warn(e));
    } else if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      ytPlayerRef.current.playVideo();
    }
  }, [audioUrl]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol / 100;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(newVol);
    }
  };

  // Next / Prev slide handlers
  const goToNextSlide = useCallback(() => {
    if (mediaItems.length === 0) return;
    const randomEff = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
    setCurrentEffect(randomEff);
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  }, [mediaItems.length]);

  const goToPrevSlide = useCallback(() => {
    if (mediaItems.length === 0) return;
    const randomEff = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
    setCurrentEffect(randomEff);
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  }, [mediaItems.length]);

  // Slideshow timer effect
  useEffect(() => {
    if (!isSlideshow || !isPlaying || mediaItems.length === 0) {
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
      return;
    }

    const currentItem = mediaItems[currentIndex];
    const durationMs = currentItem?.type === 'video' ? videoDuration * 1000 : imageDuration * 1000;

    slideTimerRef.current = setTimeout(() => {
      goToNextSlide();
    }, durationMs);

    return () => {
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    };
  }, [isSlideshow, isPlaying, currentIndex, mediaItems, imageDuration, videoDuration, goToNextSlide]);

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      pauseMusic();
      if (videoRef.current) videoRef.current.pause();
    } else {
      setIsPlaying(true);
      resumeMusic();
      if (videoRef.current) videoRef.current.play().catch((e) => console.warn(e));
    }
  };

  // Start Slideshow
  const startSlideshow = () => {
    if (mediaItems.length === 0) {
      showToast('사진이나 동영상을 먼저 추가해주세요!', 'error');
      return;
    }

    setIsSlideshow(true);
    setCurrentIndex(0);
    setIsPlaying(true);
    setCurrentEffect(EFFECTS[0]);
    setShowTitleOverlay(true);

    // Title intro overlay fades out after 3.8s
    setTimeout(() => {
      setShowTitleOverlay(false);
    }, 3800);

    // Start background music
    startMusic();
    triggerControlsDisplay();
  };

  // Stop / Exit Slideshow
  const stopSlideshow = () => {
    if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    setIsSlideshow(false);
    setIsPlaying(false);
    pauseMusic();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Temporary controls display with auto-hide
  const triggerControlsDisplay = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isSlideshow && isPlaying) {
        setControlsVisible(false);
      }
    }, 3200);
  }, [isSlideshow, isPlaying]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        showToast('전체화면 전환에 실패했습니다.', 'error');
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSlideshow) return;
      triggerControlsDisplay();

      if (e.key === 'ArrowRight') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'Escape') {
        stopSlideshow();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSlideshow, isPlaying, goToNextSlide, goToPrevSlide, triggerControlsDisplay]);

  // Drag and drop handlers
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
    if (e.dataTransfer.files) {
      handleFileList(e.dataTransfer.files);
    }
  };

  const currentMedia = mediaItems[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans-system selection:bg-blue-200">
      {/* Toast Notification Container */}
      <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-11/12 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-5 py-3 rounded-2xl text-white font-medium shadow-xl transition-all duration-300 flex items-center gap-3 w-full backdrop-blur-md text-sm border ${
              toast.type === 'error'
                ? 'bg-rose-600/95 border-rose-400'
                : toast.type === 'success'
                ? 'bg-emerald-600/95 border-emerald-400'
                : 'bg-indigo-600/95 border-indigo-400'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="leading-tight">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Hidden Audio Elements */}
      <audio ref={audioRef} src={audioUrl} loop className="hidden" />
      <div
        id="youtube-player-container"
        className="absolute -top-[9999px] -left-[9999px] w-20 h-20 opacity-0 pointer-events-none -z-50"
      >
        <div id="youtube-player" />
      </div>

      {/* =========================================
          VIEW 1: SETUP VIEW
      ========================================= */}
      {!isSlideshow ? (
        <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 transition-all">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden flex flex-col items-center">
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Camera className="w-8 h-8 text-blue-100" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-dohyeon tracking-wide drop-shadow-md">
                  {settings.title}
                </h1>
              </div>

              <p className="text-blue-100 text-sm max-w-md relative z-10 font-sans-system mb-3">
                선생님과 아이들의 빛나는 추억을 감성적인 액자와 음악과 함께 상영해보세요!
              </p>

              <button
                onClick={() => {
                  setTempTitle(settings.title);
                  setTempFrameStyle(settings.frameStyle);
                  setTempVideoAudio(settings.videoAudioEnabled);
                  setIsSettingsOpen(true);
                }}
                className="relative z-10 bg-white/20 hover:bg-white/30 text-white border border-white/30 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center backdrop-blur-sm cursor-pointer shadow-sm active:scale-95"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span>제목 및 액자 디자인 설정</span>
              </button>
            </header>

            <div className="p-6 sm:p-10 space-y-8">
              {/* Step 1: Upload Media */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 shadow-xs">
                      1
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                        사진 / 동영상 불러오기
                      </h2>
                      <p className="text-xs text-slate-500">
                        어린이집, 유치원, 초등학교 활동 파일들을 간편하게 업로드하세요
                      </p>
                    </div>
                  </div>

                  {/* Sample photos button */}
                  <button
                    onClick={loadSamplePhotos}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>샘플 사진 추가</span>
                  </button>
                </div>

                {/* Dropzone & Buttons */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-200 ${
                    isDragging ? 'ring-4 ring-blue-400 bg-blue-50/50 rounded-2xl' : ''
                  }`}
                >
                  {/* Folder Upload Card */}
                  <div
                    onClick={() => folderInputRef.current?.click()}
                    className="group border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-amber-50 hover:border-amber-400 transition-all cursor-pointer shadow-xs flex flex-col items-center justify-center"
                  >
                    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                      <FolderOpen className="w-7 h-7 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-slate-700 text-base">폴더 단위로 추가</h3>
                    <p className="text-xs text-slate-400 mt-1">학급 앨범 폴더 통째로 선택</p>
                    <input
                      ref={folderInputRef}
                      type="file"
                      // @ts-expect-error webkitdirectory is standard for folder picking
                      webkitdirectory="true"
                      directory=""
                      multiple
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={(e) => handleFileList(e.target.files)}
                    />
                  </div>

                  {/* File Upload Card */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-emerald-50 hover:border-emerald-400 transition-all cursor-pointer shadow-xs flex flex-col items-center justify-center"
                  >
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                      <ImageIcon className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-700 text-base">파일 직접 추가</h3>
                    <p className="text-xs text-slate-400 mt-1">사진 및 동영상 파일 다중 선택 (드래그 지원)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={(e) => handleFileList(e.target.files)}
                    />
                  </div>
                </div>

                {/* Status Bar */}
                <div className="mt-4 flex items-center justify-between bg-slate-100 py-3 px-5 rounded-xl border border-slate-200">
                  <div className="flex items-center text-slate-700 text-sm">
                    <CheckCircle
                      className={`w-5 h-5 mr-2 ${
                        mediaItems.length > 0 ? 'text-emerald-500' : 'text-slate-400'
                      }`}
                    />
                    <span>
                      준비된 파일: <strong className="text-blue-600 text-lg font-bold mx-1">{mediaItems.length}</strong>개
                      {mediaItems.length > 0 && (
                        <span className="text-xs text-slate-500 ml-2">
                          (사진 {mediaItems.filter((m) => m.type === 'image').length} / 영상 {mediaItems.filter((m) => m.type === 'video').length})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {mediaItems.length > 1 && (
                      <button
                        onClick={shuffleMedia}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="재생 순서 섞기"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-blue-600" />
                        <span>순서 섞기</span>
                      </button>
                    )}

                    {mediaItems.length > 0 && (
                      <button
                        onClick={clearAllMedia}
                        className="text-xs font-semibold text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>전체 비우기</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Thumbnail Preview Strip */}
                {mediaItems.length > 0 && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center justify-between">
                      <span>업로드된 미디어 미리보기 ({mediaItems.length}개)</span>
                      <span className="text-[11px] text-slate-400">카드를 누르면 삭제할 수 있습니다</span>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scroll-smooth">
                      {mediaItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="group relative shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shadow-2xs hover:shadow-md transition-all"
                        >
                          {item.type === 'image' ? (
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                              <video
                                src={item.url}
                                className="w-full h-full object-cover opacity-80"
                                muted
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Film className="w-6 h-6 text-white drop-shadow" />
                              </div>
                            </div>
                          )}

                          {/* Index badge */}
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md font-mono">
                            {index + 1}
                          </div>

                          {/* Delete overlay button */}
                          <button
                            onClick={() => removeMediaItem(item.id)}
                            className="absolute inset-0 bg-red-600/80 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="이 파일 제거"
                          >
                            <Trash2 className="w-5 h-5 mb-0.5" />
                            <span className="text-[10px] font-bold">삭제</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <hr className="border-slate-100" />

              {/* Step 2 & 3: Playback Duration & BGM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Step 2: Duration */}
                <section className="flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 shadow-xs">
                      2
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800">재생 시간 설정</h2>
                      <p className="text-xs text-slate-500">한 장당 화면에 머무르는 시간을 조절하세요</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex-1 flex flex-col justify-center gap-5">
                    {/* Photo Duration */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-slate-700 font-medium text-sm flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                          <span>사진 한 장당 머무는 시간</span>
                        </label>
                        <span className="text-xs font-semibold text-blue-600">{imageDuration}초</span>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="0.5"
                          max="15"
                          step="0.5"
                          value={imageDuration}
                          onChange={(e) => setImageDuration(parseFloat(e.target.value) || 4)}
                          className="w-full mr-4 accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                        />
                        <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 flex items-center shadow-inner shrink-0">
                          <input
                            type="number"
                            min="0.5"
                            max="60"
                            step="0.5"
                            value={imageDuration}
                            onChange={(e) => setImageDuration(parseFloat(e.target.value) || 4)}
                            className="font-bold text-blue-600 w-12 text-center focus:outline-none bg-transparent text-sm"
                          />
                          <span className="text-slate-500 font-medium text-xs pr-1">초</span>
                        </div>
                      </div>
                    </div>

                    {/* Video Duration */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-slate-700 font-medium text-sm flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-indigo-600" />
                          <span>동영상 한 개당 재생 시간</span>
                        </label>
                        <span className="text-xs font-semibold text-indigo-600">{videoDuration}초</span>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="1"
                          max="60"
                          step="1"
                          value={videoDuration}
                          onChange={(e) => setVideoDuration(parseInt(e.target.value) || 10)}
                          className="w-full mr-4 accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                        />
                        <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 flex items-center shadow-inner shrink-0">
                          <input
                            type="number"
                            min="1"
                            max="300"
                            step="1"
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(parseInt(e.target.value) || 10)}
                            className="font-bold text-indigo-600 w-12 text-center focus:outline-none bg-transparent text-sm"
                          />
                          <span className="text-slate-500 font-medium text-xs pr-1">초</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Step 3: Background Music */}
                <section className="flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 shadow-xs">
                      3
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800">배경 음악 (선택)</h2>
                      <p className="text-xs text-slate-500">유튜브 링크 또는 내 컴퓨터의 오디오 파일 등록</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex-1 flex flex-col justify-center space-y-3">
                    {/* YouTube Input */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500">
                        <Youtube className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="유튜브 BGM 링크 (예: https://youtu.be/...)"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-xs sm:text-sm bg-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleApplyYoutube}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-xl text-xs font-bold border border-blue-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>링크 확인</span>
                      </button>
                      <button
                        onClick={openYoutubeSearch}
                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        <span>감동 BGM 검색</span>
                      </button>
                    </div>

                    <div className="relative pt-1 border-t border-slate-200">
                      <label className="block text-xs text-slate-500 mb-1 font-medium">
                        또는 MP3 파일 직접 등록:
                      </label>
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 border border-slate-200 rounded-xl bg-white cursor-pointer shadow-2xs"
                      />
                    </div>

                    {/* Active music badge */}
                    {(audioFile || getYouTubeId(youtubeUrl.trim())) && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 truncate">
                          <Music className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <strong className="font-semibold">
                            {audioFile ? `오디오: ${audioFile.name}` : '유튜브 BGM 연동 완료'}
                          </strong>
                        </span>
                        <button
                          onClick={() => {
                            setAudioFile(null);
                            setAudioUrl('');
                            setYoutubeUrl('');
                            showToast('배경음악이 해제되었습니다.', 'info');
                          }}
                          className="text-emerald-700 hover:text-rose-600 ml-2"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Start Button */}
              <div className="pt-4 pb-2 text-center">
                <button
                  onClick={startSlideshow}
                  className="group relative inline-flex items-center justify-center px-12 py-5 text-xl font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-300 w-full sm:w-auto cursor-pointer font-dohyeon tracking-wider"
                >
                  <Play className="w-6 h-6 mr-3 fill-current group-hover:scale-110 transition-transform" />
                  <span>슬라이드쇼 시작하기</span>
                </button>
                {mediaItems.length === 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    * 위에서 사진/동영상을 추가하거나 [샘플 사진 추가]를 눌러보세요!
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* =========================================
            VIEW 2: SLIDESHOW FULLSCREEN VIEW
        ========================================= */
        <div
          ref={slideshowContainerRef}
          onMouseMove={triggerControlsDisplay}
          onClick={triggerControlsDisplay}
          className={`fixed inset-0 z-50 pastel-bg flex flex-col w-full h-full select-none overflow-hidden ${
            !controlsVisible ? 'cursor-none' : 'cursor-default'
          }`}
        >
          {/* Floating animated decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <i
              className="floating-icon fas fa-school text-6xl text-blue-300/60"
              style={{ top: '15%', left: '7%', animationDelay: '0s' }}
            />
            <i
              className="floating-icon fas fa-futbol text-7xl text-slate-400/40"
              style={{ top: '45%', left: '5%', animationDelay: '1.2s' }}
            />
            <i
              className="floating-icon fas fa-hamburger text-6xl text-orange-300/60"
              style={{ top: '75%', left: '9%', animationDelay: '2.4s' }}
            />
            <i
              className="floating-icon fas fa-music text-5xl text-purple-300/60"
              style={{ top: '30%', left: '18%', animationDelay: '3.1s' }}
            />
            <i
              className="floating-icon fas fa-star text-6xl text-amber-300/70"
              style={{ top: '85%', left: '16%', animationDelay: '0.8s' }}
            />

            <i
              className="floating-icon fas fa-palette text-7xl text-pink-300/60"
              style={{ top: '20%', right: '7%', animationDelay: '0.5s' }}
            />
            <i
              className="floating-icon fas fa-film text-6xl text-slate-400/40"
              style={{ top: '55%', right: '5%', animationDelay: '2.1s' }}
            />
            <i
              className="floating-icon fas fa-camera-retro text-7xl text-teal-300/60"
              style={{ top: '80%', right: '9%', animationDelay: '1.7s' }}
            />
            <i
              className="floating-icon fas fa-heart text-5xl text-red-300/60"
              style={{ top: '35%', right: '18%', animationDelay: '3.5s' }}
            />
            <i
              className="floating-icon fas fa-book text-6xl text-indigo-300/60"
              style={{ top: '10%', right: '16%', animationDelay: '2.8s' }}
            />
          </div>

          {/* Intro Title Overlay */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none transition-opacity duration-1000 bg-black/45 ${
              showTitleOverlay ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="text-center px-8">
              <Camera className="w-16 h-16 text-yellow-300 mx-auto mb-4 animate-bounce" />
              <h1 className="text-4xl sm:text-6xl md:text-7xl text-white font-jua drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] tracking-wide">
                {settings.title}
              </h1>
              <p className="text-white/80 text-lg sm:text-2xl mt-4 font-dohyeon">
                우리 아이들의 소중한 이야기 속으로 들어갑니다 ✨
              </p>
            </div>
          </div>

          {/* Main Slideshow Stage */}
          <div className="flex-1 w-full h-full relative flex items-center justify-center z-10 overflow-hidden">
            {currentMedia && (
              <div
                key={currentMedia.id + '-' + currentIndex}
                className="slide-wrapper active"
              >
                <div className={`slide-content ${settings.frameStyle} ${currentEffect}`}>
                  {currentMedia.type === 'video' ? (
                    <video
                      ref={videoRef}
                      src={currentMedia.url}
                      autoPlay
                      muted={!settings.videoAudioEnabled}
                      loop
                      playsInline
                      className="slide-media max-h-[85vh] max-w-[90vw]"
                    />
                  ) : (
                    <img
                      src={currentMedia.url}
                      alt={currentMedia.name}
                      referrerPolicy="no-referrer"
                      className="slide-media max-h-[85vh] max-w-[90vw]"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Current Item Counter Indicator (top-left) */}
            <div
              className={`absolute top-6 left-6 z-50 bg-black/40 backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-full font-mono transition-opacity duration-300 ${
                controlsVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {currentIndex + 1} / {mediaItems.length}
            </div>
          </div>

          {/* Floating UI Controls Overlay (bottom) */}
          <div
            className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-8 flex flex-col sm:flex-row justify-between items-center text-white pb-6 z-50 transition-opacity duration-300 ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Left: Exit button */}
            <button
              onClick={stopSlideshow}
              className="text-white hover:text-red-400 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl backdrop-blur-md transition-colors flex items-center text-xs sm:text-sm font-medium mb-3 sm:mb-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>설정 화면으로</span>
            </button>

            {/* Center: Playback Controls */}
            <div className="flex items-center space-x-5 my-2 sm:my-0">
              <button
                onClick={goToPrevSlide}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 active:scale-95 transition-all text-xl backdrop-blur-md cursor-pointer"
                title="이전 사진 (←)"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-lg text-2xl cursor-pointer"
                title="재생 / 일시정지 (Space)"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={goToNextSlide}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 active:scale-95 transition-all text-xl backdrop-blur-md cursor-pointer"
                title="다음 사진 (→)"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Right: Volume & Fullscreen */}
            <div className="flex items-center gap-3">
              {/* Volume Slider */}
              <div className="flex items-center bg-white/10 px-3 py-2 rounded-xl backdrop-blur-md">
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 mr-2 text-white/70" />
                ) : (
                  <Volume2 className="w-4 h-4 mr-2 text-white" />
                )}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value) || 0)}
                  className="w-20 sm:w-24 accent-blue-400 h-1.5 bg-white/30 rounded-lg cursor-pointer"
                  title="볼륨 조절"
                />
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition text-white backdrop-blur-md cursor-pointer"
                title="전체화면 전환 (F)"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          SETTINGS MODAL
      ========================================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <span>제목 및 디자인 스타일 설정</span>
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-2 text-sm">
                  슬라이드쇼 대표 제목
                </label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  placeholder="우리반 추억 사진관"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  이 제목은 메인 화면과 슬라이드쇼 시작 화면 인트로에 표시됩니다.
                </p>
              </div>

              {/* Frame Style Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-3 text-sm">
                  액자(프레임) 디자인
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* None */}
                  <label
                    onClick={() => setTempFrameStyle('frame-none')}
                    className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                      tempFrameStyle === 'frame-none'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 mx-auto mb-2 bg-slate-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">기본 (화면 가득)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">테두리 없는 깔끔한 전체 화면</div>
                  </label>

                  {/* Polaroid */}
                  <label
                    onClick={() => setTempFrameStyle('frame-polaroid')}
                    className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                      tempFrameStyle === 'frame-polaroid'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 mx-auto mb-2 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">감성 폴라로이드</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">하단 여백이 있는 즉석사진</div>
                  </label>

                  {/* Wood */}
                  <label
                    onClick={() => setTempFrameStyle('frame-wood')}
                    className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                      tempFrameStyle === 'frame-wood'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 mx-auto mb-2 bg-amber-100 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-amber-800" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">클래식 원목 액자</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">고급스러운 브라운 원목 틀</div>
                  </label>

                  {/* Film */}
                  <label
                    onClick={() => setTempFrameStyle('frame-film')}
                    className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                      tempFrameStyle === 'frame-film'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 mx-auto mb-2 bg-slate-800 rounded-lg flex items-center justify-center">
                      <Film className="w-5 h-5 text-white" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">영화 필름 스타일</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">시네마틱 릴 필름 프레임</div>
                  </label>
                </div>
              </div>

              {/* Video Audio Setting */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-700 text-sm">동영상 소리 켜기</div>
                    <div className="text-xs text-slate-400">
                      비디오 자체 음성(아이들 노랫소리 등)을 재생할지 선택합니다
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempVideoAudio}
                    onChange={(e) => setTempVideoAudio(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
                  />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-sm font-medium transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={saveSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-7 rounded-xl shadow-md transition text-sm cursor-pointer"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
