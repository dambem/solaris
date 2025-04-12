<!-- RetroTransmitter.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
  
    let inputText = '';
    let transmitting = false;
    let animationFrame = 0;
    let asciiFrames = [];
    let baseFrame = [];
    let animationInterval;
    let audioContext;
    let oscillator;
    let gainNode;
    
    // Morse code mapping
    const morseCode = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 
      'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 
      'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 
      'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 
      'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---', 
      '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', 
      '8': '---..', '9': '----.', ' ': '/'
    };
    
    // Generate ASCII animation frames
    function generateAsciiFrames() {
      // Base frame
      baseFrame = [
        "                              ",
        "       STATUS: {STATUS}       ",
        "                              ",
      ];
      
      // Signal variations
      const signals = [
        [
          "                              ",
          "                              ",
          "                              ",
        ],
        [
          "               .              ",
          "                              ",
          "                              ",
        ],
        [
          "              ...             ",
          "               .              ",
          "                              ",
        ],
        [
          "             .....            ",
          "              ...             ",
          "               .              ",
        ],
        [
          "            .......           ",
          "             .....            ",
          "              ...             ",
        ],
        [
          "           .........          ",
          "            .......           ",
          "             .....            ",
        ]
      ];
      
      asciiFrames = signals.map(signal => {
        const frame = [...baseFrame];
        frame[8] = `${signal[0]}`;
        frame[9] = `${signal[1]}`;
        frame[10] = `${signal[2]}`;
        return frame;
      });
    }
    
    // Convert text to Morse code
    function textToMorse(text) {
      return text.toUpperCase().split('').map(char => {
        return morseCode[char] || char;
      }).join(' ');
    }
    
    // Play Morse code
    async function playMorseCode(morse) {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 700;
        gainNode.gain.value = 0;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
      }
      
      const dotDuration = 60; // milliseconds
      const dashDuration = dotDuration * 3;
      const symbolGap = dotDuration;
      const letterGap = dotDuration * 3;
      const wordGap = dotDuration * 7;
      
      for (let i = 0; i < morse.length; i++) {
        const symbol = morse[i];
        
        if (symbol === '.') {
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          await new Promise(resolve => setTimeout(resolve, dotDuration));
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        } else if (symbol === '-') {
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          await new Promise(resolve => setTimeout(resolve, dashDuration));
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        } else if (symbol === ' ') {
          await new Promise(resolve => setTimeout(resolve, letterGap));
        } else if (symbol === '/') {
          await new Promise(resolve => setTimeout(resolve, wordGap));
        }
        
        if (symbol !== ' ' && symbol !== '/') {
          await new Promise(resolve => setTimeout(resolve, symbolGap));
        }
      }
    }
    
    // Start transmission
    async function transmit() {
      if (transmitting || !inputText.trim()) return;
      
      transmitting = true;
      const morse = textToMorse(inputText);
      
      // Start animation
      let frame = 0;
      animationInterval = setInterval(() => {
        animationFrame = frame % asciiFrames.length;
        frame++;
      }, 150);
      
      // Play Morse code
      await playMorseCode(morse);
      
      // Stop animation
      clearInterval(animationInterval);
      transmitting = false;
      animationFrame = 0;
    }
    
    onMount(() => {
      generateAsciiFrames();
    });
    
    onDestroy(() => {
      if (animationInterval) clearInterval(animationInterval);
      if (oscillator) oscillator.stop();
      if (audioContext) audioContext.close();
    });
  </script>
  
  <div class="retro-container">
    <div class="ascii-display">
      {#if !transmitting}
        <pre>{baseFrame.map(line => line.replace('{STATUS}', 'READY')).join('\n')}</pre>
      {:else}
        <pre>{asciiFrames[animationFrame].map(line => line.replace('{STATUS}', 'TRANSMITTING')).join('\n')}</pre>
      {/if}
    </div>
    
    <div class="control-panel">
      <input 
        type="text" 
        bind:value={inputText} 
        placeholder="Enter message to transmit..." 
        disabled={transmitting}
      />
      <button on:click={transmit} disabled={transmitting || !inputText.trim()}>
        {transmitting ? 'TRANSMITTING...' : 'TRANSMIT'}
      </button>
    </div>
    
    {#if transmitting}
      <div class="morse-display">
        <span>TRANSMITTING: {textToMorse(inputText)}</span>
      </div>
    {/if}
  </div>
  
  <style>
    .retro-container {
      font-family: 'Courier New', monospace;
      max-width: 500px;
      margin: 0 auto;
      background-color: #111;
      border-radius: 10px;
      border: 4px solid #444;
      padding: 20px;
      color: #0f0;
    }
    
    .ascii-display {
      background-color: #000;
      border: 2px solid #555;
      border-radius: 5px;
      padding: 10px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    
    .ascii-display pre {
      margin: 0;
      font-size: 14px;
      line-height: 1.2;
      color: #0f0;
      text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
    }
    
    .control-panel {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    input {
      flex: 1;
      background-color: #222;
      border: 2px solid #555;
      border-radius: 5px;
      padding: 8px 12px;
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-weight: bold;
    }
    
    input::placeholder {
      color: #0a0;
      opacity: 0.5;
    }
    
    button {
      background-color: #333;
      color: #0f0;
      border: 2px solid #0f0;
      border-radius: 5px;
      padding: 8px 16px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    button:hover:not(:disabled) {
      background-color: #0f0;
      color: #000;
      box-shadow: 0 0 10px rgba(0, 255, 0, 0.7);
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .morse-display {
      background-color: #222;
      border: 2px solid #555;
      border-radius: 5px;
      padding: 10px;
      margin-top: 15px;
      font-weight: bold;
      text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
      overflow-wrap: break-word;
    }
    
    /* CRT effect */
    .retro-container::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        rgba(18, 16, 16, 0) 50%, 
        rgba(0, 0, 0, 0.25) 50%
      );
      background-size: 100% 4px;
      pointer-events: none;
      z-index: 2;
      opacity: 0.15;
    }
  </style>