// High-resolution SVG-based sample classroom memory illustrations
// These render reliably in any environment without external network dependencies.

export interface SampleMediaItem {
  type: 'image';
  name: string;
  url: string;
}

const createSvgDataUrl = (title: string, subtitle: string, bgGradient: [string, string], iconType: string, dateStr: string) => {
  let iconSvg = '';
  if (iconType === 'art') {
    iconSvg = `
      <circle cx="400" cy="270" r="140" fill="#fef08a" opacity="0.4"/>
      <path d="M350 220 Q400 160 450 220 Q480 270 420 330 Q370 340 340 300 Z" fill="#f43f5e" opacity="0.85"/>
      <circle cx="370" cy="240" r="14" fill="#3b82f6"/>
      <circle cx="420" cy="230" r="14" fill="#eab308"/>
      <circle cx="440" cy="275" r="14" fill="#22c55e"/>
      <circle cx="390" cy="300" r="14" fill="#a855f7"/>
      <path d="M460 170 L510 120" stroke="#78350f" stroke-width="14" stroke-linecap="round"/>
      <path d="M450 180 L465 165" stroke="#94a3b8" stroke-width="16" stroke-linecap="round"/>
    `;
  } else if (iconType === 'sports') {
    iconSvg = `
      <circle cx="400" cy="280" r="150" fill="#bae6fd" opacity="0.4"/>
      <circle cx="400" cy="270" r="80" fill="#ffffff" stroke="#1e293b" stroke-width="10"/>
      <polygon points="400,230 435,255 422,295 378,295 365,255" fill="#1e293b"/>
      <path d="M300 370 Q400 340 500 370" stroke="#f97316" stroke-width="12" stroke-linecap="round" fill="none"/>
      <polygon points="480,180 500,150 520,180" fill="#ef4444"/>
    `;
  } else if (iconType === 'science') {
    iconSvg = `
      <circle cx="400" cy="280" r="140" fill="#bbf7d0" opacity="0.4"/>
      <path d="M360 360 C360 320, 390 300, 400 240 C410 300, 440 320, 440 360 Z" fill="#84cc16"/>
      <circle cx="390" cy="230" r="60" fill="none" stroke="#0284c7" stroke-width="12"/>
      <path d="M435 275 L480 320" stroke="#0284c7" stroke-width="16" stroke-linecap="round"/>
      <path d="M340 370 L460 370" stroke="#78350f" stroke-width="10" stroke-linecap="round"/>
    `;
  } else if (iconType === 'picnic') {
    iconSvg = `
      <circle cx="400" cy="270" r="140" fill="#fed7aa" opacity="0.4"/>
      <rect x="330" y="240" width="140" height="100" rx="20" fill="#f97316"/>
      <path d="M320 270 Q400 240 480 270" stroke="#c2410c" stroke-width="8" fill="none"/>
      <path d="M400 200 Q360 200 360 240" stroke="#ea580c" stroke-width="8" fill="none"/>
      <circle cx="320" cy="180" r="28" fill="#fbbf24"/>
      <circle cx="490" cy="190" r="20" fill="#ec4899"/>
      <circle cx="475" cy="210" r="16" fill="#38bdf8"/>
    `;
  } else {
    iconSvg = `
      <circle cx="400" cy="270" r="140" fill="#fbcfe8" opacity="0.4"/>
      <path d="M330 330 L470 330 L450 250 L350 250 Z" fill="#f43f5e"/>
      <path d="M340 250 L460 250 L440 210 L360 210 Z" fill="#fb7185"/>
      <rect x="395" y="170" width="10" height="40" fill="#fbbf24"/>
      <path d="M400 150 Q410 160 400 170 Q390 160 400 150 Z" fill="#ef4444"/>
      <circle cx="310" cy="190" r="24" fill="#a855f7"/>
      <circle cx="490" cy="190" r="24" fill="#06b6d4"/>
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGradient[0]}"/>
          <stop offset="100%" stop-color="${bgGradient[1]}"/>
        </linearGradient>
      </defs>
      <!-- Background -->
      <rect width="800" height="600" fill="url(#bgGrad)"/>
      
      <!-- Decorative background elements -->
      <circle cx="80" cy="90" r="45" fill="#ffffff" opacity="0.18"/>
      <circle cx="720" cy="120" r="70" fill="#ffffff" opacity="0.15"/>
      <circle cx="100" cy="520" r="60" fill="#ffffff" opacity="0.15"/>
      <circle cx="730" cy="490" r="50" fill="#ffffff" opacity="0.2"/>

      <!-- Graphic -->
      ${iconSvg}

      <!-- Text Container -->
      <rect x="150" y="440" width="500" height="96" rx="24" fill="#ffffff" fill-opacity="0.9" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.06))"/>
      <text x="400" y="482" text-anchor="middle" font-family="'BMDOHYEON', 'Apple SD Gothic Neo', sans-serif" font-size="28" font-weight="bold" fill="#1e293b">${title}</text>
      <text x="400" y="515" text-anchor="middle" font-family="'BMJUA', 'Apple SD Gothic Neo', sans-serif" font-size="18" fill="#64748b">${subtitle} · ${dateStr}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const SAMPLE_MEDIA_ITEMS: SampleMediaItem[] = [
  {
    type: 'image',
    name: '🎨 알록달록 무지개 미술 시간',
    url: createSvgDataUrl('알록달록 무지개 미술 시간', '꿈과 상상력을 캔버스에 가득 담았어요', ['#fbcfe8', '#fed7aa'], 'art', '2026.04.12')
  },
  {
    type: 'image',
    name: '⚽ 으랏차차 가을 운동회',
    url: createSvgDataUrl('으랏차차 신나는 운동회', '달리기 1등! 땀방울과 신나는 응원', ['#bae6fd', '#bbf7d0'], 'sports', '2026.05.02')
  },
  {
    type: 'image',
    name: '🌱 꼬마 과학자의 숲속 탐구',
    url: createSvgDataUrl('꼬마 과학자의 숲속 탐구', '돋보기로 찾아낸 작은 새싹과 친구들', ['#d9f99d', '#99f6e4'], 'science', '2026.05.20')
  },
  {
    type: 'image',
    name: '🧺 솔솔 부는 봄바람 소풍',
    url: createSvgDataUrl('솔솔 부는 봄바람 소풍', '맛있는 도시락과 활짝 웃는 얼굴들', ['#fed7aa', '#fef08a'], 'picnic', '2026.06.15')
  },
  {
    type: 'image',
    name: '🎂 우리반 행복한 생일 파티',
    url: createSvgDataUrl('우리반 행복한 생일 파티', '모두 함께 부르는 축하 노래와 박수', ['#fbcfe8', '#e9d5ff'], 'party', '2026.07.01')
  }
];
