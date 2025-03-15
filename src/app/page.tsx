'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 型定義を拡張（THREE.Object3DにisBoneプロパティを追加）
declare module 'three' {
  interface Object3D {
    isBone?: boolean;
  }
}

// 型定義
interface ModelData {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

interface Actions {
  [key: string]: THREE.AnimationAction;
}

// ThreeSceneコンポーネントのハンドル型定義
export interface ThreeSceneHandle {
  playDanceAnimation: (index: number) => void;
}

// モデルとモーションのパス定数
const MODEL_PATHS = {
  CHARACTER: '/3d/kawaii22.glb',  // メインキャラクターモデル
  DANCE_MOTION: '/3d/motion.glb',  // ダンスモーション
  DANCE_MUSIC: '/3d/idle.mp3'     // ダンス用BGM
} as const;

// ThreeSceneコンポーネントのプロパティ型定義
interface ThreeSceneProps {
  onModelLoaded: (loaded: boolean, error?: string) => void;
}

// ボーン名のマッピングテーブル
const boneMapping: { [key: string]: string } = {
  // motionのボーン名: kawaiiのボーン名
  'hips_JNT': 'J_Bip_C_Hips',
  'spine_JNT': 'J_Bip_C_Spine',
  'spine1_JNT': 'J_Bip_C_Chest',
  'spine2_JNT': 'J_Bip_C_UpperChest',
  'neck_JNT': 'J_Bip_C_Neck',
  'head_JNT': 'J_Bip_C_Head',

  // 左腕
  'l_shoulder_JNT': 'J_Bip_L_Shoulder',
  'l_arm_JNT': 'J_Bip_L_UpperArm',
  'l_forearm_JNT': 'J_Bip_L_LowerArm',
  'l_hand_JNT': 'J_Bip_L_Hand',

  // 右腕
  'r_shoulder_JNT': 'J_Bip_R_Shoulder',
  'r_arm_JNT': 'J_Bip_R_UpperArm',
  'r_forearm_JNT': 'J_Bip_R_LowerArm',
  'r_hand_JNT': 'J_Bip_R_Hand',

  // 左脚
  'l_upleg_JNT': 'J_Bip_L_UpperLeg',
  'l_leg_JNT': 'J_Bip_L_LowerLeg',
  'l_foot_JNT': 'J_Bip_L_Foot',
  'l_toebase_JNT': 'J_Bip_L_ToeBase',

  // 右脚
  'r_upleg_JNT': 'J_Bip_R_UpperLeg',
  'r_leg_JNT': 'J_Bip_R_LowerLeg',
  'r_foot_JNT': 'J_Bip_R_Foot',
  'r_toebase_JNT': 'J_Bip_R_ToeBase',

  // 指（左手）
  'l_handThumb1_JNT': 'J_Bip_L_Thumb1',
  'l_handThumb2_JNT': 'J_Bip_L_Thumb2',
  'l_handThumb3_JNT': 'J_Bip_L_Thumb3',
  'l_handIndex1_JNT': 'J_Bip_L_Index1',
  'l_handIndex2_JNT': 'J_Bip_L_Index2',
  'l_handIndex3_JNT': 'J_Bip_L_Index3',
  'l_handMiddle1_JNT': 'J_Bip_L_Middle1',
  'l_handMiddle2_JNT': 'J_Bip_L_Middle2',
  'l_handMiddle3_JNT': 'J_Bip_L_Middle3',
  'l_handRing1_JNT': 'J_Bip_L_Ring1',
  'l_handRing2_JNT': 'J_Bip_L_Ring2',
  'l_handRing3_JNT': 'J_Bip_L_Ring3',
  'l_handPinky1_JNT': 'J_Bip_L_Little1',
  'l_handPinky2_JNT': 'J_Bip_L_Little2',
  'l_handPinky3_JNT': 'J_Bip_L_Little3',

  // 指（右手）
  'r_handThumb1_JNT': 'J_Bip_R_Thumb1',
  'r_handThumb2_JNT': 'J_Bip_R_Thumb2',
  'r_handThumb3_JNT': 'J_Bip_R_Thumb3',
  'r_handIndex1_JNT': 'J_Bip_R_Index1',
  'r_handIndex2_JNT': 'J_Bip_R_Index2',
  'r_handIndex3_JNT': 'J_Bip_R_Index3',
  'r_handMiddle1_JNT': 'J_Bip_R_Middle1',
  'r_handMiddle2_JNT': 'J_Bip_R_Middle2',
  'r_handMiddle3_JNT': 'J_Bip_R_Middle3',
  'r_handRing1_JNT': 'J_Bip_R_Ring1',
  'r_handRing2_JNT': 'J_Bip_R_Ring2',
  'r_handRing3_JNT': 'J_Bip_R_Ring3',
  'r_handPinky1_JNT': 'J_Bip_R_Little1',
  'r_handPinky2_JNT': 'J_Bip_R_Little2',
  'r_handPinky3_JNT': 'J_Bip_R_Little3'
};

// モデルの重複読み込み防止フラグ - モジュールレベルで保持
let isLoading = false;

// ThreeSceneコンポーネント
const ThreeScene = forwardRef<ThreeSceneHandle, ThreeSceneProps>((props, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // アニメーション関連の状態
  const animationRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const modelRef = useRef<THREE.Group | null>(null);
  const actionsRef = useRef<Actions>({});
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const danceModelRef = useRef<ModelData | null>(null);
  const danceAnimationsRef = useRef<THREE.AnimationClip[]>([]);
  const isComponentMounted = useRef(false);

  // GLBモデルのパス
  const modelPath = MODEL_PATHS.CHARACTER;
  const dancePath = MODEL_PATHS.DANCE_MOTION;

  // アニメーションのリターゲット（骨格構造が異なる場合）
  const retargetAnimation = (clip: THREE.AnimationClip): THREE.AnimationClip => {
    const newClip = THREE.AnimationClip.parse(THREE.AnimationClip.toJSON(clip));
    const newTracks: THREE.KeyframeTrack[] = [];

    newClip.tracks.forEach(track => {
      const [boneName, property] = track.name.split('.');
      if (boneMapping[boneName]) {
        const newTrack = new THREE.KeyframeTrack(
          `${boneMapping[boneName]}.${property}`,
          track.times,
          track.values.slice()
        );
        newTracks.push(newTrack);
      }
    });

    return new THREE.AnimationClip(clip.name, clip.duration, newTracks);
  };

  // 外部アニメーションを処理する関数
  const processExternalAnimations = () => {
    if (!danceAnimationsRef.current.length || !modelRef.current || !mixerRef.current) {
      console.warn('アニメーションの処理に必要なデータが不足しています');
      return;
    }

    try {
      danceAnimationsRef.current.forEach((clip, index) => {
        const retargetedClip = retargetAnimation(clip);
        const action = mixerRef.current!.clipAction(retargetedClip);
        actionsRef.current[`dance_${index}`] = action;
      });
    } catch (error) {
      console.error('外部アニメーションの処理に失敗しました:', error);
    }
  };

  // モデルを読み込む関数
  const loadModels = async () => {
    if (isLoading) return;
    isLoading = true;

    try {
      const loader = new GLTFLoader();

      // メインモデルを読み込む
      const characterGltf = await loader.loadAsync(modelPath);
      modelRef.current = characterGltf.scene;

      // モデルを適切にスケールと位置を調整
      modelRef.current.scale.set(1.5, 1.5, 1.5);
      modelRef.current.position.set(0, 0, 0);

      // モデルをシーンに追加
      if (sceneRef.current) {
        sceneRef.current.add(modelRef.current);
      }

      // アニメーションミキサーの設定
      mixerRef.current = new THREE.AnimationMixer(modelRef.current);

      // 元のモデルのアニメーションをセットアップ
      if (characterGltf.animations && characterGltf.animations.length > 0) {
        characterGltf.animations.forEach((clip, index) => {
          const action = mixerRef.current!.clipAction(clip);
          actionsRef.current[`original_${index}`] = action;
        });
      }

      // ダンスモデルを読み込む
      const danceGltf = await loader.loadAsync(dancePath);
      danceModelRef.current = danceGltf;
      danceAnimationsRef.current = danceGltf.animations;

      // ダンスアニメーションを処理
      if (danceAnimationsRef.current.length > 0) {
        processExternalAnimations();
      }

      props.onModelLoaded(true);
    } catch (error) {
      console.error('モデルの読み込みに失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      props.onModelLoaded(false, errorMessage);
    } finally {
      isLoading = false;
    }
  };

  // アニメーションループ
  const animate = () => {
    if (!mountRef.current) return;

    const delta = clockRef.current.getDelta();

    // ミキサーのアップデート
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // コントロールのアップデート
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // レンダリング
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // シーンの初期化
  useEffect(() => {
    if (!mountRef.current || isComponentMounted.current) return;
    isComponentMounted.current = true;

    // シーンの設定
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000022);
    sceneRef.current = scene;

    // カメラの設定
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    cameraRef.current = camera;

    // レンダラーの設定
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // コントロールの設定
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.update();
    controlsRef.current = controls;

    // ライトの設定
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // グリッドヘルパー
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // 床の作成（リフレクション効果付き）
    const floorGeometry = new THREE.CircleGeometry(10, 64);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x6666aa,
      metalness: 0.9,
      roughness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 霧の追加
    scene.fog = new THREE.Fog(0x000022, 1, 15);

    // モデルの読み込み
    loadModels();

    // アニメーションの開始
    animate();

    // リサイズハンドラ
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }

      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }

      if (sceneRef.current) {
        // シーンのクリーンアップ
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            }
          }
        });
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      // 音声の停止とクリーンアップ
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      isComponentMounted.current = false;
    };
  }, []);

  // メソッドの公開
  useImperativeHandle(ref, () => ({
    // ダンスアニメーションを再生
    playDanceAnimation: (index: number) => {
      console.log(`playDanceAnimation(${index})が呼び出されました`);

      // 既存のアニメーションを停止
      if (currentActionRef.current) {
        currentActionRef.current.fadeOut(0.5);
        currentActionRef.current.stop();
      }

      // 音楽の再生
      if (!audioRef.current) {
        audioRef.current = new Audio(MODEL_PATHS.DANCE_MUSIC);
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(error => {
        console.warn('音楽の再生に失敗しました:', error);
      });

      // 指定されたインデックスのダンスアニメーションを再生
      const animationName = `dance_${index}`;
      if (mixerRef.current && actionsRef.current[animationName]) {
        currentActionRef.current = actionsRef.current[animationName];
        currentActionRef.current.reset();
        currentActionRef.current.fadeIn(0.5);
        currentActionRef.current.play();
        currentActionRef.current.setLoop(THREE.LoopRepeat, Infinity);
        console.log(`ダンスアニメーション ${index} を再生します`);
      } else {
        console.warn(`ダンスアニメーション ${animationName} は見つかりません`);
      }
    }
  }));

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ overflow: 'hidden' }}
    />
  );
});

ThreeScene.displayName = 'ThreeScene';

// Controlsコンポーネント
interface ControlsProps {
  onIntergalactiaDance: () => void;
  isModelLoaded: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  onIntergalactiaDance,
  isModelLoaded
}) => {
  // ボタンの共通クラス
  const buttonClass = `
    px-5 py-2.5
    rounded-lg
    font-medium
    text-white
    shadow-lg
    transition-all
    duration-200
    disabled:opacity-50
    disabled:cursor-not-allowed
    transform hover:-translate-y-1 hover:shadow-xl
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-opacity-50
  `;

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="absolute bottom-5 left-5 bg-black/70 p-4 rounded-lg text-white backdrop-blur-md shadow-lg z-10 flex flex-wrap gap-3 md:flex-row">
      <button
        onClick={onIntergalactiaDance}
        disabled={!isModelLoaded}
        className={`${buttonClass} bg-green-600 hover:bg-green-700 focus:ring-green-500`}
      >
        ダンスモーション
      </button>

      <button
        onClick={handleReset}
        className={`${buttonClass} bg-gray-600 hover:bg-gray-700 focus:ring-gray-500`}
      >
        リセット
      </button>
    </div>
  );
};

// ErrorNoticeコンポーネント
interface ErrorNoticeProps {
  isVisible: boolean;
  message?: string;
}

const ErrorNotice: React.FC<ErrorNoticeProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-16 left-5 right-5 bg-red-700/80 p-4 rounded-lg text-white text-sm leading-relaxed max-w-3xl z-10 animate-fade-in backdrop-blur-md shadow-lg">
      <h3 className="mt-0 text-lg font-bold mb-2 text-pink-100">⚠️ エラーが発生しました</h3>

      {message ? (
        <p>{message}</p>
      ) : (
        <>
          <p>このデモを実行するには、以下のGLBファイルが必要です：</p>
          <code className="bg-black/30 px-2 py-1 rounded font-mono inline-block m-1">{MODEL_PATHS.CHARACTER}</code>
          <code className="bg-black/30 px-2 py-1 rounded font-mono inline-block m-1">{MODEL_PATHS.DANCE_MOTION}</code>
          <p>GLBファイルを正しい場所に配置してから、ページを更新してください。</p>
        </>
      )}
    </div>
  );
};

// メインのHomeコンポーネント
const Home = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingStatus, setLoadingStatus] = useState('読み込み中...');
  const threeSceneRef = useRef<ThreeSceneHandle>(null);
  const loadStartTime = useRef<number>(Date.now());
  const isFirstLoad = useRef<boolean>(true);

  // アニメーション関数
  const handleIntergalactiaDance = () => {
    if (threeSceneRef.current) {
      threeSceneRef.current.playDanceAnimation(0);
    }
  };

  // モデルロード状態のハンドラー
  const handleModelLoad = (loaded: boolean, error?: string) => {
    console.log("モデルロード状態:", { loaded, error });

    // すでに一度ロードされている場合は重複処理を避ける
    if (isModelLoaded && !error && !isFirstLoad.current) {
      console.log("モデルはすでにロード済みです");
      return;
    }

    isFirstLoad.current = false;

    if (error) {
      setErrorMessage(error.includes("Not Found") ?
        "モデルファイルが見つかりません。GLBファイルを '/public/3d/' に配置してください。" :
        error
      );
      setLoadingStatus('モデル読み込みエラー');
    } else {
      const loadTime = Date.now() - loadStartTime.current;
      console.log(`モデル読み込み完了時間: ${loadTime}ms`);
      setIsModelLoaded(loaded);
      setLoadingStatus('');
      setErrorMessage('');
    }
  };

  // モデル読み込みの進行状況を表示
  useEffect(() => {
    loadStartTime.current = Date.now();

    const loadingTimer = setTimeout(() => {
      if (!isModelLoaded && !errorMessage) {
        setLoadingStatus('読み込み中...(少々お待ちください)');
      }
    }, 3000);

    return () => clearTimeout(loadingTimer);
  }, [isModelLoaded, errorMessage]);

  // インラインスタイル（Tailwindの不具合対策）
  const forceStyles = {
    container: {
      position: 'relative' as const,
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      zIndex: 0,
      background: '#111'
    },
    title: {
      textShadow: '0 0 10px rgba(255,255,255,0.5)'
    },
    threeContainer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1
    }
  };

  return (
    <div style={forceStyles.container} className="relative w-full h-screen overflow-hidden">
      {!isModelLoaded && !errorMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 p-4 rounded-lg text-white backdrop-blur-md z-20">
          <p className="text-center">{loadingStatus}</p>
        </div>
      )}

      <ErrorNotice
        isVisible={!!errorMessage}
        message={errorMessage}
      />

      <Controls
        onIntergalactiaDance={handleIntergalactiaDance}
        isModelLoaded={isModelLoaded}
      />

      <div
        style={forceStyles.threeContainer}
        className="absolute inset-0 z-1"
      >
        <ThreeScene
          ref={threeSceneRef}
          onModelLoaded={handleModelLoad}
        />
      </div>
    </div>
  );
};

export default Home;
