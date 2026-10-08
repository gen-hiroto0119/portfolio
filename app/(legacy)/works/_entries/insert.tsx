const screens = [
  {
    name: "Write",
    description:
      "一行を書く画面。タスク名や「できた」「気づき」などのフラグは、必要なときだけ付けられます。",
  },
  {
    name: "Quick",
    description: "今日の記録を読む画面。その日に書いたことを、ひとつの流れで確認できます。",
  },
  {
    name: "Cycle",
    description: "タスクごとに記録をまとめた画面。前に試した方法や、そのときの考えをたどれます。",
  },
  {
    name: "Weekly",
    description:
      "一週間の記録を振り返る画面。日ごと・タスクごとに切り替えたり、Markdownでコピーしたりできます。",
  },
];

export function InsertContent() {
  return (
    <>
      <div className="prose-content mx-auto mb-12 w-full max-w-3xl sm:mb-16">
        <h2>途中で考えたことも、残しておく</h2>
        <p>
          「別の案を試した」「ここで迷っている」「次はこれをやる」。Insertは、作業の途中に出てくる短いメモを残すためのアプリです。完成した文章にまとめる前に、一行ずつ書き足していけます。
        </p>
        <p>
          タスク名を付けると、そのタスクの記録に。何も付けずに、メモだけを残すこともできます。
        </p>
      </div>

      <dl className="mx-auto mb-12 grid w-full max-w-5xl gap-x-12 gap-y-8 border-y border-border py-8 sm:mb-16 sm:grid-cols-2 sm:py-10">
        {screens.map((screen) => (
          <div key={screen.name}>
            <dt className="mb-2 text-base font-medium text-foreground">{screen.name}</dt>
            <dd className="text-base leading-8 text-muted-foreground">{screen.description}</dd>
          </div>
        ))}
      </dl>

      <div className="prose-content mx-auto w-full max-w-3xl">
        <h2>状態だけでなく、経緯を読む</h2>
        <p>
          「できた」「やめた」は、タスクの最終状態にするのではなく、そのときの出来事として記録します。一度「できた」と書いたタスクにも、続けてメモを書けます。
        </p>
        <p>
          画面に並ぶタスクや週ごとの振り返りは、積み重ねた記録から組み立てる設計です。過去の記録を残したまま、何を試し、どう考えたのかを読み返せるようにしています。
        </p>

        <h2>開発中のWebアプリ</h2>
        <p>
          現在は、Next.jsとTypeScriptでWeb版を開発しています。一行を書くところから、タスクや週ごとに読み返すところまでをつくっています。
        </p>
      </div>
    </>
  );
}
