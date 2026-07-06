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
        "問いを立て、組み、届ける。プロダクト・コード・デザインの交差点に。",
      scroll: "Scroll ↓",
      stackLabel: "My Stack",
      stackAriaLabel: "使用技術スタック",
    },
    home: {
      about: {
        p1: "プロダクト思考で問いを立て、エンジニアリングで組み、デザインで届ける——三つのレイヤーを分断せずに扱ってきました。マーケティング、プロダクトマネジメント、エンジニアリングと領域を横断してきました。",
        p2: "AIが実装を加速するいまだからこそ、「何をつくるか」と「どう届けるか」がより問われます。課題の本質から入り、最後まで形にすることを大切にしています。",
        link: "詳しく →",
      },
      allWorks: "すべての Works →",
      allPosts: "すべての記事 →",
    },
    about: {
      intro: [
        "プロダクト思考で問いを立て、エンジニアリングで組み、デザインで届ける——三つのレイヤーを分断せずに扱ってきました。マーケティング、プロダクトマネジメント、エンジニアリングと領域を横断してきました。",
        "現在は友人と共同創業した hyphen technologies で Tech Lead として、SEO / GEO / AIO に対応したコンテンツ運用自動化プラットフォーム「SCAS」をつくっています。",
        "AIが実装を加速するいまだからこそ、「何をつくるか」と「どう届けるか」がより問われます。課題の本質から入り、最後まで形にすることを大切にしています。",
      ],
      timeline: [
        {
          id: "cyberagent-se",
          period: "2026.07 — 現在",
          organization: "CyberAgent",
          role: "Software Engineer(長期インターン)",
          summary:
            "CyberACE – GrowthTech – CARU にて、FastAPI・Google Cloud Platform・React を用いたフルスタック開発に従事。",
        },
        {
          id: "google-ambassador",
          period: "2026.04 — 現在",
          organization: "Google",
          role: "Campus Ambassador",
          summary:
            "全国の大学・大学院から選抜された約15名の一人として、生成AI「Gemini」のマーケティングチームと協働。フィールドマーケティングを軸に、イベント企画・運営、学生コミュニティ形成、大学教授・理系学部との連携をアカウントマネジメントとして推進。",
        },
        {
          id: "hyphen",
          period: "2026.03 — 現在",
          organization: "hyphen technologies",
          role: "Co-founder / Tech Lead",
          summary:
            "「情報の非対称を、技術で解く。」を掲げるソフトウェア企業を友人と共同創業。SEO / GEO / AIO に対応したコンテンツ運用自動化プラットフォーム「SCAS」の開発を Tech Lead として主導。複数業種での PoC を経て 2026 年 6 月に β 提供を開始。",
        },
        {
          id: "cyberagent-go",
          period: "2026.02 — 2026.03",
          organization: "CyberAgent",
          role: "Backend Engineer(Go College)",
          summary:
            "Go 言語と API 開発を中心とした育成型インターン。実装力に加え、設計・責務分割・保守性と拡張性を意識した、システム全体を俯瞰する視点を養った。",
        },
        {
          id: "layerx",
          period: "2025.08 — 2026.07",
          organization: "LayerX",
          role: "Product Manager / Product Marketing Manager(長期インターン)",
          summary:
            "AIエージェント開発プラットフォーム「Ai Workforce」にて、プロダクト企画から仕様策定、改善提案まで従事。PdM として新機能開発とプロダクト戦略を主軸に、Agentic なシステム設計と AI ネイティブなプロダクト開発に深く関わる。ビジネスとエンジニアリングの間に立ち、市場理解と技術理解の両輪で意思決定を支えた。",
        },
        {
          id: "gmo",
          period: "2024.12 — 2025.07",
          organization: "GMO Internet Group",
          role: "マーケティングプランナー(長期インターン)",
          summary:
            "Google 広告・Yahoo! 広告の運用、予算管理、クリエイティブ改善、効果測定まで一連のプロセスを担当。事業部内で GEO・AIO・LLMO など最新技術活用のリードを担い、生成AI/LLM を業務高度化につなげた。",
        },
        {
          id: "hosei",
          period: "2024.04 — 2028.03(卒業見込)",
          organization: "法政大学",
          role: "地理学専攻",
          summary:
            "ゼミでは植生学・生態学における機械学習を利用した研究手法と、古典統計学手法の比較に取り組む。リベラルアーツと STEM を横断して学ぶ。",
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
        "Ask, build, deliver. At the intersection of product, code, and design.",
      scroll: "Scroll ↓",
      stackLabel: "My Stack",
      stackAriaLabel: "Technology stack",
    },
    home: {
      about: {
        p1: "I ask questions through product thinking, build through engineering, and deliver through design—without separating those three layers. I've worked across marketing, product management, and engineering.",
        p2: "As AI accelerates implementation, what to build and how to deliver matter more than ever. I start from the essence of the problem and see it through to the finish.",
        link: "Learn more →",
      },
      allWorks: "All Works →",
      allPosts: "All posts →",
    },
    about: {
      intro: [
        "I ask questions through product thinking, build through engineering, and deliver through design—without treating those three layers separately. I've worked across marketing, product management, and engineering.",
        "I'm currently building SCAS, a content operations automation platform for SEO / GEO / AIO, as Tech Lead at hyphen technologies, which I co-founded with a friend.",
        "As AI accelerates implementation, what to build and how to deliver matter more than ever. I start from the essence of the problem and see it through to the finish.",
      ],
      timeline: [
        {
          id: "cyberagent-se",
          period: "2026.07 — Present",
          organization: "CyberAgent",
          role: "Software Engineer (Long-term Intern)",
          summary:
            "Full-stack development with FastAPI, Google Cloud Platform, and React at CyberACE – GrowthTech – CARU.",
        },
        {
          id: "google-ambassador",
          period: "2026.04 — Present",
          organization: "Google",
          role: "Campus Ambassador",
          summary:
            "One of ~15 students selected nationwide from universities and graduate schools. Collaborated with the Gemini marketing team on field marketing, event planning and operations, student community building, and account management with professors and STEM faculties.",
        },
        {
          id: "hyphen",
          period: "2026.03 — Present",
          organization: "hyphen technologies",
          role: "Co-founder / Tech Lead",
          summary:
            "Co-founded a software company with the mission to \"resolve information asymmetry through technology.\" Lead development of SCAS, a content operations automation platform for SEO / GEO / AIO. Launched beta in June 2026 after PoCs across multiple industries.",
        },
        {
          id: "cyberagent-go",
          period: "2026.02 — 2026.03",
          organization: "CyberAgent",
          role: "Backend Engineer (Go College)",
          summary:
            "Development-focused internship centered on Go and API development. Built implementation skills along with a system-wide perspective on design, separation of concerns, maintainability, and extensibility.",
        },
        {
          id: "layerx",
          period: "2025.08 — 2026.07",
          organization: "LayerX",
          role: "Product Manager / Product Marketing Manager (Long-term Intern)",
          summary:
            "Worked on product planning, specification design, and improvement proposals for the AI agent development platform \"Ai Workforce.\" As PdM, focused on new feature development and product strategy, with deep involvement in agentic system design and AI-native product development. Bridged business and engineering with market and technical understanding.",
        },
        {
          id: "gmo",
          period: "2024.12 — 2025.07",
          organization: "GMO Internet Group",
          role: "Marketing Planner (Long-term Intern)",
          summary:
            "Managed end-to-end paid media operations for Google Ads and Yahoo! Ads, including budget management, creative optimization, and performance measurement. Led adoption of emerging technologies such as GEO, AIO, and LLMO, applying generative AI and LLMs to advance business operations.",
        },
        {
          id: "hosei",
          period: "2024.04 — 2028.03 (Expected graduation)",
          organization: "Hosei University",
          role: "Geography",
          summary:
            "Seminar research comparing machine learning approaches with classical statistical methods in vegetation and ecology studies. Pursuing an interdisciplinary path across liberal arts and STEM.",
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
