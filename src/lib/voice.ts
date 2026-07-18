/**
 * 语音发音功能模块
 * 支持美式/英式发音切换，真人标准发音
 */

type AccentType = 'US' | 'UK';

let currentAccent: AccentType = 'US';

// Speech Synthesis API
let synth: SpeechSynthesis | null = null;

// 缓存语音配置
const voiceCache: { [key: string]: SpeechSynthesisVoice } = {};

export function getCurrentAccent(): AccentType {
  return currentAccent;
}

export function setAccent(accent: AccentType): void {
  currentAccent = accent;
}

export function toggleAccent(): AccentType {
  currentAccent = currentAccent === 'US' ? 'UK' : 'US';
  return currentAccent;
}

/**
 * 获取可用的语音
 */
export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve([]);
      return;
    }
    synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      synth.onvoiceschanged = () => {
        resolve(synth!.getVoices());
      };
    }
  });
}

/**
 * 获取指定口音的语音
 */
export async function getVoiceForAccent(accent: AccentType): Promise<SpeechSynthesisVoice | null> {
  const voices = await getVoices();

  // 美式英语
  const usVoice = voices.find(v =>
    v.lang.startsWith('en-US') && v.name.includes('Google') ||
    v.lang.startsWith('en-US') && v.localService
  ) || voices.find(v => v.lang.startsWith('en-US'));

  // 英式英语
  const ukVoice = voices.find(v =>
    v.lang.startsWith('en-GB') && v.name.includes('Google') ||
    v.lang.startsWith('en-GB') && v.localService
  ) || voices.find(v => v.lang.startsWith('en-GB'));

  if (accent === 'US') return usVoice || null;
  if (accent === 'UK') return ukVoice || null;
  return null;
}

/**
 * 播放单词或文本发音
 */
export function speak(
  text: string,
  accent: AccentType = currentAccent,
  rate: number = 0.9,
  pitch: number = 1,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined') return;

  // 取消当前正在播放的语音
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = accent === 'US' ? 'en-US' : 'en-GB';
  utterance.rate = rate;
  utterance.pitch = pitch;

  // 尝试获取对应口音的语音
  getVoiceForAccent(accent).then(voice => {
    if (voice) {
      utterance.voice = voice;
    }
    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * 播放中文释义
 */
export function speakChinese(text: string): void {
  if (typeof window === 'undefined') return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

/**
 * 卡通形象同步跟读动画状态
 * 返回一个嘴型状态: 'idle' | 'talking' | 'smile'
 */
export type MouthState = 'idle' | 'talking' | 'smile';

/**
 * 检测是否正在播放语音
 */
export function isSpeaking(): boolean {
  if (typeof window === 'undefined') return false;
  return window.speechSynthesis.speaking;
}

/**
 * 停止播放
 */
export function stopSpeaking(): void {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
}
