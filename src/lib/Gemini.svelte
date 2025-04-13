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
  
  <div class="gemini-chat-container">
    <div class="chat-header">
      {#if !apiKey}
        <div class="api-key-warning">Please provide an API key to use this component</div>
      {/if}
    </div>
    {#if debug}

    <div class="messages-container">
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
          <div class="message-content">
            <div class="loading-indicator">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
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
  
    <div class="input-container">
      <textarea 
        bind:value={userInput} 
        placeholder="Type your message here..." 
        on:keydown={handleKeydown}
        disabled={isLoading || !apiKey}
      ></textarea>
      <button 
        on:click={sendMessage} 
        disabled={isLoading || !userInput.trim() || !apiKey}
      >
        Send
      </button>
    </div>
  </div>
  
  <style>
    .gemini-chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 400px;
      max-width: 800px;
      margin: 0 auto;
      border-radius: 8px;
      border: 1px solid #ccc;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
  
    .chat-header {
      padding: 10px 15px;
      background-color: #f0f4f8;
      border-bottom: 1px solid #ddd;
    }
  
    .chat-header h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }
  
    .api-key-warning {
      color: #cc3300;
      font-size: 14px;
      margin-top: 5px;
    }
  
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background-color: #f9f9f9;
    }
  
    .message {
      padding: 10px 15px;
      border-radius: 8px;
      max-width: 80%;
      animation: fadeIn 0.3s ease-in-out;
    }
  
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  
    .message.user {
      align-self: flex-end;
      background-color: #e1f5fe;
      color: #01579b;
    }
  
    .message.assistant {
      align-self: flex-start;
      background-color: #e8f5e9;
      color: #2e7d32;
    }
  
    .message-header {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 14px;
    }
  
    .message-content {
      font-size: 15px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
  
    .loading-indicator {
      display: flex;
      justify-content: flex-start;
    }
  
    .loading-indicator span {
      animation: loading 1.4s infinite ease-in-out both;
      font-size: 24px;
    }
  
    .loading-indicator span:nth-child(1) {
      animation-delay: 0s;
    }
  
    .loading-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }
  
    .loading-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
  
    @keyframes loading {
      0%, 80%, 100% {
        opacity: 0.2;
        transform: translateY(0);
      }
      40% {
        opacity: 1;
        transform: translateY(-5px);
      }
    }
  
    .error-message {
      padding: 10px 15px;
      background-color: #ffebee;
      color: #c62828;
      border-top: 1px solid #ffcdd2;
      font-size: 14px;
    }
  
    .input-container {
      display: flex;
      padding: 10px;
      border-top: 1px solid #ddd;
      background-color: white;
    }
  
    textarea {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      resize: none;
      min-height: 60px;
      font-family: inherit;
      font-size: 15px;
    }
  
    button {
      margin-left: 10px;
      padding: 0 20px;
      background-color: #4a86e8;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 15px;
      font-weight: bold;
      transition: background-color 0.2s;
    }
  
    button:hover:not(:disabled) {
      background-color: #3a76d8;
    }
  
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  </style>