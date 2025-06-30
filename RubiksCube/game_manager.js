import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from './assets/gsap/gsap-core.js'; 

class GameManager {
  constructor() {
    // SCENE 
    this.scene = new THREE.Scene();
    this.CSSOFFSET; 
    this.camera;
    this.keyLight;
    this.hemiLight; 
    this.renderer;

    //Snowflakes
    this.snowflakes; 

    //TIMER
    this.clock;
    this.robotoFont;
    this.timer = 0; 
    this.timerInterval = null;
    this.isPaused = false; 

    //RUBIKSCUBE
    this.cubelets;
    this.targetGroup;
    this.initialCubeletData = [];
    this.randomizationCubeletData = []; 
    this.bufferGrid = [
      [[], [], []], // For layer -1 (bottom)
      [[], [], []], // For layer 0 (middle)
      [[], [], []]  // For layer 1 (top)
    ];

    //SKINSWITCHER
    this.skins = ["PRIDE", "STANDARD", /*"CHRISTMAS",*/ "MYSTICAL", "GRITTY STEEL", "CARVED WOOD", "ABSTRACT FLUID", "OLD TOY", "FUTURISTIC", "ANIMALS", "PATTERN"];
    this.textureLoader; 
    this.preloadedTextures = {};
    this.currentSkinIndex; 
    this.currentSkinElement; 

    //INTERACTION
    this.controls;
    this.raycaster;
    this.movesCount;
    this.raycastHitObject;
    this.currentViewState;
    this.currentCoords;
    this.hitIndex; 
    this.VIEW_STATES = {
      FRONT: 'front',
      BACK: 'back',
      LEFT: 'left',
      RIGHT: 'right',
      TOP: 'top',
      BOTTOM: 'bottom'
  };

    //HUD
    this.container; 
    this.hud; 

    //STATES
    this.isSelected = false; 
    this.isAnimationPlaying = false;

    this.drawScene(); 
    this.loadCubeletsFromGLTF()
    this.createTimerFont(); 
    this.initRaycaster(); 
    this.preloadAllTextures();  
    this.resetMoves(); 
    this.initPauseButton();
    this.initResetCameraButton(); 
    this.startTimer();
    this.initializeGame(); 
  }

  initializeGame() {
    // Ensuring all elements are initialized before calling randomize
    if (this.cubelets && this.cubelets.children.length > 0) {
      this.randomize();  
    } else {
      setTimeout(() => this.initializeGame(), 100);
    }
  }

  initButtons() {
    this.initRandomizeButton(); 
    this.initRestartButton(); 
    this.initResetButton();    
  }

  createSnowflakes(numSnowflakes = 4000) {
    const snowflakeGeometry = new THREE.BufferGeometry();
    const snowflakePositions = new Float32Array(numSnowflakes * 3);
    const snowflakeRotations = new Float32Array(numSnowflakes * 3); 

    for (let i = 0; i < numSnowflakes; i++) {
        snowflakePositions[i * 3] = (Math.random() - 0.5) * 50;  
        snowflakePositions[i * 3 + 1] = Math.random() * 50;     
        snowflakePositions[i * 3 + 2] = Math.random() * 30 - 15;  
        // Store random rotation for each snowflake
        snowflakeRotations[i * 3] = Math.random() * Math.PI * 2;  
        snowflakeRotations[i * 3 + 1] = Math.random() * Math.PI * 2;
        snowflakeRotations[i * 3 + 2] = Math.random() * Math.PI * 2; 
    }

    snowflakeGeometry.setAttribute('position', new THREE.BufferAttribute(snowflakePositions, 3));
    snowflakeGeometry.setAttribute('rotation', new THREE.BufferAttribute(snowflakeRotations, 3)); 

    const snowflakeTexture = new THREE.TextureLoader().load('./assets/gui/Snowflake.png');
    snowflakeTexture.flipY = false;

    const snowflakeMaterial = new THREE.PointsMaterial({
        map: snowflakeTexture,
        size: 0.3,
        transparent: true,
        opacity: 0.9,
        alphaTest: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const snowflakes = new THREE.Points(snowflakeGeometry, snowflakeMaterial);
    return snowflakes;
}

animateSnowfall() {
    const positions = this.snowflakes.geometry.attributes.position.array;
    const numSnowflakes = positions.length / 3;

    for (let i = 0; i < numSnowflakes; i++) {
        const index = i * 3;
        positions[index + 1] -= 0.01; // Snowflakes falling speed

      
        if (positions[index + 1] <= 0) {
            positions[index + 1] = Math.random() * 50 + 20; 
            positions[index] = (Math.random() - 0.5) * 50;  
            positions[index + 2] = Math.random() * 30 - 15; 
        }
    }
    this.snowflakes.geometry.attributes.position.needsUpdate = true;
}



  drawScene() {
    this.container = document.getElementById('gameScene');
    this.CSSOFFSET = gameScene.getBoundingClientRect(); 
    // Set up the scene
    this.scene.background = new THREE.Color(0xD7D7D7);

    // Set up the camera
    this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(5, 4, 17);
    this.camera.lookAt(0, 0, 0);

    // Key Light 
    this.keyLight = new THREE.DirectionalLight(0xeeeeee, 1);
    this.keyLight.castShadow = true;
    this.camera.add(this.keyLight);

    this.keyLight2 = new THREE.DirectionalLight(0xeeeeee, 1);
    this.keyLight2.castShadow = true;
    this.camera.add(this.keyLight2);
    
    const ambiLight = new THREE.AmbientLight(0xeeeeee, 1);
    this.scene.add(ambiLight);
    this.scene.add(this.camera);

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    //this.effect = new OutlineEffect(this.renderer);

    // Set up OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.enableZoom = true;

    // Initialize clock
    this.clock = new THREE.Clock();
    this.textureLoader = new THREE.TextureLoader(); 

    //Initialize Snowflake Animation
    //this.snowflakes = this.createSnowflakes();
    //this.scene.add(this.snowflakes);

    //Start Rendering Loop 
    this.renderer.setAnimationLoop(this.custAnimate.bind(this));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  saveInitialCubeletData() {
    for (let i = 0; i < this.cubelets.children.length; i++) {
      const cubelet = this.cubelets.children[i];

      const data = {
        name: cubelet.name, 
        position: {
          x: cubelet.position.x,
          y: cubelet.position.y,
          z: cubelet.position.z
        },
        rotation: {
          x: cubelet.rotation.x,
          y: cubelet.rotation.y,
          z: cubelet.rotation.z
        }
      };

      this.initialCubeletData.push(data);
    }
  }


  resetCamera() {
    this.camera.position.set(5, 4, 17);
    this.camera.lookAt(0, 0, 0);

    if (this.controls) {
      // If using OrbitControls, update the controls after resetting the camera position
      this.controls.update();
  }
  }


  loadCubeletsFromGLTF() {

    const gltfLoader = new GLTFLoader();
    gltfLoader.load('assets/models/RubiksCube.gltf', (gltf) => {

      const model = gltf.scene;

      this.cubelets = new THREE.Group(); 

      for (let i = 1; i <= 27; i++) { 
        const childName = `Cubicle_${i.toString().padStart(2, '0')}`; // Generate names like Cubicle_01, Cubicle_02, etc.
        const currentChild = model.children[0].children.find(child => child.name === childName); // Find the child by name
        if (currentChild) { 
          this.cubelets.add(currentChild);

          // Calculate indices based on position
          const posX = Math.round(currentChild.position.x); 
          const posY = Math.round(currentChild.position.y);
          const posZ = Math.round(currentChild.position.z);

          // Ensure indices are within bounds for bufferGrid (0, 1, 2)
          const xIndex = posX + 1; 
          const yIndex = posY + 1;
          const zIndex = posZ + 1;

          this.bufferGrid[zIndex][yIndex][xIndex] = currentChild;
        } 
      }
      this.scene.add(this.cubelets);
      this.saveInitialCubeletData();
      this.initSkinSwitcher();  

    }, undefined, (error) => {
        console.error('An error occurred while loading the GLTF model:', error);
    });
  }


  createTimerFont() {
      this.updateTimerText();
      this.startTimer();
  }
  
  updateTimerText() {
    const hours = Math.floor(this.timer / 3600);
    const minutes = Math.floor((this.timer % 3600) / 60);
    const seconds = this.timer % 60;

    // Format hours, minutes, and seconds to HH:MM:SS
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = `${formattedTime}`;
    }
  }
  
  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  
    this.isPaused = false; 
    this.updateTimerText();  

    this.timerInterval = setInterval(() => {
      this.timer += 1; 
      this.updateTimerText(); 
    }, 1000);
  }

  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.isPaused = true; 
    }
  }

  zeroTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.timer = 0;
    this.isPaused = false; 
    this.updateTimerText();
  }

  custAnimate() {
    this.delta = this.clock.getDelta();
    //this.animateSnowfall();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    //this.effect.render(this.scene, this.camera );
  }

  calculateTopBottomViewAxis() {
    const cameraRotation = this.camera.rotation; 
    const rotX = THREE.MathUtils.radToDeg(cameraRotation.x);
    const rotZ = THREE.MathUtils.radToDeg(cameraRotation.z);
    // Handle Z 
    if(Math.abs(rotZ) >= -45 &&  Math.abs(rotZ) <= 45) {
      return 'lookingFromZ';
    }
    //Handle X
    else if(Math.abs(rotZ >= 45 && Math.abs(rotZ) <= 135)) {
      return 'lookingFromX';
    }
    //Handle -Z
    else if((rotZ > 135 && rotZ <= 180) || (rotZ < -135 && rotZ >= -180)) {
      return 'lookingFrom-Z';
    }
    //Handle -X
    else if(rotZ > -135 && rotZ < -45) {
      return 'lookingFrom-X';
    }
    else {
      console.warn("ERROR: Rotation Range not accounted for! Defaulting to Looking from Top: Front")
      return 'lookingFromZ';
    }
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  
  initRaycaster() {
    this.raycaster = new THREE.Raycaster(); 

    // Mouse events
    this.container.addEventListener('mousedown', this.onPointerStart = this.onPointerStart.bind(this));
    this.container.addEventListener('mouseup', this.onPointerEnd = this.onPointerEnd.bind(this));
    // Touch events
    this.container.addEventListener('touchstart', this.onPointerStart = this.onTouchStart.bind(this), { passive: true });
    this.container.addEventListener('touchend', this.onPointerEnd = this.onTouchEnd.bind(this), { passive: true });
  }

  getHitIndex(position) {
    const xIndex = Math.round(position.x / (1 + 0.1)) + 1; 
    const yIndex = Math.round(position.y / (1 + 0.1)) + 1;
    const zIndex = Math.round(position.z / (1 + 0.1)) + 1;

    return { xIndex, yIndex, zIndex }; 
  }

  getViewState() {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    if (Math.abs(direction.x) > Math.abs(direction.y) && Math.abs(direction.x) > Math.abs(direction.z)) {
      return direction.x > 0 ? this.VIEW_STATES.LEFT : this.VIEW_STATES.RIGHT;
    } else if (Math.abs(direction.y) > Math.abs(direction.x) && Math.abs(direction.y) > Math.abs(direction.z)) {
        return direction.y > 0 ? this.VIEW_STATES.BOTTOM : this.VIEW_STATES.TOP;
    } else {
        return direction.z > 0 ? this.VIEW_STATES.BACK : this.VIEW_STATES.FRONT;
    }
  }

  updateControlsBasedOnViewState() {
    this.currentViewState = this.getViewState(); 
    switch(this.currentViewState) {
      case  this.VIEW_STATES.LEFT:
        this.processSwipeForLeftRightViews();
        break; 
      case this.VIEW_STATES.RIGHT:
        this.processSwipeForLeftRightViews();
        break;
      case this.VIEW_STATES.FRONT:
        this.processSwipeForFrontBackViews();
        break; 
      case this.VIEW_STATES.BACK:
        this.processSwipeForFrontBackViews();
        break; 
      case this.VIEW_STATES.TOP:
        this.processSwipeForTopBottomViews();
        break; 
        case this.VIEW_STATES.BOTTOM: 
        this.processSwipeForTopBottomViews();
        break; 
    }

  }

  processSwipeForFrontBackViews() {
    const swipeDirection = this.getSwipeDirection(this.startCoords, this.currentCoords);
    const { xIndex, yIndex, zIndex } = this.hitIndex;

    switch(this.currentViewState) {
      case 'front': 
        switch (swipeDirection) {
          case 'swipeLeft':
          case 'swipeRight':
            for (let z = 0; z < 3; z++) {
                for (let x = 0; x < 3; x++) {
                    const cubelet = this.bufferGrid[z][yIndex][x];
                    if (cubelet) this.targetGroup.add(cubelet);
                }
            }
            // HORIZONTAL SWIPE SETTINGS
            const rotationY = swipeDirection === 'swipeLeft' ? -Math.PI / 2 : Math.PI / 2;
            this.GSAPAnimateFromTo(0, rotationY, 0);  
            break;
          case 'swipeUp':
          case 'swipeDown':
            for (let z = 0; z < 3; z++) {
                for (let y = 0; y < 3; y++) {
                    const cubelet = this.bufferGrid[z][y][xIndex];
                    if (cubelet) this.targetGroup.add(cubelet);
                }
            }
            // VERTICAL SWIPE SETTINGS
            const rotationX = swipeDirection === 'swipeUp' ? Math.PI / 2 : -Math.PI / 2;
            this.GSAPAnimateFromTo(rotationX, 0, 0);  
            break;
        }
        break; 
      case 'back':
        switch (swipeDirection) {
          case 'swipeLeft':
          case 'swipeRight':
            for (let z = 0; z < 3; z++) {
                for (let x = 0; x < 3; x++) {
                    const cubelet = this.bufferGrid[z][yIndex][x];
                    if (cubelet) this.targetGroup.add(cubelet);
                }
            }
            // HORIZONTAL SWIPE SETTINGS
            const rotationY = swipeDirection === 'swipeLeft' ? -Math.PI / 2 : Math.PI / 2;
            this.GSAPAnimateFromTo(0, rotationY, 0);  
            break;
          case 'swipeUp':
          case 'swipeDown':
            for (let z = 0; z < 3; z++) {
                for (let y = 0; y < 3; y++) {
                    const cubelet = this.bufferGrid[z][y][xIndex];
                    if (cubelet) this.targetGroup.add(cubelet);
                }
            }
            // VERTICAL SWIPE SETTINGS
            const rotationX = swipeDirection === 'swipeUp' ? -Math.PI / 2 : Math.PI / 2;
            this.GSAPAnimateFromTo(rotationX, 0, 0);  
            break;
        }
        break; 
    }

  }

  processSwipeForLeftRightViews() {
    const swipeDirection = this.getSwipeDirection(this.startCoords, this.currentCoords);
    const { xIndex, yIndex, zIndex } = this.hitIndex;

    switch(this.currentViewState) {
      case 'left': 
        switch (swipeDirection) {
          case 'swipeLeft':
          case 'swipeRight':
            for (let z = 0; z < 3; z++) {
                for (let x = 0; x < 3; x++) {
                    const cubelet = this.bufferGrid[z][yIndex][x];
                    if (cubelet) this.targetGroup.add(cubelet);
                }
            }
            // HORIZONTAL SWIPE SETTINGS
            const rotationY = swipeDirection === 'swipeLeft' ? -Math.PI / 2 : Math.PI / 2;
            this.GSAPAnimateFromTo(0, rotationY, 0);  
            break;
          case 'swipeUp':
          case 'swipeDown':
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 3; y++) {
                    const cubelet = this.bufferGrid[zIndex][y][x];
                    if (cubelet) this.targetGroup.add(cubelet);
                }
            }
            // VERTICAL SWIPE SETTINGS
            const rotationZ = swipeDirection === 'swipeUp' ? Math.PI / 2 : -Math.PI / 2;
            this.GSAPAnimateFromTo(0, 0, rotationZ);  
            break;
        }
        break; 
      case 'right':
        switch (swipeDirection) {
          case 'swipeLeft':
          case 'swipeRight':
            for (let z = 0; z < 3; z++) {
                for (let x = 0; x < 3; x++) {
                    const cubelet = this.bufferGrid[z][yIndex][x];
                    if (cubelet) this.targetGroup.add(cubelet);
                }
            }
            // HORIZONTAL SWIPE SETTINGS
            const rotationY = swipeDirection === 'swipeLeft' ? -Math.PI / 2 : Math.PI / 2;
            this.GSAPAnimateFromTo(0, rotationY, 0); 
            break;
          case 'swipeUp':
          case 'swipeDown':
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 3; y++) {
                    const cubelet = this.bufferGrid[zIndex][y][x];
                    if (cubelet) this.targetGroup.add(cubelet);
                }
            }
            // VERTICAL SWIPE SETTINGS
            const rotationZ = swipeDirection === 'swipeUp' ? -Math.PI / 2 : Math.PI / 2;
            this.GSAPAnimateFromTo(0, 0, rotationZ); 
            break;
        }
        break; 
    }

  }

  processSwipeForTopBottomViews() {
    const swipeDirection = this.getSwipeDirection(this.startCoords, this.currentCoords);
    const { xIndex, yIndex, zIndex } = this.hitIndex;
    const topBottomViewAxis = this.calculateTopBottomViewAxis();

    switch(topBottomViewAxis) {
      case 'lookingFromZ': 
        switch(this.currentViewState) {
          case 'top': 
            switch (swipeDirection) {
              case 'swipeLeft':
              case 'swipeRight':
                for (let x = 0; x < 3; x++) {
                  for (let y = 0; y < 3; y++) {
                        const cubelet = this.bufferGrid[zIndex][y][x];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // HORIZONTAL SWIPE SETTINGS
                const rotationZ = swipeDirection === 'swipeLeft' ? Math.PI / 2 : -Math.PI / 2;
                this.GSAPAnimateFromTo(0, 0, rotationZ);  
                break;
              case 'swipeUp':
              case 'swipeDown':
                for (let y = 0; y < 3; y++) {
                    for (let z = 0; z < 3; z++) {
                        const cubelet = this.bufferGrid[z][y][xIndex];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // VERTICAL SWIPE SETTINGS
                const rotationX = swipeDirection === 'swipeUp' ? Math.PI / 2 : -Math.PI / 2;
                this.GSAPAnimateFromTo(rotationX, 0, 0);  
                break;
            }
            break; 
          case 'bottom':
            switch (swipeDirection) {
              case 'swipeLeft':
              case 'swipeRight':
                for (let x = 0; x < 3; x++) {
                    for (let y = 0; y < 3; y++) {
                        const cubelet = this.bufferGrid[zIndex][y][x];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // HORIZONTAL SWIPE SETTINGS
                const rotationZ = swipeDirection === 'swipeLeft' ? -Math.PI / 2 : Math.PI / 2;
                this.GSAPAnimateFromTo(0, 0, rotationZ);  
                break;
              case 'swipeUp':
              case 'swipeDown':
                for (let y = 0; y < 3; y++) {
                  for (let z = 0; z < 3; z++) {
                        const cubelet = this.bufferGrid[z][y][xIndex];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // VERTICAL SWIPE SETTINGS
                const rotationX = swipeDirection === 'swipeUp' ? Math.PI / 2 : -Math.PI / 2;
                this.GSAPAnimateFromTo(rotationX, 0, 0); 
                break;
            }
            break; 
        }
        break;
      case 'lookingFrom-Z': 
        switch(this.currentViewState) {
          case 'top': 
            switch (swipeDirection) {
              case 'swipeLeft':
              case 'swipeRight':
                for (let x = 0; x < 3; x++) {
                  for (let y = 0; y < 3; y++) {
                        const cubelet = this.bufferGrid[zIndex][y][x];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // HORIZONTAL SWIPE SETTINGS
                const rotationZ = swipeDirection === 'swipeLeft' ? -Math.PI / 2 : Math.PI / 2;
                this.GSAPAnimateFromTo(0, 0, rotationZ);  
                break;
              case 'swipeUp':
              case 'swipeDown':
                for (let y = 0; y < 3; y++) {
                    for (let z = 0; z < 3; z++) {
                        const cubelet = this.bufferGrid[z][y][xIndex];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // VERTICAL SWIPE SETTINGS
                const rotationX = swipeDirection === 'swipeUp' ? -Math.PI / 2 : Math.PI / 2;
                this.GSAPAnimateFromTo(rotationX, 0, 0); 
                break;
            }
            break; 
          case 'bottom':
            switch (swipeDirection) {
              case 'swipeLeft':
              case 'swipeRight':
                for (let x = 0; x < 3; x++) {
                    for (let y = 0; y < 3; y++) {
                        const cubelet = this.bufferGrid[zIndex][y][x];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // HORIZONTAL SWIPE SETTINGS
                const rotationZ = swipeDirection === 'swipeLeft' ? Math.PI / 2 : -Math.PI / 2;
                this.GSAPAnimateFromTo(0, 0, rotationZ); 
                break;
              case 'swipeUp':
              case 'swipeDown':
                for (let y = 0; y < 3; y++) {
                  for (let z = 0; z < 3; z++) {
                        const cubelet = this.bufferGrid[z][y][xIndex];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // VERTICAL SWIPE SETTINGS
                const rotationX = swipeDirection === 'swipeUp' ? -Math.PI / 2 : Math.PI / 2;
                this.GSAPAnimateFromTo(rotationX, 0, 0);  
                break;
            }
            break; 
        }
        break; 
      case 'lookingFromX': 
        switch(this.currentViewState) {
          case 'top': 
            switch (swipeDirection) {
              case 'swipeLeft':
              case 'swipeRight':
                for (let z = 0; z < 3; z++) {
                  for (let y = 0; y < 3; y++) {
                        const cubelet = this.bufferGrid[z][y][xIndex];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // HORIZONTAL SWIPE SETTINGS
                const rotationX = swipeDirection === 'swipeLeft' ? Math.PI / 2 : -Math.PI / 2;
                this.GSAPAnimateFromTo(rotationX, 0, 0);  
                break;
              case 'swipeUp':
              case 'swipeDown':
                for (let y = 0; y < 3; y++) {
                    for (let x = 0; x < 3; x++) {
                        const cubelet = this.bufferGrid[zIndex][y][x];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // VERTICAL SWIPE SETTINGS
                const rotationZ = swipeDirection === 'swipeUp' ? -Math.PI / 2 : Math.PI / 2;
                this.GSAPAnimateFromTo(0, 0, rotationZ);  
                break;
            }
            break; 
          case 'bottom':
            switch (swipeDirection) {
              case 'swipeLeft':
              case 'swipeRight':
                for (let z = 0; z < 3; z++) {
                  for (let y = 0; y < 3; y++) {
                        const cubelet = this.bufferGrid[z][y][xIndex];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // HORIZONTAL SWIPE SETTINGS
                const rotationX = swipeDirection === 'swipeLeft' ? Math.PI / 2 : -Math.PI / 2;
                this.GSAPAnimateFromTo(rotationX, 0, 0);  
                break;
              case 'swipeUp':
              case 'swipeDown':
                for (let y = 0; y < 3; y++) {
                  for (let x = 0; x < 3; x++) {
                        const cubelet = this.bufferGrid[zIndex][y][x];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // VERTICAL SWIPE SETTINGS
                const rotationZ = swipeDirection === 'swipeUp' ? Math.PI / 2 : -Math.PI / 2;
                this.GSAPAnimateFromTo(0, 0, rotationZ);  
                break;
            }
            break; 
        }
        break;
      case 'lookingFrom-X': 
        switch(this.currentViewState) {
          case 'top': 
            switch (swipeDirection) {
              case 'swipeLeft':
              case 'swipeRight':
                for (let z = 0; z < 3; z++) {
                  for (let y = 0; y < 3; y++) {
                        const cubelet = this.bufferGrid[z][y][xIndex];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // HORIZONTAL SWIPE SETTINGS
                const rotationX = swipeDirection === 'swipeLeft' ? -Math.PI / 2 : Math.PI / 2;
                this.GSAPAnimateFromTo(rotationX, 0, 0);  
                break;
              case 'swipeUp':
              case 'swipeDown':
                for (let y = 0; y < 3; y++) {
                    for (let x = 0; x < 3; x++) {
                        const cubelet = this.bufferGrid[zIndex][y][x];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // VERTICAL SWIPE SETTINGS
                const rotationZ = swipeDirection === 'swipeUp' ? Math.PI / 2 : -Math.PI / 2;
                this.GSAPAnimateFromTo(0, 0, rotationZ);  
                break;
            }
            break; 
          case 'bottom':
            switch (swipeDirection) {
              case 'swipeLeft':
              case 'swipeRight':
                for (let z = 0; z < 3; z++) {
                  for (let y = 0; y < 3; y++) {
                        const cubelet = this.bufferGrid[z][y][xIndex];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // HORIZONTAL SWIPE SETTINGS
                const rotationX = swipeDirection === 'swipeLeft' ? -Math.PI / 2 : Math.PI / 2;
                this.GSAPAnimateFromTo(rotationX, 0, 0);  
                break;
              case 'swipeUp':
              case 'swipeDown':
                for (let y = 0; y < 3; y++) {
                  for (let x = 0; x < 3; x++) {
                        const cubelet = this.bufferGrid[zIndex][y][x];
                        if (cubelet) this.targetGroup.add(cubelet);
                    }
                }
                // VERTICAL SWIPE SETTINGS
                const rotationZ = swipeDirection === 'swipeUp' ? -Math.PI / 2 : Math.PI / 2;
                this.GSAPAnimateFromTo(0, 0, rotationZ);  
                break;
            }
            break; 
        }
        break;
    }
  }

  GSAPAnimateFromTo(rotationX, rotationY, rotationZ) {
    this.isAnimating = true; 
    gsap.to(this.targetGroup.rotation, {
        duration: 0.5,
        x: this.targetGroup.rotation.x + rotationX,
        y: this.targetGroup.rotation.y + rotationY,
        z: this.targetGroup.rotation.z + rotationZ,
        ease: "power1.out",
        onComplete: () => {
            this.getWorldPositionAndRotation();
            this.removeGroupParent(); 
            this.updateBufferGrid(); // Update buffer grid after clearing
            this.isSwiping = false; 
            this.controls.enabled = true;
            this.isAnimating = false; 
        }
    });
  }

  onPointerStart(event) {
    if (this.isAnimating || this.isPaused ) return; 

    const isTouchEvent = event.type === 'touchstart';  
    const currentCoords = this.getPointerCoords(event, isTouchEvent); 
    this.raycaster.setFromCamera(currentCoords, this.camera);
    const intersections = this.raycaster.intersectObjects(this.cubelets.children, true);
    
    if(intersections.length > 0 ) {
        this.isSwiping = true; 
        this.startCoords = this.getPointerCoords(event, isTouchEvent);
        this.controls.enabled = false; 
        this.raycastHitObject = intersections[0].object;
      }
  }


  onPointerEnd(event) {
    const isTouchEvent = event.type === 'touchend';


    if (!this.isSwiping) {
      this.controls.enabled = true;  
      return;
    } 
  
    if (this.isAnimating) {
        this.controls.enabled = false;
        return;
    }

    if (this.isPaused) {
      this.controls.enabled = false; 
      return; 
    }
      
    this.hitIndex = this.getHitIndex(this.raycastHitObject.position);
    this.currentViewState = this.getViewState();
    this.currentCoords = this.getPointerCoords(event, isTouchEvent); 
    this.increaseMovesCounter();

    // Determine which group to rotate based on the swipe direction
    this.targetGroup = new THREE.Group(); 
    this.scene.add(this.targetGroup);  
  
    this.updateControlsBasedOnViewState();
  }

  getWorldPositionAndRotation() {
    // Create a copy of the targetGroup children
    const childrenCopy = [...this.targetGroup.children];

    childrenCopy.forEach(cubelet => {
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      cubelet.getWorldPosition(worldPosition);
      cubelet.getWorldQuaternion(worldQuaternion);
    }); 
  }

  removeGroupParent() {
    // Create a copy of the targetGroup children
    const childrenCopy = [...this.targetGroup.children];

    childrenCopy.forEach(cubelet => {
        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        cubelet.getWorldPosition(worldPosition);
        cubelet.getWorldQuaternion(worldQuaternion);
        cubelet.position.copy(worldPosition);
        cubelet.quaternion.copy(worldQuaternion);

        // Remove from targetGroup and add to cubelets
        this.targetGroup.remove(cubelet);
        this.cubelets.add(cubelet);
    });
  }

  updateBufferGrid() {
    // Clear the buffer grid
    this.bufferGrid = [
      [[], [], []],
      [[], [], []],
      [[], [], []]
    ];
  
    this.cubelets.children.forEach(cubelet => {
      const xIndex = Math.round(cubelet.position.x) + 1; 
      const yIndex = Math.round(cubelet.position.y) + 1;
      const zIndex = Math.round(cubelet.position.z) + 1;
  
      // Ensure indices are within bounds (0, 1, 2)
      if (xIndex >= 0 && xIndex < 3 && yIndex >= 0 && yIndex < 3 && zIndex >= 0 && zIndex < 3) {
        this.bufferGrid[zIndex][yIndex][xIndex] = cubelet; // Update the buffer grid
      }
    });
  }

  getPointerCoords(event, isTouchEvent = false) {
    let x, y;

    if (isTouchEvent) {
        const touch = event.touches[0] || event.changedTouches[0]; 
        // Adjust the touch coordinates based on the game scene's position
        x = (touch.clientX - this.CSSOFFSET.left) / this.container.offsetWidth * 2 - 1;
        y = -(touch.clientY - this.CSSOFFSET.top) / this.container.offsetHeight * 2 + 1;
    } else {
        // Mouse event
        x = (event.clientX - this.CSSOFFSET.left) / this.container.offsetWidth * 2 - 1;
        y = -(event.clientY - this.CSSOFFSET.top) / this.container.offsetHeight * 2 + 1;
    }

    // Return normalized coordinates (between -1 and 1) relative to the #gameScene
    return { x, y };
}

  onTouchStart(event) { 

    if (event.touches.length > 1) {
      this.controls.enableZoom = false; 
      return; 
    }    
    // Raycasting logic for single touch interactions
    const touchCoords = this.getPointerCoords(event, true);
    this.raycaster.setFromCamera(touchCoords, this.camera);
    const intersections = this.raycaster.intersectObjects(this.cubelets.children, true);

    if (intersections.length > 0) {
      this.isSwiping = true;
      this.startCoords = touchCoords;
      this.controls.enabled = false;
      this.raycastHitObject = intersections[0].object;
    }
  }

    
  onTouchEnd(event) {
    if (!this.isSwiping) {
      this.controls.enabled = true;  
      return;
    }
  
    if (this.isAnimating) {
      this.controls.enabled = true; 
      return;
    }

    if (this.isPaused) {
      this.controls.enabled = false; 
      return; 
    }
  
    this.hitIndex = this.getHitIndex(this.raycastHitObject.position);
    this.currentViewState = this.getViewState();
    this.currentCoords = this.getPointerCoords(event, true);  
    this.increaseMovesCounter();
    
    this.targetGroup = new THREE.Group(); 
    this.scene.add(this.targetGroup);  
  
    this.updateControlsBasedOnViewState();
  }

  getSwipeDirection(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y; 

    if(Math.abs(dx) > Math.abs(dy)) {
      return dx < 0 ? 'swipeLeft' : 'swipeRight';
    }
    else {
      return dy < 0 ? 'swipeUp' : 'swipeDown';
    }
  }

  resetCubelets() {
    //Apply initial Rotation and Position
    this.cubelets.children.forEach(cubelet => {
      const savedData = this.initialCubeletData.find(data => data.name === cubelet.name);
      
      if (savedData) {
        // Apply saved position
        cubelet.position.set(
          savedData.position.x,
          savedData.position.y,
          savedData.position.z
        );
  
        // Apply saved rotation
        cubelet.rotation.set(
          savedData.rotation.x,
          savedData.rotation.y,
          savedData.rotation.z
        );
      }
    });

    //Sort the this.cubelets array
    this.cubelets.children.sort((a, b) => {
      // Extract numerical values from the names
      const numA = parseInt(a.name.replace("Cubicle_", ""), 10); // e.g., "Cubicle_01" => 1
      const numB = parseInt(b.name.replace("Cubicle_", ""), 10); // e.g., "Cubicle_02" => 2
  
      return numA - numB; // Sort in ascending order
    });

  }

  resetCubeletsToRandomizationState() {
    //Apply initial Rotation and Position
    this.cubelets.children.forEach(cubelet => {
      const savedData = this.randomizationCubeletData.find(data => data.name === cubelet.name);
      
      if (savedData) {
        // Apply saved position
        cubelet.position.set(
          savedData.position.x,
          savedData.position.y,
          savedData.position.z
        );
  
        // Apply saved rotation
        cubelet.rotation.set(
          savedData.rotation.x,
          savedData.rotation.y,
          savedData.rotation.z
        );
      }
    });

    this.cubelets.children.sort((a, b) => {
      // Extract numerical values from the names
      const numA = parseInt(a.name.replace("Cubicle_", ""), 10); // e.g., "Cubicle_01" => 1
      const numB = parseInt(b.name.replace("Cubicle_", ""), 10); 
  
      return numA - numB; 
    });
  }
  
  resetGame() {
    this.resetCubelets();
    this.updateBufferGrid(); 
    this.startTimer(); 
  }

  randomize() {
    this.zeroTimer(); 
    this.currentIteration = 0; 
    this.simulateSwipe(); 
  }

  toggleHUDButtons(isDisabled) {
    const buttons = document.querySelectorAll('.hud .button');
    buttons.forEach(button => {
      if (isDisabled) {
        button.classList.add('disabled');
      } else {
        button.classList.remove('disabled');
      }
    });
  }

  simulateSwipe() {
    this.targetGroup = new THREE.Group();     
    let direction = Math.random() < 0.5 ? -1 : 1; 
    const isRowSelection = Math.random() < 0.5; 

    if (isRowSelection) {
        const rowIndex = Math.floor(Math.random() * 3);        
        for (let x = 0; x < 3; x++) {
            for (let z = 0; z < this.bufferGrid.length; z++) {  // Loop through layers
                const cubelet = this.bufferGrid[z][rowIndex][x];
                if (cubelet) {
                    this.targetGroup.add(cubelet);
                }
            }
        }
        this.GSAPSimulateRandomization(0, (direction) * Math.PI / 2, 0);  
    } else {
        const colIndex = Math.floor(Math.random() * 3);
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < this.bufferGrid.length; z++) {
                const cubelet = this.bufferGrid[z][y][colIndex];
                if (cubelet) {
                    this.targetGroup.add(cubelet);
                }
            }
        }
        this.GSAPSimulateRandomization((direction) * Math.PI / 2, 0, 0);  
    }
    this.scene.add(this.targetGroup);
  }

  GSAPSimulateRandomization(rotationX, rotationY, rotationZ) {
      this.isAnimating = true; 
      gsap.to(this.targetGroup.rotation, {
          duration: 0.15,
          x: this.targetGroup.rotation.x + rotationX,
          y: this.targetGroup.rotation.y + rotationY,
          z: this.targetGroup.rotation.z + rotationZ,
          ease: "power1.out",
          onComplete: () => {
              this.currentIteration++; 
              this.getWorldPositionAndRotation();
              this.removeGroupParent(); 
              this.updateBufferGrid(); 
              if (this.currentIteration < 50) {
                  this.simulateSwipe(); 
              }
              else {
                this.saveRandomizationState(); 
                this.isAnimating = false;
                this.toggleHUDButtons(false);
                this.startTimer();
                this.enablePauseButton();

              }
          }
      });
  }

  
  initRandomizeButton() {
    this.hud = document.getElementById('randomizeButton');
    this.hud.addEventListener('click', () => { 
      this.toggleHUDButtons(true);
      this.randomize();
    });
  }

  initRestartButton() {
    this.hud = document.getElementById('restartButton');
    this.hud.addEventListener('click', () => { 
        this.restartGame(); 
    });
  }

  restartGame() {
    if (this.randomizationCubeletData.length === 0) {
      console.log("Rubiks Cube was never randomized. Process skipped.");
    }
    else {
      this.resetCubeletsToRandomizationState(); 
      this.updateBufferGrid(); 
      this.startTimer(); 
      console.log("Restarted Game Based on last Randomization");
    }

  }

  saveRandomizationState() {
    this.randomizationCubeletData = []; 
    for (let i = 0; i < this.cubelets.children.length; i++) {
      const cubelet = this.cubelets.children[i];

      const data = {
        name: cubelet.name, 
        position: {
          x: cubelet.position.x,
          y: cubelet.position.y,
          z: cubelet.position.z
        },
        rotation: {
          x: cubelet.rotation.x,
          y: cubelet.rotation.y,
          z: cubelet.rotation.z
        }
      };

      this.randomizationCubeletData.push(data);
    }
  }

  initResetButton() {
    this.hud = document.getElementById('resetButton');
    this.hud.addEventListener('click', () => { 
        this.resetGame(); 
    });
  }

  initPauseButton() {
    const pauseButton = document.getElementById('pauseButton');
    const pauseImage = pauseButton.querySelector('img'); 

    pauseButton.addEventListener('click', () => {
        if (this.isPaused) {
            this.startTimer();
            pauseImage.src = './assets/gui/Pause.png'; 
            pauseImage.alt = 'Pause'; 
        } 
        else {
          this.pauseTimer();
          pauseImage.src = './assets/gui/Play.png'; 
          pauseImage.alt = 'Play'; 
        }
    });
  }

  enablePauseButton() {
    const pauseButton = document.getElementById('pauseButton');
    pauseButton.disabled = false; 
    const img = pauseButton.querySelector('img'); 
    if (img) {
        img.src = './assets/gui/Pause.png'; 
    }
  }

  initResetCameraButton() {
    const resetCameraButton = document.getElementById('resetCameraButton');
    resetCameraButton.addEventListener('click', () => {
      this.resetCamera();
      });
  }

  preloadAllTextures() {
    const allTextures = {
      "STANDARD": {
        map: './assets/textures/STANDARD/Rubik_unwrap.png',
      },
      "FUTURISTIC": {
        map: './assets/textures/TRON/TRON_Base_color.jpg',
        normalMap: './assets/textures/TRON/TRON_Normal_OpenGL.jpg',
        roughnessMap: './assets/textures/TRON/TRON_Roughness.jpg',
        metalnessMap: './assets/textures/TRON/TRON_Metallic.jpg',
        aoMap: './assets/textures/TRON/TRON_Mixed_AO.jpg',
      },
      "MYSTICAL": {
        map: './assets/textures/MYSTIC/Mystic_Base_color.jpg',
        normalMap: './assets/textures/MYSTIC/Mystic_Normal_OpenGL.jpg',
        roughnessMap: './assets/textures/MYSTIC/Mystic_Roughness.jpg',
        aoMap: './assets/textures/MYSTIC/Mystic_Mixed_AO.jpg',
      },
      "CARVED WOOD": {
        map: './assets/textures/CARVEDWOOD/NobleCarving_Base_color.jpg',
        normalMap: './assets/textures/CARVEDWOOD/NobleCarving_Normal_OpenGL.jpg',
        roughnessMap: './assets/textures/CARVEDWOOD/NobleCarving_Roughness.jpg',
        aoMap: './assets/textures/CARVEDWOOD/NobleCarving_Mixed_AO.jpg',
      },
      "OLD TOY": {
        map: './assets/textures/OLDTOY/OldToy_Base_color.jpg',
        normalMap: './assets/textures/OLDTOY/OldToy_Normal_OpenGL.jpg',
        roughnessMap: './assets/textures/OLDTOY/OldToy_Roughness.jpg',
      },
      "ABSTRACT FLUID": {
        map: './assets/textures/ABSTRACTFLUID/AbstractFluid_Base_color.jpg',
        normalMap: './assets/textures/ABSTRACTFLUID/AbstractFluid_Normal_OpenGL.jpg',
        roughnessMap: './assets/textures/ABSTRACTFLUID/AbstractFluid_Roughness.jpg',
        aoMap: './assets/textures/ABSTRACTFLUID/AbstractFluid_Mixed_AO.jpg',
      },
      "GRITTY STEEL": {
        map: './assets/textures/GRITTYSTEEL/GRITTYSTEEL_Base_color.jpg',
        normalMap: './assets/textures/GRITTYSTEEL/GRITTYSTEEL_Normal_OpenGL.jpg',
      },
      // "CHRISTMAS": {
      //   map: './assets/textures/CHRISTMAS/Christmas_Base_color.jpg',
      //   roughnessMap: './assets/textures/CHRISTMAS/Christmas_Roughness.jpg',
      // },
      "PRIDE": {
        map: './assets/textures/PRIDE/Pride_Mat_Base_color.jpg',
        roughnessMap: './assets/textures/PRIDE/Pride_Mat_Roughness.jpg',
      },
      "ANIMALS": {
        map: './assets/textures/ANIMALS/ANIMALS_Base_color.jpg',
        roughnessMap: './assets/textures/ANIMALS/ANIMALS_Roughness.jpg',
      },
      "PATTERN": {
        map: './assets/textures/PATTERN/PATTERN_Base_color.jpg',
        roughnessMap: './assets/textures/PATTERN/PATTERN_Roughness.jpg',
      }
    };
  
    // Preload all textures using loadTextures Method
    for (const [skin, textures] of Object.entries(allTextures)) {
      this.preloadedTextures[skin] = this.loadTextures(textures);
    }
  }

  loadTextures(texturePaths) {
    const textures = {};

    if (!this.textureLoader) {
      this.textureLoader = new THREE.TextureLoader();
    }
  
    for (const [mapType, filePath] of Object.entries(texturePaths)) {
      const texture = this.textureLoader.load(filePath); // Load the texture

      texture.flipY = false; 
      textures[mapType] = texture; 
    }

    return textures; 
  }
   
  initSkinSwitcher() {
    this.currentSkinIndex = 0;
  
    this.currentSkinElement = document.getElementById("currentSkin");
    const leftButton = document.getElementById("leftButton");
    const rightButton = document.getElementById("rightButton");

    leftButton.addEventListener("click", () => {
      this.currentSkinIndex = (this.currentSkinIndex - 1 + this.skins.length) % this.skins.length;
      this.updateSkin();
    });
  
    rightButton.addEventListener("click", () => {
      this.currentSkinIndex = (this.currentSkinIndex + 1) % this.skins.length;
      this.updateSkin();
    });

    this.updateSkin();
  }

  getSkinConfig(skin) {
    const skinConfigs = {
        "STANDARD": {
            textures: {
                map: '../assets/textures/STANDARD/Rubik_unwrap.png',
            },
            colorSpaces: {
                map: THREE.SRGBColorSpace,
                normalMap: THREE.NoColorSpace,
                roughnessMap: THREE.NoColorSpace,
                metalnessMap: THREE.NoColorSpace,
                aoMap: THREE.NoColorSpace,
            },
            materialProperties: {
                metalness: 0.0,
                roughness: 0.0,
            },
        },
        "FUTURISTIC": {
            textures: {
                map: '../assets/textures/TRON/TRON_Base_color.jpg',
                normalMap: '../assets/textures/TRON/TRON_Normal_OpenGL.jpg',
                roughnessMap: '../assets/textures/TRON/TRON_Roughness.jpg',
                metalnessMap: '../assets/textures/TRON/TRON_Metallic.jpg',
                aoMap: '../assets/textures/TRON/TRON_Mixed_AO.jpg',
            },
            colorSpaces: {
                map: THREE.SRGBColorSpace,
                normalMap: THREE.NoColorSpace,
                roughnessMap: THREE.NoColorSpace,
                metalnessMap: THREE.NoColorSpace,
                aoMap: THREE.NoColorSpace,
            },
            materialProperties: {
                metalness: 0.75,
                roughness: 1.0,
            },
        },
        "MYSTICAL": {
            textures: {
                map: '../assets/textures/MYSTIC/Mystic_Base_color.jpg',
                normalMap: '../assets/textures/MYSTIC/Mystic_Normal_OpenGL.jpg',
                roughnessMap: '../assets/textures/MYSTIC/Mystic_Roughness.jpg',
                metalnessMap: '../assets/textures/MYSTIC/Mystic_Metallic.jpg',
                aoMap: '../assets/textures/MYSTIC/Mystic_Mixed_AO.jpg',
            },
            colorSpaces: {
                map: THREE.SRGBColorSpace,
                normalMap: THREE.NoColorSpace,
                roughnessMap: THREE.NoColorSpace,
                metalnessMap: THREE.NoColorSpace,
                aoMap: THREE.NoColorSpace,
            },
            materialProperties: {
                metalness: 0.0,
                roughness: 1.0,
            },
        },
        "CARVED WOOD": {
            textures: {
                map: '../assets/textures/CARVEDWOOD/NobleCarving_Base_color.jpg',
                normalMap: '../assets/textures/CARVEDWOOD/NobleCarving_Normal_OpenGL.jpg',
                roughnessMap: '../assets/textures/CARVEDWOOD/NobleCarving_Roughness.jpg',
                aoMap: '../assets/textures/CARVEDWOOD/NobleCarving_Mixed_AO.jpg',
            },
            colorSpaces: {
                map: THREE.SRGBColorSpace,
                normalMap: THREE.NoColorSpace,
                roughnessMap: THREE.NoColorSpace,
                metalnessMap: THREE.NoColorSpace,
                aoMap: THREE.NoColorSpace,
            },
            materialProperties: {
                metalness: 0.0,
                roughness: 0.5,
            },
        },
        "OLD TOY": {
            textures: {
                map: '../assets/textures/OLDTOY/OldToy_Base_color.jpg',
                normalMap: '../assets/textures/OLDTOY/OldToy_Normal_OpenGL.jpg',
                roughnessMap: '../assets/textures/OLDTOY/OldToy_Roughness.jpg',
                aoMap: '../assets/textures/OLDTOY/OldToy_Mixed_AO.jpg',
            },
            colorSpaces: {
                map: THREE.SRGBColorSpace,
                normalMap: THREE.NoColorSpace,
                roughnessMap: THREE.NoColorSpace,
                metalnessMap: THREE.NoColorSpace,
                aoMap: THREE.NoColorSpace,
            },
            materialProperties: {
                metalness: 0.0,
                roughness: 1.0,
            },
        },
        "ABSTRACT FLUID": {
            textures: {
                map: '../assets/textures/ABSTRACTFLUID/AbstractFluid_Base_color.jpg',
                normalMap: '../assets/textures/ABSTRACTFLUID/AbstractFluid_Normal_OpenGL.jpg',
                roughnessMap: '../assets/textures/ABSTRACTFLUID/AbstractFluid_Roughness.jpg',
                metalnessMap: '../assets/textures/ABSTRACTFLUID/AbstractFluid_Metallic.jpg',
                aoMap: '../assets/textures/ABSTRACTFLUID/AbstractFluid_Mixed_AO.jpg',
            },
            colorSpaces: {
                map: THREE.SRGBColorSpace,
                normalMap: THREE.NoColorSpace,
                roughnessMap: THREE.NoColorSpace,
                metalnessMap: THREE.NoColorSpace,
                aoMap: THREE.NoColorSpace,
            },
            materialProperties: {
                metalness: 0.7,
                roughness: 1.0,
            },
        },
        "GRITTY STEEL": {
            textures: {
                map: '../assets/textures/GRITTYSTEEL/GRITTYSTEEL_Base_color.png',
                normalMap: '../assets/textures/GRITTYSTEEL/GRITTYSTEEL_Normal_OpenGL.png',
                metalnessMap: '../assets/textures/GRITTYSTEEL/GRITTYSTEEL_Metallic.png',
                aoMap: '../assets/textures/GRITTYSTEEL/GRITTYSTEEL_Mixed_AO.png',
            },
            colorSpaces: {
                map: THREE.SRGBColorSpace,
                normalMap: THREE.NoColorSpace,
                roughnessMap: THREE.NoColorSpace,
                metalnessMap: THREE.NoColorSpace,
                aoMap: THREE.NoColorSpace,
            },
            materialProperties: {
                metalness: 0.3,
                roughness: 0.45,
            },
        },
        // "CHRISTMAS": {
        //     textures: {
        //         map: '../assets/textures/CHRISTMAS/Christmas_Base_color.jpg',
        //         roughnessMap: '../assets/textures/CHRISTMAS/Christmas_Roughness.jpg'
        //     },
        //     colorSpaces: {
        //         map: THREE.SRGBColorSpace,
        //         roughnessMap: THREE.NoColorSpace,
        //     },
        //     materialProperties: {},
        // },
        "PRIDE": {
            textures: {
                map: '../assets/textures/PRIDE/Pride_Mat_Base_color.jpg',
                roughnessMap: '../assets/textures/PRIDE/Pride_Mat_Roughness.jpg'
            },
            colorSpaces: {
                map: THREE.SRGBColorSpace,
                normalMap: THREE.NoColorSpace,
                roughnessMap: THREE.NoColorSpace,
            },
            materialProperties: {},
        },
        "ANIMALS": {
          textures: {
              map: '../assets/textures/ANIMALS/ANIMALS_Base_color.jpg',
              roughnessMap: '../assets/textures/ANIMALS/ANIMALS_Roughness.jpg'
          },
          colorSpaces: {
              map: THREE.SRGBColorSpace,
              normalMap: THREE.NoColorSpace,
              roughnessMap: THREE.NoColorSpace,
          },
          materialProperties: {},
      },
      "PATTERN": {
        textures: {
            map: '../assets/textures/PATTERN/PATTERN_Base_color.jpg',
            roughnessMap: '../assets/textures/PATTERN/PATTERN_Roughness.jpg'
        },
        colorSpaces: {
            map: THREE.SRGBColorSpace,
            normalMap: THREE.NoColorSpace,
            roughnessMap: THREE.NoColorSpace,
        },
        materialProperties: {},
    }
    };

    const config = skinConfigs[skin];
    if (!config) {
        console.warn(`Skin "${skin}" not found`);
        return null;
    }

    return config;
}

  applySkinConfig(config, textures) {
    // Adjust color space settings for preloaded textures
    Object.entries(config.colorSpaces).forEach(([mapType, colorSpace]) => {
        const texture = textures[mapType];
        if (texture) {
            texture.colorSpace = colorSpace;
        }
    });

    this.cubelets.children.forEach((cubelet) => {
        if (cubelet.material) {
            cubelet.material.map = textures.map || null;
            cubelet.material.normalMap = textures.normalMap || null;
            cubelet.material.roughnessMap = textures.roughnessMap || null;
            cubelet.material.metalnessMap = textures.metalnessMap || null;
            cubelet.material.aoMap = textures.aoMap || null;

            cubelet.material.metalness = config.materialProperties.metalness;
            cubelet.material.roughness = config.materialProperties.roughness;

            cubelet.material.needsUpdate = true;
        }
    });
}
  
  applySkin(skin) {
    const textures = this.preloadedTextures[skin];

    if (!textures) {
        console.warn(`Textures for skin "${skin}" not found`);
        return;
    }

    // Fetch any additional configuration needed for the skin
    const config = this.getSkinConfig(skin);

    // Apply the skin configuration
    this.applySkinConfig(config, textures, skin);
  }

  updateSkin() {
    const selectedSkin = this.skins[this.currentSkinIndex];
    this.currentSkinElement.innerText = selectedSkin; 
    this.applySkin(selectedSkin);
  }

  increaseMovesCounter() {
    this.movesCount++;
    document.getElementById('movesCounter').innerText = this.movesCount;
  }

  resetMoves() {
    this.movesCount = 0; 
    document.getElementById('movesCounter').innerText = this.movesCount;
  }

}
export default GameManager; 