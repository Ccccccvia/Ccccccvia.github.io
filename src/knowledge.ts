export const topicGroups = [
  { id: 'systems', zh: '计算机系统', en: 'Computer systems' },
  { id: 'networks-security', zh: '网络、通信与安全', en: 'Networks, communication & security' },
  { id: 'programming-data', zh: '编程、算法与数据', en: 'Programming, algorithms & data' },
  { id: 'mathematics-ai', zh: '数学与人工智能', en: 'Mathematics & artificial intelligence' },
] as const;

export const topics = {
  organization: { group: 'systems', zh: '计算机组成原理', en: 'Computer organization' },
  architecture: { group: 'systems', zh: '计算机体系结构', en: 'Computer architecture' },
  'operating-systems': { group: 'systems', zh: '操作系统', en: 'Operating systems' },
  networks: { group: 'networks-security', zh: '计算机网络与通信', en: 'Computer networks & communication' },
  web: { group: 'networks-security', zh: 'Web 基础', en: 'Web fundamentals' },
  security: { group: 'networks-security', zh: '安全与数据表示', en: 'Security & representation' },
  programming: { group: 'programming-data', zh: '编程基础', en: 'Programming fundamentals' },
  algorithms: { group: 'programming-data', zh: '算法与数据结构', en: 'Algorithms & data structures' },
  databases: { group: 'programming-data', zh: '数据库', en: 'Databases' },
  mathematics: { group: 'mathematics-ai', zh: '游戏数学', en: 'Game mathematics' },
  ai: { group: 'mathematics-ai', zh: '人工智能', en: 'Artificial intelligence' },
} as const satisfies Record<string, { group: typeof topicGroups[number]['id']; zh: string; en: string }>;

export type TopicId = keyof typeof topics;
export const topicIds = Object.keys(topics) as [TopicId, ...TopicId[]];
export const programmingLanguages = ['C#', 'JavaScript', 'SQL'] as const;
export const featuredCardLimit = 7;

export function selectFeaturedCards<T>(cards: readonly T[], random = Math.random): T[] {
  const pool = [...cards];
  const count = Math.min(featuredCardLimit, pool.length);
  for (let index = 0; index < count; index++) {
    const selected = index + Math.floor(random() * (pool.length - index));
    [pool[index], pool[selected]] = [pool[selected]!, pool[index]!];
  }
  return pool.slice(0, count);
}

export function topicGroupFor(topic: TopicId) {
  return topicGroups.find((group) => group.id === topics[topic].group)!;
}
