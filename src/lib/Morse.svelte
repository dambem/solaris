<!-- DeepOceanAmbient.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import * as Tone from 'tone';
    
    // Sound control states
    let isPlaying = false;
    let volume = 0.7;
    let pingFrequency = 0.1;  // How often random pings occur (0-1)
    let rumbleDepth = 0.6;    // Intensity of the deep rumble (0-1)
    let filterSweep = 0.05;   // Speed of filter modulation (0.01-0.2)
    let reverbAmount = 0.7;   // Amount of reverb (0-1)
    let staticLevel = 0.2;    // Level of radio static (0-1)
    
    // Audio nodes
    let noise;
    let filter;
    let gainNode;
    let rumbleGain;
    let pingLoop;
    let filterLfo;
    let reverb;
    let staticGain;
    
    // Boolean to track if audio is initialized
    let audioInitialized = false;

    export function updateMusic(params) {
      volume = params.volume
      rumbleDepth = params.rumbleDepth
      filterSweep = params.filterSweep
      reverbAmount = params.reverbAmount
      staticLevel = params.staticLevel
      pingFrequency = params.pingFrequency
    }
    
    // Initialize audio once on component mount
    onMount(async () => {
      try {
        await Tone.start();
        console.log("Audio context initialized");
        
        // Create reverb for deep cavernous effect
        reverb = new Tone.Reverb({
          decay: 8,
          wet: reverbAmount
        }).toDestination();
        await reverb.generate(); // Generate the impulse response
        console.log("Reverb generated and connected to destination");
        
        // Set up the initial audio nodes but keep them disconnected
        setupAudioNodes();
        
        audioInitialized = true;
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
      
      // Clean up all audio nodes on component unmount
      return () => {
        disposeAllNodes();
      };
    });
    
    // Set up all audio nodes
    function setupAudioNodes() {
      // Clean up existing nodes first
      disposeAllNodes();
      
      // Deep ocean ambient sounds - brown noise for the deep rumble
      noise = new Tone.Noise('brown').start();
      
      // Rumble gain control
      rumbleGain = new Tone.Gain(rumbleDepth);
      noise.connect(rumbleGain);
      
      // Create filter for underwater low-frequency sound
      filter = new Tone.Filter({
        type: 'lowpass',
        frequency: 180,
        Q: 2
      });
      
      // Create resonant filter for eerie underwater harmonics
      const resonantFilter = new Tone.Filter({
        type: 'bandpass',
        frequency: 280,
        Q: 5
      });
      
      // Create slow random modulation for filter to create shifting currents
      filterLfo = new Tone.LFO({
        frequency: filterSweep,
        min: 100,
        max: 260,
        type: 'sine'
      }).start();
      filterLfo.connect(filter.frequency);
      
      // Create another LFO for the resonant filter
      const resonanceLfo = new Tone.LFO({
        frequency: filterSweep * 1.6,
        min: 200,
        max: 380,
        type: 'triangle'
      }).start();
      resonanceLfo.connect(resonantFilter.frequency);
      
      // Main gain node for volume control
      gainNode = new Tone.Gain(volume * 1.5);
      
      // Create random radio interference
      const radioInterference = new Tone.Noise({
        type: 'white',
        volume: -25
      }).start();
      
      // Static gain control
      staticGain = new Tone.Gain(staticLevel * 1.5);
      radioInterference.connect(staticGain);
      
      const interferenceFilter = new Tone.Filter({
        type: 'bandpass',
        frequency: 1200,
        Q: 0.8
      });
      
      staticGain.connect(interferenceFilter);
      
      // Connect the core audio path
      rumbleGain.connect(filter);
      filter.connect(resonantFilter);
      resonantFilter.connect(gainNode);
      interferenceFilter.connect(gainNode);
      // Add random pings and distant sounds
      pingLoop = new Tone.Loop(time => {
        // Only create sounds occasionally to simulate distant noises

        if ( isPlaying) {
          // Create different types of sounds
          const soundType = Math.random();

          if (soundType < 0.7) {
            // Standard ping sound
            const ping = new Tone.Oscillator({
              frequency: 50 + Math.random() * 200,
              type: 'sine',
              volume: -15  // Increased volume for better audibility
            });
            
            ping.connect(reverb);
            ping.start(time).stop(time + 0.1 + Math.random() * 0.3);
          } else if (soundType < 0.9) {
            // Creaking metal sound
            const creak = new Tone.Oscillator({
              frequency: 200 + Math.random() * 400,
              type: 'sawtooth',
              volume: -20
            });
            
            const creakFilter = new Tone.Filter({
              type: 'bandpass',
              frequency: 400,
              Q: 2
            });
            
            const creakDistortion = new Tone.Distortion({
              distortion: 0.8,
              wet: 0.5
            });
            
            creak.connect(creakFilter);
            creakFilter.connect(creakDistortion);
            creakDistortion.connect(reverb);
            
            // Frequency sweep for creaking effect
            creak.frequency.exponentialRampTo(100 + Math.random() * 100, 0.5);
            
            creak.start(time).stop(time + 0.2 + Math.random() * 0.5);
          } else {
            // Distant whale-like sound
            const whale = new Tone.Oscillator({
              frequency: 80 + Math.random() * 60,
              type: 'sine',
              volume: -20
            });
            
            const whaleFilter = new Tone.Filter({
              type: 'lowpass',
              frequency: 200,
              Q: 1
            });
            
            whale.connect(whaleFilter);
            whaleFilter.connect(reverb);
            
            // Slow frequency sweep
            whale.frequency.exponentialRampTo(40 + Math.random() * 40, 1.5);
            
            whale.start(time).stop(time + 0.8 + Math.random() * 1);
          }
        }
      }, 1);
      
      // Note: We'll start the ping loop when play is toggled
    }
    
    // Reactivity for audio parameters
    $: if (audioInitialized && isPlaying) {
      if (rumbleGain) rumbleGain.gain.value = rumbleDepth;
      if (filterLfo) filterLfo.frequency.value = filterSweep;
      if (reverb) reverb.wet.value = reverbAmount;
      if (staticGain) staticGain.gain.value = staticLevel * 1.5;
      if (gainNode) gainNode.gain.value = volume * 1.5;
      console.log("Updated audio parameters");
    }
    
    // Dispose all audio nodes
    function disposeAllNodes() {
      if (noise) noise.dispose();
      if (filter) filter.dispose();
      if (rumbleGain) rumbleGain.dispose();
      if (pingLoop) pingLoop.dispose();
      if (filterLfo) filterLfo.dispose();
      if (staticGain) staticGain.dispose();
      if (gainNode) gainNode.dispose();
      
      // Don't dispose reverb here as it's connected to destination
      // and should persist throughout the component lifecycle
      
      noise = null;
      filter = null;
      rumbleGain = null;
      pingLoop = null;
      filterLfo = null;
      staticGain = null;
      gainNode = null;
      
      console.log("Audio nodes disposed");
    }
    
    // Toggle playback
    async function togglePlay() {
      try {
        // Always ensure Tone.js context is started on user interaction
        await Tone.start();
        
        if (!isPlaying) {
          // Starting playback
          console.log("Starting deep ocean sounds");
          
          // Make sure audio is initialized
          if (!audioInitialized) {
            await reverb.generate();
            setupAudioNodes();
            audioInitialized = true;
          } else {
            // Reinitialize audio nodes if they were disposed
            if (!gainNode) {
              setupAudioNodes();
            }
          }
          
          // Connect main gain to reverb to start audio
          gainNode.connect(reverb);
          
          // Start the ping loop
          pingLoop.start();
          
        } else {
          // Stopping playback
          console.log("Stopping deep ocean sounds");
          
          // Disconnect main gain from reverb
          if (gainNode) {
            gainNode.disconnect();
          }
          
          // Stop the ping loop
          if (pingLoop) {
            pingLoop.stop();
          }
        }
        
        isPlaying = !isPlaying;
        
      } catch (error) {
        console.error("Error toggling playback:", error);
      }
    }
    
    // Preset functions
    function setAbandonedDeepStation() {
      rumbleDepth = 0.7;
      pingFrequency = 0.1;
      filterSweep = 0.03;
      reverbAmount = 0.9;
      staticLevel = 0.3;
    }
    
    function setActiveSubmarineMonitoring() {
      rumbleDepth = 0.4;
      pingFrequency = 0.3;
      filterSweep = 0.08;
      reverbAmount = 0.5;
      staticLevel = 0.1;
    }
    
    function setStormConditions() {
      rumbleDepth = 0.8;
      pingFrequency = 0.4;
      filterSweep = 0.15;
      reverbAmount = 0.6;
      staticLevel = 0.5;
    }
    
    function setDeepOceanTrench() {
      rumbleDepth = 0.5;
      pingFrequency = 0.05;
      filterSweep = 0.02;
      reverbAmount = 0.8;
      staticLevel = 0.15;
    }
    
    function setHauntedWreck() {
      rumbleDepth = 0.6;
      pingFrequency = 0.2;
      filterSweep = 0.1;
      reverbAmount = 0.7;
      staticLevel = 0.4;
    }
  </script>
  
  <div class="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-3xl mx-auto">
    
    <div class="w-full mb-6 bg-gray-900 p-6 rounded-lg shadow-inner text-green-400">
      <div class="flex justify-between mb-4">
        <button 
          on:click={togglePlay}
          class={`px-4 py-2 rounded-md font-bold ${isPlaying ? 'bg-red-800 hover:bg-red-900 text-white' : 'bg-green-800 hover:bg-green-900 text-white'}`}
        >
          {isPlaying ? 'Stop Audio' : 'Start Audio'}
        </button>
      </div>
      
      <!-- <div class="mb-4">
        <label class="block mb-2">Master Volume:</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          bind:value={volume}
          class="w-full"
        />
      </div> -->

<!--       
      <div class="mb-3">
        <label class="block mb-1 text-sm">Deep Rumble Intensity:</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          bind:value={rumbleDepth}
          class="w-full"
        />
        <div class="flex justify-between text-xs">
          <span>Subtle</span>
          <span>Intense</span>
        </div>
      </div> -->
      


    </div>

  </div>