# Kawaii 3Dモデルデモ - Next.js版

このプロジェクトはKawaii 3Dモデル（GLB形式）をWebブラウザで表示・操作するWebアプリケーションです。Next.jsとTypeScriptを使用して、3Dモデルを表示し、アニメーションを適用することができます。

## 機能

- Kawaii GLBモデルの表示と操作
- 内蔵アニメーションの再生（存在する場合）
- カスタムアニメーション機能（ダンス、手を振るなど）
- カメラコントロール（ドラッグでモデルの周りを回転、スクロールでズーム）
- レスポンシブデザイン対応

## 使用技術

- Next.js - Reactフレームワーク
- TypeScript - 型安全なJavaScript
- Three.js - 3Dグラフィックスレンダリング
- GLTFLoader - GLBファイルのロードとアニメーション

## 開発環境のセットアップ

1. 依存関係をインストール

```bash
npm install
```

2. 開発サーバーを起動

```bash
npm run dev
```

3. ブラウザで http://localhost:3000 を開く

## ビルドと本番環境向けデプロイ

1. プロジェクトをビルド

```bash
npm run build
```

2. 本番環境向けにサーバーを起動

```bash
npm run start
```

## モデルファイル

以下のモデルファイルが必要です：

- `/public/3d/kawaii22.glb` - メインの3Dモデル
- `/public/3d/motion.glb` - アニメーション用3Dモデル

## プロジェクト構造

```
3d-app/
├── public/               # 静的ファイル
│   └── 3d/              # 3Dモデルファイル
│       ├── kawaii22.glb # メインの3Dモデル
│       └── motion.glb # アニメーション用3Dモデル
├── src/                 # ソースコード
│   ├── components/      # Reactコンポーネント
│   │   ├── Controls.tsx # コントロールパネル
│   │   ├── ErrorNotice.tsx # エラー通知
│   │   └── ThreeScene.tsx # Three.jsシーン
│   ├── pages/           # Next.jsページ
│   │   ├── _app.tsx     # アプリケーションコンポーネント
│   │   └── index.tsx    # ホームページ
│   └── styles/          # スタイルシート
│       ├── Controls.module.css
│       ├── ErrorNotice.module.css
│       └── globals.css  # グローバルスタイル
├── next.config.js       # Next.js設定
├── package.json         # 依存関係
└── tsconfig.json        # TypeScript設定
```

## 使用方法

1. ページを開くと、Kawaii 3Dモデルが表示されます
2. 「シンプルダンス」ボタンをクリックすると、ダンスアニメーションが開始されます
3. 「手を振る」ボタンをクリックすると、手を振るアニメーションが実行されます
4. 「基本アニメーション」ボタンをクリックすると、モデル内蔵アニメーションが再生されます
5. 「ダンスモーション」ボタンをクリックすると、外部モデルのアニメーションが適用されます
6. 「リセット」ボタンをクリックすると、モデルが初期ポーズに戻ります

## 注意事項

- GLBモデルの内部構造によっては、アニメーションが正常に動作しない場合があります
- WebGLをサポートしているブラウザが必要です
- パフォーマンスは使用しているデバイスに依存します
