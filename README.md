# 3D Model Demo - Next.js Version

This project is a web application that displays and manipulates 3D models (GLB format) in a web browser. Built with Next.js and TypeScript, it allows you to view 3D models and apply animations.

## Features

- Display and control 3D GLB models
- Play built-in animations (if available)
- Custom animation features (dance, etc.)
- Camera controls (drag to rotate around model, scroll to zoom)
- Responsive design support

## Technologies Used

- Next.js - React framework
- TypeScript - Type-safe JavaScript
- Three.js - 3D graphics rendering
- GLTFLoader - GLB file loading and animation

## Development Environment Setup

1. Install dependencies

```bash
npm install
```

2. Start development server

```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## Build and Production Deployment

1. Build the project

```bash
npm run build
```

2. Start production server

```bash
npm run start
```

## Model Files

The following model files are required:

- `/public/3d/kawaii22.glb` - Main 3D model
- `/public/3d/motion.glb` - Animation model

## Project Structure

```
3d-app/
├── public/               # Static files
│   └── 3d/              # 3D model files
│       ├── kawaii22.glb # Main 3D model
│       └── motion.glb   # Animation model
├── src/                 # Source code
│   ├── app/            # Next.js app directory
│   │   └── page.tsx    # Main page component
│   └── styles/         # Stylesheets
│       └── globals.css # Global styles
├── next.config.js      # Next.js configuration
├── package.json        # Dependencies
└── tsconfig.json      # TypeScript configuration
```

## Usage

1. Open the page to view the 3D model
2. Click "Dance Motion" button to start dance animation
3. Click "Reset" button to return the model to its initial pose

## Notes

- Animations may not work correctly depending on the internal structure of GLB models
- Requires a browser that supports WebGL
- Performance depends on the device being used


# How to create?
Youtubeの動画をダウンロードできればなんでもいいですが、自分はcobaltというサービスを利用しました
https://cobalt.tools/

あとはモーションを作ってくれるSaasのdeepemotionにサインアップします
deepemotion Signup
https://www.deepmotion.com/

動画をveedで編集して
- 20秒以内
- FPS(Frames Per Second) 30
を用意

https://www.veed.io

anime character
https://vroid.com/en/studio