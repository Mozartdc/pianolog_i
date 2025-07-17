
// specialEvents.ts
import React from 'react';

export interface SpecialEvent {
  type: 'text' | 'image' | 'textWithImage';
  message?: string | React.ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  date: string; // YYYY-MM-DD 형식
  expiresAt?: string; // ISO 형식
  category: 'composer-birth' | 'composer-death' | 'korea-holiday' | 'music-day' | 'special';
}

export const specialEvents: SpecialEvent[] = [
  
  // ==================== 신년 & 국제 기념일 ====================
  {
    type: 'textWithImage',
    message: <span>🎉 <strong>Happy New Year!</strong> 새해 복 많이 받으세요!</span>,
    imageUrl: '/happy-new-year.png',
    imageAlt: '새해 복',
    date: '2025-01-01',
    category: 'special'
  },

  // ==================== 대한민국 주요 기념일 ====================
  {
    type: 'textWithImage',
    message: <span>🇰🇷 <strong>삼일절</strong> - 대한독립만세!</span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-03-01',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>🇰🇷 <strong>어린이날</strong></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-05-05',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>🇰🇷 <strong>현충일</strong> - 순국선열을 기리며</span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-06-06',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>제 77 주년 <strong>제헌절</strong>입니다.</span>,
    imageUrl: '/event.png',
    imageAlt: '대한민국 국장',
    date: '2025-07-17',
    expiresAt: '2025-07-18T00:00:00',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>🇰🇷 <strong>광복절</strong> - 해방 80주년</span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-08-15',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>🇰🇷 <strong>개천절</strong></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-10-03',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>🇰🇷 <strong>한글날</strong> - 훈민정음의 위대함</span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-10-09',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span>🎄 <strong>크리스마스</strong></span>,
    imageUrl: '/christmas.png',
    imageAlt: '크리스마스',
    date: '2025-12-25',
    category: 'korea-holiday'
  },

  // ==================== 피아노의 날 & 국제 음악 기념일 ====================
  {
    type: 'textWithImage',
    message: <span>🎹 <strong>세계 피아노의 날</strong> - 모든 피아니스트를 위하여!</span>,
    imageUrl: '/world-piano-day.png',
    imageAlt: '세계 피아노의 날',
    date: '2025-03-29', // 매년 3월 29일 (88번째 날)
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span>🎵 <strong>국제 재즈의 날</strong> - UNESCO 지정</span>,
    imageUrl: '/international-jazz-day.png',
    imageAlt: '국제 재즈의 날',
    date: '2025-04-30',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span>🌍 <strong>세계 음악의 날</strong> - Fête de la Musique</span>,
    imageUrl: '/world-music-day.png',
    imageAlt: '세계 음악의 날',
    date: '2025-06-21', // 하지
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>국제 음악의 날</strong> - UNESCO 공식</span>,
    imageUrl: '/international-music-day.png',
    imageAlt: '국제 음악의 날',
    date: '2025-10-01',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span>🎻 <strong>세계 클래식 음악의 날</strong></span>,
    imageUrl: '/world-classical-music-day.png',
    imageAlt: '세계 클래식 음악의 날',
    date: '2025-10-04',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span>🎹 <strong>피아노 발명 기념일</strong> - 크리스토포리 (1700년경)</span>,
    imageUrl: '/piano-invention-day.png',
    imageAlt: '피아노 발명 기념일',
    date: '2025-07-01', // 임의로 7월 1일 지정
    category: 'music-day'
  },

  // ==================== 바로크 작곡가 탄생일 ====================
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>헨델</strong> 탄생일 (1685)</span>,
    imageUrl: '/composer-handel.png',
    imageAlt: '헨델',
    date: '2025-02-23',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>바흐</strong> 탄생일 (1685) - 음악의 아버지</span>,
    imageUrl: '/composer-bach.png',
    imageAlt: '바흐',
    date: '2025-03-31',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>스카를라티</strong> 탄생일 (1685)</span>,
    imageUrl: '/composer-scarlatti.png',
    imageAlt: '스카를라티',
    date: '2025-10-26',
    category: 'composer-birth'
  },

  // ==================== 고전파 작곡가 탄생일 ====================
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>클레멘티</strong> 탄생일 (1752) - 피아노의 아버지</span>,
    imageUrl: '/composer-clementi.png',
    imageAlt: '클레멘티',
    date: '2025-01-23',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>모차르트</strong> 탄생일 (1756) - 천재 음악가</span>,
    imageUrl: '/composer-mozart.png',
    imageAlt: '모차르트',
    date: '2025-01-27',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>베토벤</strong> 탄생일 (1770) - 악성</span>,
    imageUrl: '/composer-beethoven.png',
    imageAlt: '베토벤',
    date: '2025-12-17',
    category: 'composer-birth'
  },

  // ==================== 낭만파 작곡가 탄생일 ====================
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>슈베르트</strong> 탄생일 (1797) - 가곡의 왕</span>,
    imageUrl: '/composer-schubert.png',
    imageAlt: '슈베르트',
    date: '2025-01-31',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>멘델스존</strong> 탄생일 (1809)</span>,
    imageUrl: '/composer-mendelssohn.png',
    imageAlt: '멘델스존',
    date: '2025-02-03',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>쇼팽</strong> 탄생일 (1810) - 피아노의 시인</span>,
    imageUrl: '/composer-chopin.png',
    imageAlt: '쇼팽',
    date: '2025-03-01',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>슈만</strong> 탄생일 (1810)</span>,
    imageUrl: '/composer-schumann.png',
    imageAlt: '슈만',
    date: '2025-06-08',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>리스트</strong> 탄생일 (1811) - 피아노의 마왕</span>,
    imageUrl: '/composer-liszt.png',
    imageAlt: '리스트',
    date: '2025-10-22',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>브람스</strong> 탄생일 (1833)</span>,
    imageUrl: '/composer-brahms.png',
    imageAlt: '브람스',
    date: '2025-05-07',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>차이코프스키</strong> 탄생일 (1840)</span>,
    imageUrl: '/composer-tchaikovsky.png',
    imageAlt: '차이코프스키',
    date: '2025-05-07',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>드뷔시</strong> 탄생일 (1862) - 인상주의의 창시자</span>,
    imageUrl: '/composer-debussy.png',
    imageAlt: '드뷔시',
    date: '2025-08-22',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>라흐마니노프</strong> 탄생일 (1873)</span>,
    imageUrl: '/composer-rachmaninoff.png',
    imageAlt: '라흐마니노프',
    date: '2025-04-01',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span>🎼 <strong>라벨</strong> 탄생일 (1875)</span>,
    imageUrl: '/composer-ravel.png',
    imageAlt: '라벨',
    date: '2025-03-07',
    category: 'composer-birth'
  },

  // ==================== 작곡가 사망일 ====================
  {
    type: 'text',
    message: '🕯️ 바흐를 기리며 (1750)',
    date: '2025-07-28',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 모차르트를 기리며 (1791) - 35세의 짧은 생',
    date: '2025-12-05',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 베토벤을 기리며 (1827)',
    date: '2025-03-26',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 슈베르트를 기리며 (1828) - 31세의 아까운 죽음',
    date: '2025-11-19',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 멘델스존을 기리며 (1847)',
    date: '2025-11-04',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 쇼팽을 기리며 (1849) - 39세, 파리에서',
    date: '2025-10-17',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 슈만을 기리며 (1856)',
    date: '2025-07-29',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 리스트를 기리며 (1886)',
    date: '2025-07-31',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 브람스를 기리며 (1897)',
    date: '2025-04-03',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 차이코프스키를 기리며 (1893)',
    date: '2025-11-06',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 드뷔시를 기리며 (1918)',
    date: '2025-03-25',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 라벨을 기리며 (1937)',
    date: '2025-12-28',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: '🕯️ 라흐마니노프를 기리며 (1943)',
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
  const today = new Date().toISOString().slice(0, 10);
  return getEventsByDate(today);
};

// 🎯 나만의 특별한 날 추가 템플릿
// 사용법: 아래 템플릿을 복사해서 specialEvents 배열에 추가하세요
/*
{
  type: 'textWithImage', // 'text' | 'image' | 'textWithImage'
  message: <span>🎵 <strong>나만의 특별한 날</strong> - 설명</span>,
  imageUrl: '/my-special-day.png', // public 폴더의 이미지 파일명
  imageAlt: '나만의 특별한 날',
  date: '2025-MM-DD', // YYYY-MM-DD 형식
  expiresAt: '2025-MM-DD+1T00:00:00', // 다음날 자정에 만료 (선택사항)
  category: 'special' // 'composer-birth' | 'composer-death' | 'korea-holiday' | 'music-day' | 'special'
}
*/