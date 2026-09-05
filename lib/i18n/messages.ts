export type Locale = "ja" | "en";

export type TimelineEntry = {
  id: string;
  period: string;
  organization: string;
  role: string;
  summary: string;
};

export type Messages = {
  hero: {
    label: string;
    tagline: string;
    scroll: string;
    stackLabel: string;
    stackAriaLabel: string;
  };
  home: {
    about: {
      p1: string;
      p2: string;
      link: string;
    };
    allWorks: string;
    allPosts: string;
  };
  about: {
    intro: [string, string, string];
    timeline: TimelineEntry[];
  };
  nav: {
    openMenu: string;
    closeMenu: string;
    openCommandPalette: string;
  };
  locale: {
    switchToJa: string;
    switchToEn: string;
  };
};

export const messages: Record<Locale, Messages> = {
  ja: {
    hero: {
      label: "Portfolio — 2026 / Tokyo",
      tagline:
        "コードを書いたり、プロダクトを考えたり。つくったものと、その途中の記録です。",
      scroll: "Scroll ↓",
      stackLabel: "My Stack",
      stackAriaLabel: "使用技術スタック",
    },
    home: {
      about: {
        p1: "いまつくっているのは、一行ずつ記録を残すメモアプリ「Insert」。これまで、プロダクトマネジメントとソフトウェア開発に取り組んできました。",
        p2: "このサイトには、つくったものや開発中の気づき、日々考えたことを少しずつ書き残していきます。",
        link: "プロフィールを見る →",
      },
      allWorks: "つくったものをすべて見る →",
      allPosts: "記事一覧を見る →",
    },
    about: {
      intro: [
        "プロダクトの仕様を考えたり、コードを書いたり。プロダクトマネジメントとソフトウェア開発に取り組んできました。企画や設計から、実装するところまで。",
        "いまつくっているのは「Insert」。作業中に試したことや考えたことを、一行ずつ残すメモアプリです。タスクごと、週ごとに記録を読み返せます。",
        "大学での専攻は地理学。ゼミでは、植生や生態を研究する際に、機械学習と従来の統計手法でどんな違いが出るのかを比較しています。",
      ],
      timeline: [
        {
          id: "cyberagent-se",
          period: "2026.07 — 現在",
          organization: "CyberAgent",
          role: "Software Engineer（長期インターン）",
          summary:
            "CyberACE – GrowthTech – CARU で、FastAPI・Google Cloud・React を使い、バックエンドとフロントエンドを開発しています。",
        },
        {
          id: "google-ambassador",
          period: "2026.04 — 現在",
          organization: "Google",
          role: "Campus Ambassador",
          summary:
            "全国の大学・大学院から選ばれた約15名の一人として、Geminiのマーケティングに参加しています。イベントの企画・運営、学生コミュニティづくり、大学の教員や理系学部との連携を担当しています。",
        },
        {
          id: "cyberagent-go",
          period: "2026.02 — 2026.03",
          organization: "CyberAgent",
          role: "Backend Engineer（Go College）",
          summary:
            "Goを使ったAPI開発のインターンに参加しました。実装に加え、機能ごとの役割分担や、変更しやすい設計について学びました。",
        },
        {
          id: "layerx",
          period: "2025.08 — 2026.07",
          organization: "LayerX",
          role: "Product Manager / Product Marketing Manager（長期インターン）",
          summary:
            "AIエージェント開発プラットフォーム「Ai Workforce」で、プロダクト企画や改善提案を担当しました。新機能やプロダクト戦略の検討にも携わりました。",
        },
        {
          id: "hosei",
          period: "2024.04 — 2028.03（卒業見込）",
          organization: "法政大学",
          role: "地理学専攻",
          summary:
            "地理学を専攻しています。ゼミでは、植生学・生態学の研究に使う機械学習と従来の統計手法を比較しています。",
        },
      ],
    },
    nav: {
      openMenu: "メニューを開く",
      closeMenu: "メニューを閉じる",
      openCommandPalette: "コマンドパレットを開く",
    },
    locale: {
      switchToJa: "日本語に切り替え",
      switchToEn: "Switch to English",
    },
  },
  en: {
    hero: {
      label: "Portfolio — 2026 / Tokyo",
      tagline:
        "Writing code, thinking through products. A collection of things I've built and notes from the process.",
      scroll: "Scroll ↓",
      stackLabel: "My Stack",
      stackAriaLabel: "Technology stack",
    },
    home: {
      about: {
        p1: "I'm currently building Insert, a memo app for keeping records one line at a time. My work has included both product management and software development.",
        p2: "This site is a place for my projects, things I notice while building them, and thoughts from everyday life. I'll keep adding to it as I go.",
        link: "More about me →",
      },
      allWorks: "All work →",
      allPosts: "All posts →",
    },
    about: {
      intro: [
        "Working out product details, writing code. I've worked in product management and software development, from planning and design through to implementation.",
        "I'm currently building Insert: a memo app for recording things I've tried or thought about, one line at a time. The records can be read back by task or by week.",
        "At university, my subject is geography. My seminar research looks at how machine learning and traditional statistical methods differ when studying vegetation and ecology.",
      ],
      timeline: [
        {
          id: "cyberagent-se",
          period: "2026.07 — Present",
          organization: "CyberAgent",
          role: "Software Engineer (Long-term Intern)",
          summary:
            "I develop backend and frontend applications with FastAPI, Google Cloud, and React at CyberACE – GrowthTech – CARU.",
        },
        {
          id: "google-ambassador",
          period: "2026.04 — Present",
          organization: "Google",
          role: "Campus Ambassador",
          summary:
            "I'm one of around 15 university and graduate students selected nationwide to work with the Gemini marketing team. I help plan and run events, build student communities, and coordinate with university faculty and STEM departments.",
        },
        {
          id: "cyberagent-go",
          period: "2026.02 — 2026.03",
          organization: "CyberAgent",
          role: "Backend Engineer (Go College)",
          summary:
            "I joined an internship focused on building APIs with Go. Alongside implementation, I learned how to separate responsibilities and design systems that are easier to change.",
        },
        {
          id: "layerx",
          period: "2025.08 — 2026.07",
          organization: "LayerX",
          role: "Product Manager / Product Marketing Manager (Long-term Intern)",
          summary:
            "I worked on product planning and improvements for Ai Workforce, an AI agent development platform, including new features and product strategy.",
        },
        {
          id: "hosei",
          period: "2024.04 — 2028.03 (Expected graduation)",
          organization: "Hosei University",
          role: "Geography",
          summary:
            "I study geography, with seminar research comparing machine learning and traditional statistical methods in vegetation and ecology studies.",
        },
      ],
    },
    nav: {
      openMenu: "Open menu",
      closeMenu: "Close menu",
      openCommandPalette: "Open command palette",
    },
    locale: {
      switchToJa: "日本語に切り替え",
      switchToEn: "Switch to English",
    },
  },
};
