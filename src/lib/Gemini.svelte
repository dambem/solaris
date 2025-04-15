<!-- GeminiChat.svelte -->
<script>
    import { onMount } from 'svelte';
    import promptContent from '../lib/agent.md?raw';

    // Component props
    export let apiKey = ''; // Gemini API key
    export let modelName = 'gemini-2.0-flash'; // Default model
    // Component state
    let userInput = '';
    let messages = [];
    let isLoading = false;
    let error = null;
    // let promptPath = './src/lib/agent.md'
    let systemPrompt
    export let lastMessage;
    let debug = false;


    async function loadPromptFile() {
    try {
      // const response = await fetch(promptPath);
      // if (!response.ok) {
      //   throw new Error(`Failed to load prompt file: ${response.statusText}`);
      // }
      
      systemPrompt = promptContent
      console.log('Loaded system prompt from markdown file');
      
      // Initialize messages with system prompt
      messages = [
        {
          role: 'user',
          content: systemPrompt
        }
      ];


      console.log(messages)
    } catch (err) {
      console.error('Error loading prompt file:', err);
      error = `Failed to load prompt file: ${err.message}`;
    }
  }

    // Initialize when component mounts
    onMount(async () => {
      // You could load previous conversations here if needed
        await loadPromptFile();

    });
  
    // Function to send message to Gemini API
    async function sendMessage() {
      if (!userInput.trim() || !apiKey) return;
      // Add user message to conversation
      const userMessage = {
        role: 'user',
        content: userInput
      };
      messages = [...messages, userMessage];
      
      // Clear input and set loading state
      const currentInput = userInput;
      userInput = '';
      isLoading = true;
      error = null;
      
      try {
        const conversationHistory = messages
          .map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
          }));
        console.log(conversationHistory)
        // Create request payload
        const payload = {
          contents: conversationHistory,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        };
  
        // Send request to Gemini API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        );
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }
  
        const data = await response.json();
        
        // Extract response text
        const assistantMessage = data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I couldn\'t generate a response.';
        
        // Add assistant response to conversation
        messages = [...messages, {
          role: 'assistant',
          content: assistantMessage
        }];
        lastMessage = messages[messages.length - 1];

      } catch (err) {
        console.error('Error calling Gemini API:', err);
        error = err.message;
        // Restore user message if there was an error
        userInput = currentInput;
      } finally {
        isLoading = false;
      }
    }
  
    // Handle keydown events to submit on Enter
    function handleKeydown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    }
  </script>
  
  <div class="retro-container">
    <div class="morse-display">
      {#if !apiKey}
        <div class="api-key-warning">Please provide an API key to use this component</div>
      {/if}
    </div>
    {#if debug}

    <div class="control-panel">
        {#each messages.slice(1).filter((msg => msg.role !== 'system')) as message, i (i)}
        
          <div class="message {message.role}">
            <div class="message-header">
              {message.role === 'user' ? 'You' : 'Gemini AI'}
            </div>
            <div class="message-content">
              {message.content}
            </div>
          </div>
        {/each}
      {#if isLoading }
          {#if debug}
        <div class="message assistant loading">

        </div>
        {/if}
      {/if}
    </div>
    {/if}

    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}
  
    <div class="control-panel">
      <input 
        bind:value={userInput} 
        placeholder="Type your message here..." 
        on:keydown={handleKeydown}
        disabled={isLoading || !apiKey}
      />
      <button 
        on:click={sendMessage} 
        disabled={isLoading || !userInput.trim() || !apiKey}
      >
        Send
      </button>
    </div>
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