// specialEvents.tsx
import React from 'react';
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
  Sunset
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

export const specialEvents: SpecialEvent[] = [
  
  // ==================== 신년 & 국제 기념일 ====================
  {
    type: 'textWithImage',
    message: <span><Sparkles className="inline w-5 h-5 mr-1" /> <strong>Happy New Year!</strong> 새해 복 많이 받으세요!</span>,
    imageUrl: '/happy-new-year.png',
    imageAlt: '새해 복',
    date: '2025-01-01',
    category: 'special'
  },

  // ==================== 대한민국 주요 기념일 ====================
  {
    type: 'textWithImage',
    message: <span><Flag className="inline w-5 h-5 mr-1" /> <strong>삼일절</strong> - 대한독립만세!</span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-03-01',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span><Heart className="inline w-5 h-5 mr-1" /> <strong>어린이날</strong></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-05-05',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span><Star className="inline w-5 h-5 mr-1" /> <strong>현충일</strong> - 순국선열을 기리며</span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-06-06',
    category: 'korea-holiday'
  },
  
  // 🎯 오늘 테스트용 - 제헌절 수정
  {
    type: 'textWithImage',
    message: <span><Award className="inline w-5 h-5 mr-1" /> 제 77주년 <strong>제헌절</strong></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-07-17',
    expiresAt: '2025-07-18T00:00:00',
    category: 'korea-holiday'
  },
  
  {
    type: 'textWithImage',
    message: <span><Flag className="inline w-5 h-5 mr-1" /> <strong>광복절</strong> - 해방 80주년</span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-08-15',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span><Flag className="inline w-5 h-5 mr-1" /> <strong>개천절</strong></span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-10-03',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span><Flag className="inline w-5 h-5 mr-1" /> <strong>한글날</strong> - 훈민정음의 위대함</span>,
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-10-09',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: <span><TreePine className="inline w-5 h-5 mr-1" /> <strong>크리스마스</strong></span>,
    imageUrl: '/christmas.png',
    imageAlt: '크리스마스',
    date: '2025-12-25',
    category: 'korea-holiday'
  },

  // ==================== 피아노의 날 & 국제 음악 기념일 ====================
  {
    type: 'textWithImage',
    message: <span><Piano className="inline w-5 h-5 mr-1" /> <strong>세계 피아노의 날</strong> - 모든 피아니스트를 위하여!</span>,
    imageUrl: '/world-piano-day.png',
    imageAlt: '세계 피아노의 날',
    date: '2025-03-29', // 매년 3월 29일 (88번째 날)
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span><Music className="inline w-5 h-5 mr-1" /> <strong>국제 재즈의 날</strong> - UNESCO 지정</span>,
    imageUrl: '/international-jazz-day.png',
    imageAlt: '국제 재즈의 날',
    date: '2025-04-30',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span><Music className="inline w-5 h-5 mr-1" /> <strong>세계 음악의 날</strong> - Fête de la Musique</span>,
    imageUrl: '/world-music-day.png',
    imageAlt: '세계 음악의 날',
    date: '2025-06-21', // 하지
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span><Music className="inline w-5 h-5 mr-1" /> <strong>국제 음악의 날</strong> - UNESCO 공식</span>,
    imageUrl: '/international-music-day.png',
    imageAlt: '국제 음악의 날',
    date: '2025-10-01',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span><Music className="inline w-5 h-5 mr-1" /> <strong>세계 클래식 음악의 날</strong></span>,
    imageUrl: '/world-classical-music-day.png',
    imageAlt: '세계 클래식 음악의 날',
    date: '2025-10-04',
    category: 'music-day'
  },
  {
    type: 'textWithImage',
    message: <span><Piano className="inline w-5 h-5 mr-1" /> <strong>피아노 발명 기념일</strong> - 크리스토포리 (1700년경)</span>,
    imageUrl: '/piano-invention-day.png',
    imageAlt: '피아노 발명 기념일',
    date: '2025-07-01', // 임의로 7월 1일 지정
    category: 'music-day'
  },

  // ==================== 바로크 작곡가 탄생일 ====================
  {
    type: 'textWithImage',
    message: <span><Crown className="inline w-5 h-5 mr-1" /> <strong>헨델</strong> 탄생일 (1685)</span>,
    imageUrl: '/composer-handel.png',
    imageAlt: '헨델',
    date: '2025-02-23',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Crown className="inline w-5 h-5 mr-1" /> <strong>바흐</strong> 탄생일 (1685) - 음악의 아버지</span>,
    imageUrl: '/composer-bach.png',
    imageAlt: '바흐',
    date: '2025-03-31',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Crown className="inline w-5 h-5 mr-1" /> <strong>스카를라티</strong> 탄생일 (1685)</span>,
    imageUrl: '/composer-scarlatti.png',
    imageAlt: '스카를라티',
    date: '2025-10-26',
    category: 'composer-birth'
  },

  // ==================== 고전파 작곡가 탄생일 ====================
  {
    type: 'textWithImage',
    message: <span><Crown className="inline w-5 h-5 mr-1" /> <strong>클레멘티</strong> 탄생일 (1752) - 피아노의 아버지</span>,
    imageUrl: '/composer-clementi.png',
    imageAlt: '클레멘티',
    date: '2025-01-23',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Star className="inline w-5 h-5 mr-1" /> <strong>모차르트</strong> 탄생일 (1756) - 천재 음악가</span>,
    imageUrl: '/composer-mozart.png',
    imageAlt: '모차르트',
    date: '2025-01-27',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Crown className="inline w-5 h-5 mr-1" /> <strong>베토벤</strong> 탄생일 (1770) - 악성</span>,
    imageUrl: '/composer-beethoven.png',
    imageAlt: '베토벤',
    date: '2025-12-17',
    category: 'composer-birth'
  },

  // ==================== 낭만파 작곡가 탄생일 ====================
  {
    type: 'textWithImage',
    message: <span><Heart className="inline w-5 h-5 mr-1" /> <strong>슈베르트</strong> 탄생일 (1797) - 가곡의 왕</span>,
    imageUrl: '/composer-schubert.png',
    imageAlt: '슈베르트',
    date: '2025-01-31',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Music className="inline w-5 h-5 mr-1" /> <strong>멘델스존</strong> 탄생일 (1809)</span>,
    imageUrl: '/composer-mendelssohn.png',
    imageAlt: '멘델스존',
    date: '2025-02-03',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Piano className="inline w-5 h-5 mr-1" /> <strong>쇼팽</strong> 탄생일 (1810) - 피아노의 시인</span>,
    imageUrl: '/composer-chopin.png',
    imageAlt: '쇼팽',
    date: '2025-03-01',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Heart className="inline w-5 h-5 mr-1" /> <strong>슈만</strong> 탄생일 (1810)</span>,
    imageUrl: '/composer-schumann.png',
    imageAlt: '슈만',
    date: '2025-06-08',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Crown className="inline w-5 h-5 mr-1" /> <strong>리스트</strong> 탄생일 (1811) - 피아노의 마왕</span>,
    imageUrl: '/composer-liszt.png',
    imageAlt: '리스트',
    date: '2025-10-22',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Music className="inline w-5 h-5 mr-1" /> <strong>브람스</strong> 탄생일 (1833)</span>,
    imageUrl: '/composer-brahms.png',
    imageAlt: '브람스',
    date: '2025-05-07',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Music className="inline w-5 h-5 mr-1" /> <strong>차이코프스키</strong> 탄생일 (1840)</span>,
    imageUrl: '/composer-tchaikovsky.png',
    imageAlt: '차이코프스키',
    date: '2025-05-07',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Sunset className="inline w-5 h-5 mr-1" /> <strong>드뷔시</strong> 탄생일 (1862) - 인상주의의 창시자</span>,
    imageUrl: '/composer-debussy.png',
    imageAlt: '드뷔시',
    date: '2025-08-22',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Piano className="inline w-5 h-5 mr-1" /> <strong>라흐마니노프</strong> 탄생일 (1873)</span>,
    imageUrl: '/composer-rachmaninoff.png',
    imageAlt: '라흐마니노프',
    date: '2025-04-01',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: <span><Music className="inline w-5 h-5 mr-1" /> <strong>라벨</strong> 탄생일 (1875)</span>,
    imageUrl: '/composer-ravel.png',
    imageAlt: '라벨',
    date: '2025-03-07',
    category: 'composer-birth'
  },

  // ==================== 작곡가 사망일 ====================
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        바흐를 기리며 (1750)
      </span>
    ),
    date: '2025-07-28',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        모차르트를 기리며 (1791) - 35세의 짧은 생
      </span>
    ),
    date: '2025-12-05',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        베토벤을 기리며 (1827)
      </span>
    ),
    date: '2025-03-26',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        슈베르트를 기리며 (1828) - 31세의 아까운 죽음
      </span>
    ),
    date: '2025-11-19',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        멘델스존을 기리며 (1847)
      </span>
    ),
    date: '2025-11-04',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        쇼팽을 기리며 (1849) - 39세, 파리에서
      </span>
    ),
    date: '2025-10-17',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        슈만을 기리며 (1856)
      </span>
    ),
    date: '2025-07-29',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        리스트를 기리며 (1886)
      </span>
    ),
    date: '2025-07-31',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        브람스를 기리며 (1897)
      </span>
    ),
    date: '2025-04-03',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        차이코프스키를 기리며 (1893)
      </span>
    ),
    date: '2025-11-06',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        드뷔시를 기리며 (1918)
      </span>
    ),
    date: '2025-03-25',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        라벨을 기리며 (1937)
      </span>
    ),
    date: '2025-12-28',
    category: 'composer-death'
  },
  {
    type: 'text',
    message: (
      <span>
        <Flower className="inline w-5 h-5 mr-1" />
        라흐마니노프를 기리며 (1943)
      </span>
    ),
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
  console.log('🎯 오늘 날짜:', today); // 디버깅용
  const events = getEventsByDate(today);
  console.log('🎯 오늘의 이벤트:', events); // 디버깅용
  return events;
};

// 오늘의 이벤트를 CheerData 형태로 반환하는 헬퍼 함수
export const getTodayCheerData = (): CheerData => {
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

  // 특별한 이벤트가 없을 경우 기본 메시지
  const fallbackMessages = [
    "오늘도 화이팅!", 
    "꾸준히 연습하는 당신이 멋져요", 
    "음악과 함께하는 하루"
  ];
  const now = new Date();
  const seed = now.getHours() + now.getMinutes();
  const messageIndex = seed % fallbackMessages.length;
  
  return { 
    type: 'text', 
    message: fallbackMessages[messageIndex]
    // date, expiresAt은 선택적이므로 생략 가능
  };
};