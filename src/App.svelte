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
  let sound;
  let amplitude = 5;
  let frequency = 10;
  let turbulence = 0.5;
  let colorShift = 0;
  let speed = 0.2;
  let debug= true;
  let latestMessage;
  let latest_value;
  let animations = {};


  let volume = 0.7;
  let pingFrequency = 0.1;  // How often random pings occur (0-1)
  let rumbleDepth = 0.6;    // Intensity of the deep rumble (0-1)
  let filterSweep = 0.05;   // Speed of filter modulation (0.01-0.2)
  let reverbAmount = 0.7;   // Amount of reverb (0-1)
  let staticLevel = 0.2;    // Level of radio static (0-1)

  let currentIndices = {
    amplitude: 0,
    frequency: 0,
    speed: 0,
    turbulence: 0,
    colorShift: 0
  };

  let morseParams = {
    volume: volume,
    rumbleDepth: rumbleDepth,
    filterSweep: filterSweep,
    reverbAmount: reverbAmount,
    staticLevel: staticLevel
  }

  let planetParams = {
    amplitude: amplitude,
    frequency: frequency,
    speed: speed,
    turbulence: turbulence,
    colorShift: colorShift
  };
  function parseStringToObject(inputString) {
  try {
    // Check for markdown code blocks with ```<language>
    // Support json, javascript, js and typescript formats
    const codeBlockRegex = /```(json|javascript|js|typescript|ts)\s*([\s\S]*?)```/;
    const codeBlockMatch = inputString.match(codeBlockRegex);
    
    if (codeBlockMatch && codeBlockMatch[2]) {
      // Extract content from the code block
      inputString = codeBlockMatch[2].trim();
      
      // Check if the content starts with an object literal
      if (!inputString.trimStart().startsWith('{')) {
        throw new Error('Code block does not contain a valid object literal');
      }
    }
    
    // Check if the input string appears to be an object
    if (!inputString.trimStart().startsWith('{')) {
      throw new Error('Input does not appear to be a JSON object');
    }
    
    // Check if the input is already valid JSON
    try {
      return JSON.parse(inputString);
    } catch (initialError) {
      // If not valid JSON, continue with custom parsing
    }
    
    // Handle trailing commas which are invalid in JSON
    const withoutTrailingCommas = inputString.replace(/,(\s*[}\]])/g, '$1');
    
    // Process the string character by character for maximum robustness
    let result = '';
    let i = 0;
    let inString = false;
    let inPropName = false;
    let currentPropName = '';
    let stringDelimiter = '';
    
    // First, handle property names with spaces and special characters
    while (i < withoutTrailingCommas.length) {
      const char = withoutTrailingCommas[i];
      const nextChar = i < withoutTrailingCommas.length - 1 ? withoutTrailingCommas[i + 1] : '';
      
      // Handle string literals
      if ((char === '"' || char === "'") && (i === 0 || withoutTrailingCommas[i - 1] !== '\\')) {
        if (!inString) {
          // Starting a new string
          inString = true;
          stringDelimiter = char;
          result += '"'; // Always use double quotes in JSON
        } else if (char === stringDelimiter) {
          // Ending the current string
          inString = false;
          result += '"'; // Always use double quotes in JSON
        } else {
          // This is a different quote character inside a string
          result += char;
        }
        i++;
        continue;
      }
      
      if (inString) {
        // Inside a string, preserve everything except convert single quotes to double if needed
        if (stringDelimiter === "'" && char === "'") {
          result += '"';
        } else {
          result += char;
        }
        i++;
        continue;
      }
      
      // Handle property names
      if (!inPropName && (char.match(/[a-zA-Z0-9_$]/) || char === '-') && 
          (i === 0 || withoutTrailingCommas[i - 1].match(/[{,\s]/))) {
        // Starting a new property name
        inPropName = true;
        currentPropName = char;
      } else if (inPropName) {
        if (char === ':') {
          // End of property name, add quotes
          result += `"${currentPropName}":`;
          inPropName = false;
          currentPropName = '';
        } else if (char.match(/[a-zA-Z0-9_$\s-]/)) {
          // Continue building property name, including spaces
          currentPropName += char;
        } else {
          // Something unexpected, reset state
          result += currentPropName + char;
          inPropName = false;
          currentPropName = '';
        }
      } else {
        // Not in a property name or string, copy as-is
        result += char;
      }
      
      i++;
    }
    
    // Add any remaining property name
    if (inPropName) {
      result += `"${currentPropName}"`;
    }
    
    // Process the result to handle any nested objects and arrays
    let processedResult = result;
    let maxIterations = 5; // Prevent infinite loops
    let lastResult = '';
    
    // Repeatedly process the string until no more changes are made
    while (lastResult !== processedResult && maxIterations > 0) {
      lastResult = processedResult;
      
      // Fix property names in nested objects
      processedResult = processedResult.replace(/({|,)\s*([a-zA-Z0-9_$-]+)(\s+):/g, '$1"$2":');
      processedResult = processedResult.replace(/({|,)\s*([a-zA-Z0-9_$-]+[\s]+[a-zA-Z0-9_$-]+)(\s*):/g, '$1"$2":');
      
      maxIterations--;
    }
    
    // Parse the properly formatted JSON string to an object
    return JSON.parse(processedResult);
  } catch (error) {
    console.error("Error parsing string:", error.message);
    console.log("Original input:", inputString);
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
      if (latestMessage) {
        const latest_value = parseStringToObject(latestMessage.content);
        if (latest_value) {
          processMessageData(latest_value);
          latestMessage = null;
        }
      }

      requestAnimationFrame(animate);
      if (planet && typeof planet.updatePlanet === 'function') {
        planet.updatePlanet(planetParams);
        morseParams.volume = frequency*0.1;
        morseParams.rumbleDepth = frequency*0.05;
        morseParams.filterSweep = Math.sin(speed*frequency)*0.01;
        morseParams.reverbAmount = speed*0.1;
        morseParams.staticLevel = turbulence*0.2;
        morseParams.pingFrequency =colorShift*0.5;

        sound.updateMusic(morseParams);
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer) renderer.dispose();
    };
  });
</script>

<div id="container"  bind:this={container}></div>
<!-- <div class="noise_bg"></div> -->
{#if scene}
  <Solaris {scene} bind:this={planet} />
{/if}

<main>
  {#if debug}
  <div class="card">
    <Morse  bind:this={sound} />
    <!-- <br> -->
    <!-- <MorseInput/> -->
    <div class="mb-3">
      <div class="mb-3">

        <!-- <div class="flex justify-between text-xs">
          <span>{morseParams.rumbleDepth}</span>
        </div> -->
      </div> 
      </div>
  </div>
  {/if}
  <div class="card">
    
    {#if showApiKeyInput}
      <div class="api-key-setup">
        <!-- <h2>Enter your Gemini API Key</h2> -->
        
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