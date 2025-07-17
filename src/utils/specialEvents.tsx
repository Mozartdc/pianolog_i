// specialEvents.tsx
import React from 'react';
import dayjs from 'dayjs';
import { getTodayCheer } from './cheers'; // 기존 치어 시스템 import

import { 
  Calendar, 
  Music, 
  Piano, 
  Heart, 
  Star, 
  Flag, 
  Gift, 
  TreePine, 
  Sparkles,
  Crown,
  Flower,
  Award,
  Coffee,
  Sunset,
  Scale,
} from 'lucide-react';

// 공통 기본 타입 (홈스크린에서 사용하는 속성들 포함)
export interface CheerData {
  type: 'text' | 'image' | 'textWithImage';
  message?: string | React.ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  date?: string;        // 홈스크린에서 사용
  expiresAt?: string;   // 홈스크린에서 사용
}

// SpecialEvent는 CheerData를 확장하고 필수 속성 추가
export interface SpecialEvent extends CheerData {
  date: string; // 필수로 변경
  category: 'composer-birth' | 'composer-death' | 'korea-holiday' | 'music-day' | 'special';
}

// localStorage 안전 함수들
const safeLocalStorageGet = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`localStorage get error for key ${key}:`, e);
    return defaultValue;
  }
};

export const specialEvents: SpecialEvent[] = [
  
  // ==================== 신년 & 국제 기념일 ====================
  {
    type: 'textWithImage',
    message: <span>Happy New Year! 새해 복 많이 받으세요! <Sparkles className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/special-newyear.png',
    imageAlt: '새해 복',
    date: '2025-01-01',
    category: 'special'
  },

  // ==================== 대한민국 주요 기념일 ====================
  {
    type: 'textWithImage',
    message: <span>삼일절 - 대한독립만세! <Flag className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-03-01',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>어린이날 <Heart className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-05-05',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>현충일 - 순국선열을 기리며 <Star className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-06-06',
    category: 'korea-holiday'
  },
  
  // 🎯 오늘 테스트용 - 제헌절 수정
  {
    type: 'textWithImage',
    message: <span>제 77주년 제헌절 <Scale className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-07-17',
    expiresAt: '2025-07-18T00:00:00',
    category: 'korea-holiday'
  },
  
  {
    type: 'textWithImage',
    message: <span>광복절 - 해방 80주년 <Flag className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-08-15',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>개천절 <Flag className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-10-03',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>한글날 - 훈민정음의 위대함 <Flag className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-10-09',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>크리스마스 <TreePine className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/special-christmas.png',
    imageAlt: '크리스마스',
    date: '2025-12-25',
    category: 'korea-holiday'
  },

  // ==================== 피아노의 날 & 국제 음악 기념일 ====================
  {
    type: 'textWithImage',
    message: <span>세계 피아노의 날 - 모든 피아니스트를 위하여! <Piano className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/music-piano-day.png',
    imageAlt: '세계 피아노의 날',
    date: '2025-03-29', // 매년 3월 29일 (88번째 날)
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span>국제 재즈의 날 - UNESCO 지정 <Music className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/music-jazz-day.png',
    imageAlt: '국제 재즈의 날',
    date: '2025-04-30',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span>세계 음악의 날 - Fête de la Musique <Music className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/music-world-day.png',
    imageAlt: '세계 음악의 날',
    date: '2025-06-21', // 하지
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span>국제 음악의 날 - UNESCO 공식 <Music className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/music-international-day.png',
    imageAlt: '국제 음악의 날',
    date: '2025-10-01',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span>세계 클래식 음악의 날 <Music className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/music-classical-day.png',
    imageAlt: '세계 클래식 음악의 날',
    date: '2025-10-04',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span>피아노 발명 기념일 - 크리스토포리 (1700년경) <Piano className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/music-piano-invention.png',
    imageAlt: '피아노 발명 기념일',
    date: '2025-07-01', // 임의로 7월 1일 지정
    category: 'music-day'
  },

  // ==================== 바로크 작곡가 탄생일 ====================
  {
    type: 'textWithImage',
    message: <span>헨델 탄생일 (1685) <Crown className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-handel.png',
    imageAlt: '헨델',
    date: '2025-02-23',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>바흐 탄생일 (1685) - 음악의 아버지 <Crown className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-bach.png',
    imageAlt: '바흐',
    date: '2025-03-31',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>스카를라티 탄생일 (1685) <Crown className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-scarlatti.png',
    imageAlt: '스카를라티',
    date: '2025-10-26',
    category: 'composer-birth'
  },

  // ==================== 고전파 작곡가 탄생일 ====================
  {
    type: 'textWithImage',
    message: <span>클레멘티 탄생일 (1752) - 피아노의 아버지 <Crown className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-clementi.png',
    imageAlt: '클레멘티',
    date: '2025-01-23',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>모차르트 탄생일 (1756) - 천재 음악가 <Star className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-mozart.png',
    imageAlt: '모차르트',
    date: '2025-01-27',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>하이든 탄생일 (1732) - 교향곡의 아버지 <Crown className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-haydn.png',
    imageAlt: '하이든',
    date: '2025-03-31',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>베토벤 탄생일 (1770) - 악성 <Crown className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-beethoven.png',
    imageAlt: '베토벤',
    date: '2025-12-17',
    category: 'composer-birth'
  },

  // ==================== 낭만파 작곡가 탄생일 ====================
  {
    type: 'textWithImage',
    message: <span>슈베르트 탄생일 (1797) - 가곡의 왕 <Heart className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-schubert.png',
    imageAlt: '슈베르트',
    date: '2025-01-31',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>멘델스존 탄생일 (1809) <Music className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-mendelssohn.png',
    imageAlt: '멘델스존',
    date: '2025-02-03',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>쇼팽 탄생일 (1810) - 피아노의 시인 <Piano className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-chopin.png',
    imageAlt: '쇼팽',
    date: '2025-03-01',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>슈만 탄생일 (1810) <Heart className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-schumann.png',
    imageAlt: '슈만',
    date: '2025-06-08',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>리스트 탄생일 (1811) - 피아노의 마왕 <Crown className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-liszt.png',
    imageAlt: '리스트',
    date: '2025-10-22',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>브람스 탄생일 (1833) <Music className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-brahms.png',
    imageAlt: '브람스',
    date: '2025-05-07',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>차이코프스키 탄생일 (1840) <Music className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-tchaikovsky.png',
    imageAlt: '차이코프스키',
    date: '2025-05-07',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>드뷔시 탄생일 (1862) - 인상주의의 창시자 <Sunset className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-debussy.png',
    imageAlt: '드뷔시',
    date: '2025-08-22',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>라흐마니노프 탄생일 (1873) <Piano className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-rachmaninoff.png',
    imageAlt: '라흐마니노프',
    date: '2025-04-01',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>라벨 탄생일 (1875) <Music className="inline w-3 h-3 ml-1" /></span>,
    imageUrl: '/composer-ravel.png',
    imageAlt: '라벨',
    date: '2025-03-07',
    category: 'composer-birth'
  },

  // ==================== 작곡가 사망일 ====================
  {
    type: 'text',
    message: <span>바흐를 기리며 (1750) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-07-28',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>모차르트를 기리며 (1791) - 35세의 짧은 생 <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-12-05',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>하이든을 기리며 (1809) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-05-31',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>베토벤을 기리며 (1827) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-03-26',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>슈베르트를 기리며 (1828) - 31세의 아까운 죽음 <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-11-19',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>멘델스존을 기리며 (1847) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-11-04',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>쇼팽을 기리며 (1849) - 39세, 파리에서 <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-10-17',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>슈만을 기리며 (1856) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-07-29',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>리스트를 기리며 (1886) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-07-31',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>브람스를 기리며 (1897) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-04-03',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>차이코프스키를 기리며 (1893) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-11-06',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>드뷔시를 기리며 (1918) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-03-25',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>라벨을 기리며 (1937) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-12-28',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: <span>라흐마니노프를 기리며 (1943) <Flower className="inline w-3 h-3 ml-1" /></span>,
    date: '2025-03-28',
    category: 'composer-death'
  }
];

// 날짜별로 이벤트를 찾는 헬퍼 함수
export const getEventsByDate = (date: string): SpecialEvent[] => {
  return specialEvents.filter(event => event.date === date);
};

// 카테고리별로 이벤트를 찾는 헬퍼 함수  
export const getEventsByCategory = (category: SpecialEvent['category']): SpecialEvent[] => {
  return specialEvents.filter(event => event.category === category);
};

// 오늘의 이벤트를 찾는 헬퍼 함수
export const getTodayEvents = (): SpecialEvent[] => {
  const today = dayjs().format('YYYY-MM-DD');
  console.log('🎯 오늘 날짜:', today); // 디버깅용
  const events = getEventsByDate(today);
  console.log('🎯 오늘의 이벤트:', events); // 디버깅용
  return events;
};

// 🔧 핵심 수정: 오늘의 이벤트를 CheerData 형태로 반환하는 헬퍼 함수
export const getTodayCheerData = (): CheerData => {
  // 1️⃣ 먼저 임시 응원 메시지 확인 (기존 로직)
  const savedCheers = safeLocalStorageGet('temporaryCheers', []);
  if (Array.isArray(savedCheers)) {
    const now = new Date();
    const validCheer = savedCheers.find((cheer: CheerData) => {
      if (!cheer.expiresAt) return cheer.date === dayjs().format('YYYY-MM-DD');
      return new Date(cheer.expiresAt) > now && cheer.date === dayjs().format('YYYY-MM-DD');
    });
    
    if (validCheer) {
      return validCheer;
    }
  }

  // 2️⃣ 오늘의 특별 이벤트 확인
  const todayEvents = getTodayEvents();
  if (todayEvents.length > 0) {
    // 오늘의 이벤트가 여러 개일 경우, 그중 하나를 랜덤으로 선택
    const event = todayEvents[Math.floor(Math.random() * todayEvents.length)];
    
    // SpecialEvent를 CheerData로 반환 (모든 속성 포함)
    return {
      type: event.type,
      message: event.message,
      imageUrl: event.imageUrl,
      imageAlt: event.imageAlt,
      date: event.date,
      expiresAt: event.expiresAt
    };
  }

  // 3️⃣ 🔧 특별한 이벤트가 없을 경우 기존 치어 시스템 사용
  const todayCheer = getTodayCheer(); // 기존 함수 사용
  return { 
    type: 'text', 
    message: todayCheer
  };
};