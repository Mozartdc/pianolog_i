// specialEvents.tsx
import React from 'react';
import dayjs from 'dayjs';
import { getTodayCheer } from './cheers'; // 기존 치어 시스템 import

import { 
  Piano, 
  Sparkles,
  TreePine,
  Flower
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
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>Happy New Year!</strong> 새해 복 많이 받으세요!</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-01-01',
    category: 'special'
  },

  // ==================== 대한민국 주요 기념일 ====================
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>삼일절</strong> - 대한독립만세!</span>
      </div>
    ),
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-03-01',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>어린이날</strong></span>
      </div>
    ),
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-05-05',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>현충일</strong> - 순국선열을 기리며</span>
      </div>
    ),
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-06-06',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>제 77주년 <strong>제헌절</strong></span>
      </div>
    ),
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-07-17',
    expiresAt: '2025-07-18T00:00:00',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>광복절</strong> - 해방 80주년</span>
      </div>
    ),
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-08-15',
    category: 'korea-holiday'
  },

  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>개천절</strong></span>
      </div>
    ),
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-10-03',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>한글날</strong> - 훈민정음의 위대함</span>
      </div>
    ),
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-10-09',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <TreePine width={14} height={14} />
        <span><strong>크리스마스</strong></span>
      </div>
    ),
    imageUrl: '/christmas.png',
    imageAlt: '크리스마스',
    date: '2025-12-25',
    category: 'korea-holiday'
  },

  // ==================== 피아노의 날 & 국제 음악 기념일 ====================
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>세계 피아노의 날</strong> - 모든 피아니스트를 위하여!</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-03-29',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>국제 재즈의 날</strong> - UNESCO 지정</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-04-30',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>세계 음악의 날</strong> - Fête de la Musique</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-06-21',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>국제 음악의 날</strong> - UNESCO 공식</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-10-01',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>세계 클래식 음악의 날</strong></span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-10-04',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>피아노 발명 기념일</strong> - 크리스토포리 (1700년경)</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-07-01',
    category: 'music-day'
  },

  // ==================== 작곡가 탄생일 ====================
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>헨델</strong> 탄생일 (1685)</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-02-23',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>하이든</strong> 탄생일 (1732) - 교향곡의 아버지</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-03-21',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>바흐</strong> 탄생일 (1685) - 음악의 아버지</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-03-31',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>스카를라티</strong> 탄생일 (1685)</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-10-26',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>클레멘티</strong> 탄생일 (1752) - 피아노의 아버지</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-01-23',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>모차르트</strong> 탄생일 (1756) - 천재 음악가</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-01-27',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>베토벤</strong> 탄생일 (1770) - 악성</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-12-17',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>슈베르트</strong> 탄생일 (1797) - 가곡의 왕</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-01-31',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>멘델스존</strong> 탄생일 (1809)</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-02-03',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>쇼팽</strong> 탄생일 (1810) - 피아노의 시인</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-03-01',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>슈만</strong> 탄생일 (1810)</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-06-08',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>리스트</strong> 탄생일 (1811) - 피아노의 마왕</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-10-22',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>브람스</strong> 탄생일 (1833)</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-05-07',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>차이코프스키</strong> 탄생일 (1840)</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-05-07',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>드뷔시</strong> 탄생일 (1862) - 인상주의의 창시자</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-08-22',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>라흐마니노프</strong> 탄생일 (1873)</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-04-01',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>라벨</strong> 탄생일 (1875)</span>
      </div>
    ),
    imageUrl: '/happy.png', // ✅ public 폴더 경로로 수정
    imageAlt: '기쁜 날',
    date: '2025-03-07',
    category: 'composer-birth'
  },

  // ==================== 작곡가 사망일 ====================
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>바흐를 기리며 (1750)</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-07-28',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>모차르트를 기리며 (1791) - 35세의 짧은 생</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-12-05',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>베토벤을 기리며 (1827)</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-03-26',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>슈베르트를 기리며 (1828) - 31세의 아까운 죽음</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-11-19',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>멘델스존을 기리며 (1847)</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-11-04',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>쇼팽을 기리며 (1849) - 39세, 파리에서</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-10-17',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>슈만을 기리며 (1856)</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-07-29',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>리스트를 기리며 (1886)</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-07-31',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>브람스를 기리며 (1897)</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-04-03',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>차이코프스키를 기리며 (1893)</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-11-06',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>드뷔시를 기리며 (1918)</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-03-25',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>라벨을 기리며 (1937)</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
    date: '2025-12-28',
    category: 'composer-death'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>라흐마니노프를 기리며 (1943)</span>
      </div>
    ),
    imageUrl: '/rip.png', // ✅ public 폴더 경로로 수정
    imageAlt: '슬픈 날',
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
  console.log('🎯 오늘 날짜:', today);
  const events = getEventsByDate(today);
  console.log('🎯 오늘의 이벤트:', events);
  return events;
};

// 🔧 핵심: 오늘의 이벤트를 CheerData 형태로 반환하는 헬퍼 함수
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