<script>
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Counter from './lib/Counter.svelte'
  import Morse from './lib/Morse.svelte'
  import MorseInput from './lib/MorseInput.svelte';
  import { setupScene, createStars } from './lib/SceneSetup.js';
  import { onMount } from 'svelte';
  import Solaris from './lib/Solaris.svelte';
  import Gemini from './lib/Gemini.svelte';
  import gsap from 'gsap';
  let apiKey = '';
  let showApiKeyInput = true;
  function saveApiKey() {
    showApiKeyInput = false;
  }

  let container;
  let scene, camera, renderer;
  let planet;
  let amplitude = 0.5;
  let frequency = 0.5;
  let turbulence = 0.5;
  let colorShift = 0;
  let speed = 0.2;
  let debug= true;
  let latestMessage;
  let latest_value;
  let animations = {};
  let currentIndices = {
  amplitude: 0,
  frequency: 0,
  speed: 0,
  turbulence: 0,
  colorShift: 0
};
  let planetParams = {
    amplitude: amplitude,
    frequency: frequency,
    speed: speed,
    turbulence: turbulence,
    colorShift: colorShift
  };
  function parseStringToObject(inputString) {
  try {
    // Convert the string to a valid JSON format
    // 1. Replace property names without quotes with quoted property names
    // 2. Replace single quotes with double quotes
    const jsonString = inputString
      .replace(/(\w+):/g, '"$1":')  // Add quotes around property names
      .replace(/'/g, '"');          // Replace single quotes with double quotes
    
    // Parse the JSON string to an object
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing string:", error);
    return null;
  }
}
function animateParameter(paramName, valueArray) {
  if (!valueArray || !Array.isArray(valueArray) || valueArray.length === 0) {
    return;
  }
  
  // Reset current index
  currentIndices[paramName] = 0;
  
  // Create timeline for sequential animation
  animations[paramName] = gsap.timeline();
  
  // Add each value as a tween with 1-second duration
  valueArray.forEach((value, index) => {
    animations[paramName].to(
      planetParams, 
      {
        [paramName]: value/5,
        duration: 5,
        ease: "power1.inOut",
        onStart: () => {
          currentIndices[paramName] = index;
          console.log(`${paramName} changing to ${value} (index: ${index})`);
        }
      }
    );
  });
  
  // After completing the sequence, stay at the last value
  animations[paramName].then(() => {
    console.log(`${paramName} animation complete, final value: ${valueArray[valueArray.length - 1]}`);
  });
}

function processMessageData(messageData) {
  if (!messageData) return;
  
  const data = typeof messageData === 'string' 
    ? parseStringToObject(messageData) 
    : messageData;
  
  if (!data) return;
  
  // Kill any existing animations
  killAllAnimations();
  
  // Animate each parameter
  animateParameter('amplitude', data.amplitude);
  animateParameter('frequency', data.frequency);
  animateParameter('speed', data.speed);
  animateParameter('turbulence', data.turbulence);
  animateParameter('colorShift', data.colorShift);
  
  // Update communication state if present
  if (data.isCommunicating !== undefined) {
    // Handle communication state change
    console.log("Communication state:", data.isCommunicating);
  }
  
  // Update text descriptions if present
  if (data.surfaceState) {
    // Update surface state display
    console.log("Surface state:", data.surfaceState);
  }
  function killAllAnimations() {
  Object.values(animations).forEach(anim => {
    if (anim) anim.kill();
  });
  animations = {};
  }
  // if (data.description) {
  //   // Update description display
  //   console.log("Description:", data.description);
  // }
}

  onMount(() => {
    // Make sure container is defined before initializing Three.js
    if (!container) return;
    
    // Initialize Three.js scene
    const sceneSetup = setupScene(container);
    scene = sceneSetup.scene;
    camera = sceneSetup.camera;
    renderer = sceneSetup.renderer;

    createStars(scene);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      // console.log(latestMessage)
      if (latestMessage) {
        const latest_value = parseStringToObject(latestMessage.content);
        if (latest_value) {
          processMessageData(latest_value);
          // Clear latestMessage to avoid reprocessing
          latestMessage = null;
        }
      }
      else{
        planetParams = {
        amplitude: amplitude,
        frequency: frequency,
        speed: speed,
        turbulence: turbulence,
        colorShift: colorShift
      };
      }
      // console.log(latest_value)
      // planetParams = {
      //   amplitude: amplitude,
      //   frequency: frequency,
      //   speed: speed,
      //   turbulence: turbulence,
      //   colorShift: colorShift
      // };      
      requestAnimationFrame(animate);
      // Update planet parameters if planet component is initialized
      if (planet && typeof planet.updatePlanet === 'function') {
        planet.updatePlanet(planetParams);
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer) renderer.dispose();
    };
  });
</script>

<div id="container" bind:this={container}></div>

{#if scene}
  <Solaris {scene} bind:this={planet} />
{/if}

<main>
  {#if debug}
  <div class="card">
    <!-- <Morse /> -->
    <!-- <MorseInput /> -->
    <div class="mb-3">
    <label class="block mb-1 text-sm">Amplitude</label>
    <input 
      type="range" 
      min="0.01" 
      max="0.9" 
      step="0.01"
      bind:value={amplitude}
      class="w-full"
    />
    <label class="block mb-1 text-sm">Frequency</label>
    <input 
      type="range" 
      min="0.0" 
      max="10" 
      step="0.01"
      bind:value={frequency}
      class="w-full"
    />
    </div>
    <div class="mb-3">
      <label class="block mb-1 text-sm">Speed</label>
      <input 
        type="range" 
        min="0.01" 
        max="10.9" 
        step="0.01"
        bind:value={speed}
        class="w-full"
      />
      <label class="block mb-1 text-sm">Turbulence</label>
      <input 
        type="range" 
        min="1.0" 
        max="25" 
        step="0.01"
        bind:value={turbulence}
        class="w-full"
      />
      </div>
      <div class="mb-3">
        <label class="block mb-1 text-sm">Color Shift</label>
        <input 
          type="range" 
          min="0.0" 
          max="10.0" 
          step="0.01"
          bind:value={colorShift}
          class="w-full"
        />

        </div>
  </div>
  {/if}
  <div class="card">
    
    {#if showApiKeyInput}
      <div class="api-key-setup">
        <h2>Enter your Gemini API Key</h2>
        <p>You'll need a Google AI API key to use this component. This key will only be stored in memory for this session.</p>
        
        <div class="input-group">
          <input 
            type="password" 
            bind:value={apiKey} 
            placeholder="Enter your Gemini API key"
          />
          <button on:click={saveApiKey}>Save Key</button>
        </div>
      </div>
    {:else}
      <div class="chat-container">
        <Gemini bind:lastMessage={latestMessage}  {apiKey} />
        <button class="reset-btn" on:click={() => showApiKeyInput = true}>
          Change API Key
        </button>
      </div>
      {latestMessage}
    {/if}
</main>

<style>
  #container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
  
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
  
  /* Add some styling for the card and main elements */
  main {
    position: relative;
    z-index: 1;
    color: white;
    padding: 1rem;
    text-align: center;
  }
  
  .card {
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 8px;
    padding: 2rem;
    margin: 2rem auto;
    max-width: 800px;
  }
</style>