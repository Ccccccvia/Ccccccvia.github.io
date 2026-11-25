export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const pages = ['home', 'knowledge', 'projects', 'about'] as const;
export type Page = (typeof pages)[number];

export function pagePath(locale: Locale, page: Page): string {
  return `/${locale}/${page === 'home' ? '' : `${page}/`}`;
}

export const ui = {
  zh: {
    nav: { home: '首页', knowledge: '知识库', projects: '实作画廊', about: '关于' },
    navigation: '主导航',
    skip: '跳转到正文',
    language: 'Read this page in English',
    status: '正在建设',
    footer: '从理解原理，到创造作品。',
    projects: {
      eyebrow: 'THE SKILL GALLERY',
      title: '实作画廊',
      description: '让知识有具体的落点。每个作品将记录做了什么、如何实现，以及有哪些值得继续探索的问题。',
      emptyTitle: '作品展位已预留。',
      emptyDescription: '这里尚未发布项目。之后会逐个补充作品说明、代码链接、截图与实际结果。',
      mediaLabel: '演示视频区域',
      mediaTitle: '未来作品的演示位置',
      mediaDescription: '这是布局占位，不是已完成的项目，也没有可播放的视频。',
      note: '作品完成状态与视频录制状态将分别记录：没有录制视频，不等于作品尚未完成。',
      structureTitle: '每个作品将讲清楚',
      sections: [
        { title: '问题与目标', text: '为什么制作它，希望解决什么问题。' },
        { title: '实现与结果', text: '技术选择、实际完成的部分和当前限制。' },
        { title: '原理与证据', text: '相关知识、源代码，以及演示或截图。' },
      ],
    },
    about: {
      eyebrow: 'ABOUT KNOWLEDGEOS',
      title: '把学习，变成可以分享的作品。',
      description: 'KnowledgeOS 是一个正在建设的个人知识与作品展示网站。它将原理解释与实际制作放在一起，让两者相互印证。',
      approachTitle: '这里会展示什么',
      approach: '知识库收录适合公开、经过审校的内容；实作画廊记录真实项目的目标、实现与结果。个人资料和精选作品将逐步完善。',
      publicationTitle: '公开内容的边界',
      publication: '网站不会自动发布整个个人笔记库。未获授权的课程材料、私人信息和未审校草稿不进入公开内容。',
      profile: '访问 GitHub 主页',
    },
  },
  en: {
    nav: { home: 'Home', knowledge: 'Knowledge', projects: 'Skill Gallery', about: 'About' },
    navigation: 'Main navigation',
    skip: 'Skip to content',
    language: '切换到此页面的中文版',
    status: 'In progress',
    footer: 'From understanding ideas to making things.',
    projects: {
      eyebrow: 'THE SKILL GALLERY',
      title: 'Skill Gallery',
      description: 'A place for ideas to become tangible. Each project will explain what was built, how it works and what remains to explore.',
      emptyTitle: 'A space for projects is ready.',
      emptyDescription: 'No projects have been published here yet. Project descriptions, code links, screenshots and outcomes will be added one at a time.',
      mediaLabel: 'Demo video area',
      mediaTitle: 'A place for future project demos',
      mediaDescription: 'This is a layout placeholder, not a completed project. There is no playable video yet.',
      note: 'Project completion and video recording will have separate statuses: a project can be complete before its demo is recorded.',
      structureTitle: 'Each project will explain',
      sections: [
        { title: 'Problem and purpose', text: 'Why it was built and what it aims to solve.' },
        { title: 'Implementation and outcome', text: 'Technical choices, completed work and current limitations.' },
        { title: 'Principles and evidence', text: 'Related knowledge, source code, and demos or screenshots.' },
      ],
    },
    about: {
      eyebrow: 'ABOUT KNOWLEDGEOS',
      title: 'Turn learning into something worth sharing.',
      description: 'KnowledgeOS is a personal knowledge and project portfolio under construction. It brings explanations and practical work together, allowing each to inform the other.',
      approachTitle: 'What belongs here',
      approach: 'The knowledge library contains reviewed, publishable material. The gallery documents real project goals, implementation and results. A personal introduction and selected work will follow.',
      publicationTitle: 'A deliberate publishing boundary',
      publication: 'The personal note vault is not published automatically. Course materials without permission, private information and unreviewed drafts stay outside the public content.',
      profile: 'Visit GitHub profile',
    },
  },
} as const;
