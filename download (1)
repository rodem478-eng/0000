import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Image as ImageIcon, Info, HelpCircle } from 'lucide-react';
import { WasteAnalysisResult } from '../types';
import { CATEGORY_MAP, SAMPLE_TEST_PRESETS } from '../data/constants';

interface CameraScanTabProps {
  onGoToVerifyWithItem: (itemName: string) => void;
}

export const CameraScanTab: React.FC<CameraScanTabProps> = ({ onGoToVerifyWithItem }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<WasteAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera stream states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Live Webcam
  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMessage('카메라 접근 권한이 없거나 지원되지 않습니다. 사진 업로드나 예시 템플릿을 이용해 보세요.');
    }
  };

  // Stop Live Webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      stopCamera();
      analyzeWaste(dataUrl, textPrompt);
    }
  };

  // Handle file input change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        analyzeWaste(base64, textPrompt);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle selecting a sample preset
  const handleSelectPreset = (preset: typeof SAMPLE_TEST_PRESETS[0]) => {
    setSelectedImage(preset.imageUrl);
    setTextPrompt(preset.samplePrompt);
    analyzeWaste(preset.imageUrl, preset.samplePrompt);
  };

  // Trigger Gemini API Analysis
  const analyzeWaste = async (imageBase64?: string | null, prompt?: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/gemini/analyze-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64 || undefined,
          textPrompt: prompt || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.result) {
        throw new Error(data.error || 'AI 분석 응답을 받아오지 못했습니다.');
      }

      setAnalysisResult(data.result);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'AI 카메라 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const categoryInfo = analysisResult ? CATEGORY_MAP[analysisResult.category] : null;

  return (
    <div className="space-y-6 pb-24">
      {/* Tab Title Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium mb-2 border border-emerald-400/30">
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              AI 비전 카메라 스캐너
            </div>
            <h2 className="text-xl font-bold">헷갈리는 쓰레기, 찍어서 바로 확인!</h2>
            <p className="text-xs text-emerald-100/90 mt-1">
              카메라로 촬영하거나 사진을 업로드하면 Gemini AI가 배출법을 3초 만에 정리해 드립니다.
            </p>
          </div>
        </div>
      </div>

      {/* Main Camera / Upload Interface Box */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        {/* Active Camera Viewfinder */}
        {isCameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-emerald-500 shadow-inner">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-emerald-400/60 rounded-2xl m-4 flex items-center justify-center">
              <span className="bg-black/60 text-emerald-300 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                물품을 네모 프레임 중앙에 맞춰주세요
              </span>
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
              <button
                onClick={capturePhoto}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
              >
                <Camera className="w-5 h-5" />
                촬영 및 분석
              </button>
              <button
                onClick={stopCamera}
                className="bg-slate-800/80 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-full backdrop-blur-sm"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          /* Default Upload / Preview View */
          <div className="space-y-4">
            {selectedImage ? (
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-16/9 sm:aspect-21/9 border border-slate-200 group">
                <img src={selectedImage} alt="Selected waste item" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setAnalysisResult(null);
                    }}
                    className="bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    다시 선택
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/40 rounded-2xl p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">쓰레기/재활용품 사진 촬영 또는 선택</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    페트병, 배달용기, 우유팩, 약통, 부서진 창문 등 무엇이든 가능해요!
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={startCamera}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                    실시간 카메라 켜기
                  </button>

                  <label className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-xs cursor-pointer flex items-center gap-2 active:scale-95 transition-transform">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    사진 파일 선택
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {/* Optional Text Prompt Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="예: 기름 묻은 피자상자인데 상단만 깨끗해요"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                onClick={() => analyzeWaste(selectedImage, textPrompt)}
                disabled={isAnalyzing || (!selectedImage && !textPrompt.trim())}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-xs transition-transform active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                분석하기
              </button>
            </div>
          </div>
        )}

        {/* Quick Sample Presets (for instant testing without camera) */}
        {!selectedImage && !isCameraActive && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                자주 헷갈리는 예시 물품 즉시 스캔해보기
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SAMPLE_TEST_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all flex items-center gap-2 group"
                >
                  <img src={preset.imageUrl} alt={preset.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 truncate">{preset.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Message Display */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading State Spinner */}
      {isAnalyzing && (
        <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
            <Sparkles className="w-6 h-6 text-amber-500 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Gemini AI 비전 엔진이 분리배출법을 분석 중입니다...</h3>
            <p className="text-xs text-slate-500 mt-1">환경부 표준 분리배출 가이드라인 데이터와 대조하는 중</p>
          </div>
        </div>
      )}

      {/* Analysis Result Presentation */}
      {analysisResult && !isAnalyzing && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-md space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Header & Category Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">인식 결과</span>
              <h3 className="text-lg font-extrabold text-slate-900">{analysisResult.itemName}</h3>
            </div>

            {categoryInfo && (
              <div className={`px-3 py-1.5 rounded-2xl ${categoryInfo.badgeBg} ${categoryInfo.badgeText} border border-emerald-300 font-bold text-xs flex items-center gap-2 shrink-0 self-start sm:self-center`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                분류: {categoryInfo.name}
              </div>
            )}
          </div>

          {/* Recyclability Meter */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                재활용 가능도 평가
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {analysisResult.recyclable ? '올바른 처리 시 고품질 재활용이 가능한 자원입니다.' : '재활용이 어려워 일반쓰레기 배출이 권장됩니다.'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-2xl font-black ${analysisResult.recyclabilityScore >= 80 ? 'text-emerald-600' : analysisResult.recyclabilityScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                {analysisResult.recyclabilityScore}%
              </span>
              <div className="text-[10px] text-slate-400 font-medium">적합 점수</div>
            </div>
          </div>

          {/* Step-by-Step Prep Instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              올바른 분리배출 3단계 실천 법
            </h4>
            <div className="space-y-2">
              {analysisResult.steps.map((step, idx) => (
                <div key={idx} className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Caution Alert Box */}
          {analysisResult.caution && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">주의사항: </span>
                <span>{analysisResult.caution}</span>
              </div>
            </div>
          )}

          {/* Environmental Impact Note */}
          {analysisResult.environmentalImpact && (
            <div className="p-3 bg-teal-50 border border-teal-100 rounded-2xl text-teal-800 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              <p className="italic">{analysisResult.environmentalImpact}</p>
            </div>
          )}

          {/* Action Button to Verify & Earn Points */}
          <button
            onClick={() => onGoToVerifyWithItem(analysisResult.itemName)}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <span>이 물품 배출 완료 후 인증하고 +100P 받기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
