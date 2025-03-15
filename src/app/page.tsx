'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Type extension (adding isBone property to THREE.Object3D)
declare module 'three' {
  interface Object3D {
    isBone?: boolean;
  }
}

// Type definitions
interface ModelData {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

interface Actions {
  [key: string]: THREE.AnimationAction;
}

// ThreeScene component handle type definition
export interface ThreeSceneHandle {
  playDanceAnimation: (index: number) => void;
}

// Model and motion path constants
const MODEL_PATHS = {
  CHARACTER: '/3d/kawaii22.glb',  // Main character model
  DANCE_MOTION: '/3d/motion.glb',  // Dance motion
  DANCE_MUSIC: '/3d/idle.mp3'     // Dance BGM
} as const;

// ThreeScene component property type definition
interface ThreeSceneProps {
  onModelLoaded: (loaded: boolean, error?: string) => void;
}

// Bone name mapping table
const boneMapping: { [key: string]: string } = {
  // motion bone name: kawaii bone name
  'hips_JNT': 'J_Bip_C_Hips',
  'spine_JNT': 'J_Bip_C_Spine',
  'spine1_JNT': 'J_Bip_C_Chest',
  'spine2_JNT': 'J_Bip_C_UpperChest',
  'neck_JNT': 'J_Bip_C_Neck',
  'head_JNT': 'J_Bip_C_Head',

  // Left arm
  'l_shoulder_JNT': 'J_Bip_L_Shoulder',
  'l_arm_JNT': 'J_Bip_L_UpperArm',
  'l_forearm_JNT': 'J_Bip_L_LowerArm',
  'l_hand_JNT': 'J_Bip_L_Hand',

  // Right arm
  'r_shoulder_JNT': 'J_Bip_R_Shoulder',
  'r_arm_JNT': 'J_Bip_R_UpperArm',
  'r_forearm_JNT': 'J_Bip_R_LowerArm',
  'r_hand_JNT': 'J_Bip_R_Hand',

  // Left leg
  'l_upleg_JNT': 'J_Bip_L_UpperLeg',
  'l_leg_JNT': 'J_Bip_L_LowerLeg',
  'l_foot_JNT': 'J_Bip_L_Foot',
  'l_toebase_JNT': 'J_Bip_L_ToeBase',

  // Right leg
  'r_upleg_JNT': 'J_Bip_R_UpperLeg',
  'r_leg_JNT': 'J_Bip_R_LowerLeg',
  'r_foot_JNT': 'J_Bip_R_Foot',
  'r_toebase_JNT': 'J_Bip_R_ToeBase',

  // Finger (Left hand)
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

  // Finger (Right hand)
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

// Model load duplicate prevention flag - maintained at module level
let isLoading = false;

// ThreeScene component
const ThreeScene = forwardRef<ThreeSceneHandle, ThreeSceneProps>((props, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Animation-related state
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

  // GLB model paths
  const modelPath = MODEL_PATHS.CHARACTER;
  const dancePath = MODEL_PATHS.DANCE_MOTION;

  // Animation retargeting (for when bone structures are different)
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

  // Function to process external animations
  const processExternalAnimations = () => {
    if (!danceAnimationsRef.current.length || !modelRef.current || !mixerRef.current) {
      console.warn('Missing data required for animation processing');
      return;
    }

    try {
      danceAnimationsRef.current.forEach((clip, index) => {
        const retargetedClip = retargetAnimation(clip);
        const action = mixerRef.current!.clipAction(retargetedClip);
        actionsRef.current[`dance_${index}`] = action;
      });
    } catch (error) {
      console.error('Failed to process external animations:', error);
    }
  };

  // Function to load models
  const loadModels = async () => {
    if (isLoading) return;
    isLoading = true;

    try {
      const loader = new GLTFLoader();

      // Load main model
      const characterGltf = await loader.loadAsync(modelPath);
      modelRef.current = characterGltf.scene;

      // Adjust model scale and position
      modelRef.current.scale.set(1.5, 1.5, 1.5);
      modelRef.current.position.set(0, 0, 0);

      // Add model to scene
      if (sceneRef.current) {
        sceneRef.current.add(modelRef.current);
      }

      // Set up animation mixer
      mixerRef.current = new THREE.AnimationMixer(modelRef.current);

      // Set up original model animations
      if (characterGltf.animations && characterGltf.animations.length > 0) {
        characterGltf.animations.forEach((clip, index) => {
          const action = mixerRef.current!.clipAction(clip);
          actionsRef.current[`original_${index}`] = action;
        });
      }

      // Load dance model
      const danceGltf = await loader.loadAsync(dancePath);
      danceModelRef.current = danceGltf;
      danceAnimationsRef.current = danceGltf.animations;

      // Process dance animations
      if (danceAnimationsRef.current.length > 0) {
        processExternalAnimations();
      }

      props.onModelLoaded(true);
    } catch (error) {
      console.error('Failed to load model:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      props.onModelLoaded(false, errorMessage);
    } finally {
      isLoading = false;
    }
  };

  // Animation loop
  const animate = () => {
    if (!mountRef.current) return;

    const delta = clockRef.current.getDelta();

    // Update mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Rendering
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Scene initialization
  useEffect(() => {
    if (!mountRef.current || isComponentMounted.current) return;
    isComponentMounted.current = true;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000022);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.update();
    controlsRef.current = controls;

    // Light setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Floor creation (with reflection effect)
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

    // Fog addition
    scene.fog = new THREE.Fog(0x000022, 1, 15);

    // Load models
    loadModels();

    // Animation start
    animate();

    // Resize handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
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
        // Scene cleanup
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

      // Audio stop and cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      isComponentMounted.current = false;
    };
  }, []);

  // Method exposure
  useImperativeHandle(ref, () => ({
    // Play dance animation
    playDanceAnimation: (index: number) => {
      console.log(`playDanceAnimation(${index}) called`);

      // Stop existing animation
      if (currentActionRef.current) {
        currentActionRef.current.fadeOut(0.5);
        currentActionRef.current.stop();
      }

      // Music playback
      if (!audioRef.current) {
        audioRef.current = new Audio(MODEL_PATHS.DANCE_MUSIC);
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(error => {
        console.warn('Failed to play music:', error);
      });

      // Play specified dance animation
      const animationName = `dance_${index}`;
      if (mixerRef.current && actionsRef.current[animationName]) {
        currentActionRef.current = actionsRef.current[animationName];
        currentActionRef.current.reset();
        currentActionRef.current.fadeIn(0.5);
        currentActionRef.current.play();
        currentActionRef.current.setLoop(THREE.LoopRepeat, Infinity);
        console.log(`Playing dance animation ${index}`);
      } else {
        console.warn(`Dance animation ${animationName} not found`);
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

// Controls component
interface ControlsProps {
  onIntergalactiaDance: () => void;
  isModelLoaded: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  onIntergalactiaDance,
  isModelLoaded
}) => {
  // Common button class
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
        Dance Motion
      </button>

      <button
        onClick={handleReset}
        className={`${buttonClass} bg-gray-600 hover:bg-gray-700 focus:ring-gray-500`}
      >
        Reset
      </button>
    </div>
  );
};

// ErrorNotice component
interface ErrorNoticeProps {
  isVisible: boolean;
  message?: string;
}

const ErrorNotice: React.FC<ErrorNoticeProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-16 left-5 right-5 bg-red-700/80 p-4 rounded-lg text-white text-sm leading-relaxed max-w-3xl z-10 animate-fade-in backdrop-blur-md shadow-lg">
      <h3 className="mt-0 text-lg font-bold mb-2 text-pink-100">⚠️ An Error Occurred</h3>

      {message ? (
        <p>{message}</p>
      ) : (
        <>
          <p>The following GLB files are required to run this demo:</p>
          <code className="bg-black/30 px-2 py-1 rounded font-mono inline-block m-1">{MODEL_PATHS.CHARACTER}</code>
          <code className="bg-black/30 px-2 py-1 rounded font-mono inline-block m-1">{MODEL_PATHS.DANCE_MOTION}</code>
          <p>Please place the GLB files in the correct location and refresh the page.</p>
        </>
      )}
    </div>
  );
};

// Main Home component
const Home = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingStatus, setLoadingStatus] = useState('Loading...');
  const threeSceneRef = useRef<ThreeSceneHandle>(null);
  const loadStartTime = useRef<number>(Date.now());
  const isFirstLoad = useRef<boolean>(true);

  // Animation function
  const handleIntergalactiaDance = () => {
    if (threeSceneRef.current) {
      threeSceneRef.current.playDanceAnimation(0);
    }
  };

  // Model load state handler
  const handleModelLoad = (loaded: boolean, error?: string) => {
    console.log("Model load state:", { loaded, error });

    // Avoid duplicate processing if already loaded
    if (isModelLoaded && !error && !isFirstLoad.current) {
      console.log("Model is already loaded");
      return;
    }

    isFirstLoad.current = false;

    if (error) {
      setErrorMessage(error.includes("Not Found") ?
        "Model files not found. Please place GLB files in '/public/3d/'." :
        error
      );
      setLoadingStatus('Model loading error');
    } else {
      const loadTime = Date.now() - loadStartTime.current;
      console.log(`Model load completion time: ${loadTime}ms`);
      setIsModelLoaded(loaded);
      setLoadingStatus('');
      setErrorMessage('');
    }
  };

  // Model load progress display
  useEffect(() => {
    loadStartTime.current = Date.now();

    const loadingTimer = setTimeout(() => {
      if (!isModelLoaded && !errorMessage) {
        setLoadingStatus('Loading...(please wait)');
      }
    }, 3000);

    return () => clearTimeout(loadingTimer);
  }, [isModelLoaded, errorMessage]);

  // Inline styles (Tailwind compatibility workaround)
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
