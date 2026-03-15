// specialEvents.tsx
import React from 'react';
import dayjs from 'dayjs';
import { getTodayCheer } from './cheers';
import { getStoredJson } from './localStorage';

import { 
  Piano, 
  Sparkles,
  TreePine,
  Flower
} from 'lucide-react';

// Common base type (includes properties used in home screen)
export interface CheerData {
  type: 'text' | 'image' | 'textWithImage';
  message?: string | React.ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  date?: string;
  expiresAt?: string;
}

// SpecialEvent extends CheerData and adds required properties
export interface SpecialEvent extends CheerData {
  date: string; // Changed to required
  category: 'composer-birth' | 'composer-death' | 'korea-holiday' | 'music-day' | 'special';
}

// Calendar standard:
// - Composer anniversaries use proleptic Gregorian month/day.
// - Matching is month/day recurring each year, unless expiresAt is explicitly set.

export const specialEvents: SpecialEvent[] = [
  // Special period event (August 31 - September 7)
{
  type: 'textWithImage',
  message: (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
      <span><strong>aasdf43 전국 3위</strong><br />전국 피아노 콩쿠르 입상을 축하합니다.</span>
    </div>
  ),
  imageUrl: '/happy.gif',
  imageAlt: '특별한 날',
  date: '2025-08-31',
  expiresAt: '2025-09-08T00:00:00',
  category: 'special'
},

  // New Year & International holidays
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>Happy New Year!</strong> 새해 복 많이 받으세요!</span>
      </div>
    ),
    imageUrl: '/happy.png',
    imageAlt: '기쁜 날',
    date: '2025-01-01',
    category: 'special'
  },

  // Major Korean holidays
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
        <span><strong>제헌절</strong></span>
      </div>
    ),
    imageUrl: '/korea-flag.png',
    imageAlt: '대한민국 국기',
    date: '2025-07-17',
    category: 'korea-holiday'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>광복절</strong></span>
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
    imageUrl: '/happy.png',
    imageAlt: '크리스마스',
    date: '2025-12-25',
    category: 'korea-holiday'
  },

  // Piano Day & International music holidays
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>국제 재즈의 날</strong> - UNESCO 지정</span>
      </div>
    ),
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
    imageAlt: '기쁜 날',
    date: '2025-06-21',
    category: 'music-day'
  },
  // Composer birthdays
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>헨델</strong> 탄생일 (1685)</span>
      </div>
    ),
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
    imageAlt: '기쁜 날',
    date: '2025-03-31',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>바흐</strong> 탄생일 (1685) - 음악의 아버지</span>
      </div>
    ),
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
    imageAlt: '기쁜 날',
    date: '2025-12-16',
    category: 'composer-birth'
  },
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span><strong>슈베르트</strong> 탄생일 (1797) - 가곡의 왕</span>
      </div>
    ),
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
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
    imageUrl: '/happy.png',
    imageAlt: '기쁜 날',
    date: '2025-03-07',
    category: 'composer-birth'
  },

  // Composer death anniversaries
  {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <span>바흐를 기리며 (1750)</span>
      </div>
    ),
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
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
    imageUrl: '/rip.png',
    imageAlt: '슬픈 날',
    date: '2025-03-28',
    category: 'composer-death'
  }
];

// Helper function to find events by date
export const getEventsByDate = (date: string): SpecialEvent[] => {
  const target = dayjs(date);
  if (!target.isValid()) return [];

  const targetMonthDay = target.format('MM-DD');

  return specialEvents.filter((event) => {
    if (event.expiresAt) {
      const start = dayjs(event.date);
      const end = dayjs(event.expiresAt);
      return start.isValid() && end.isValid() && !target.isBefore(start, 'day') && !target.isAfter(end, 'day');
    }

    const eventDate = dayjs(event.date);
    if (!eventDate.isValid()) return false;
    return eventDate.format('MM-DD') === targetMonthDay;
  });
};

const getPianoDayEvent = (today: dayjs.Dayjs): SpecialEvent | null => {
  const pianoDay = dayjs(`${today.year()}-01-01`).add(87, 'day'); // 88th day of year
  if (!today.isSame(pianoDay, 'day')) return null;

  return {
    type: 'textWithImage',
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <Piano width={14} height={14} />
        <span><strong>세계 피아노의 날</strong> - 모든 피아니스트를 위하여!</span>
      </div>
    ),
    imageUrl: '/happy.png',
    imageAlt: '기쁜 날',
    date: pianoDay.format('YYYY-MM-DD'),
    category: 'music-day'
  };
};

// Helper function to find events by category
export const getEventsByCategory = (category: SpecialEvent['category']): SpecialEvent[] => {
  return specialEvents.filter(event => event.category === category);
};

// Helper function to find today's events
export const getTodayEvents = (): SpecialEvent[] => {
  const today = dayjs();
  const todayString = today.format('YYYY-MM-DD');
  console.log('🎯 오늘 날짜:', todayString);
  const events = getEventsByDate(todayString);
  const pianoDayEvent = getPianoDayEvent(today);
  if (pianoDayEvent) {
    events.push(pianoDayEvent);
  }
  console.log('🎯 오늘의 이벤트:', events);
  return events;
};

// Core: Helper function to return today's events as CheerData format
export const getTodayCheerData = (): CheerData => {
  // First check temporary cheer messages (existing logic)
  const savedCheers = getStoredJson<CheerData[]>('temporaryCheers', []);
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

  // Check today's special events
  const todayEvents = getTodayEvents();
  if (todayEvents.length > 0) {
    // If there are multiple events today, randomly select one
    const event = todayEvents[Math.floor(Math.random() * todayEvents.length)];
    
    // Return SpecialEvent as CheerData (including all properties)
    return {
      type: event.type,
      message: event.message,
      imageUrl: event.imageUrl,
      imageAlt: event.imageAlt,
      date: event.date,
      expiresAt: event.expiresAt
    };
  }

  // If there's no special event, use existing cheer system
  const todayCheer = getTodayCheer();
  return { 
    type: 'text', 
    message: todayCheer
  };
};
