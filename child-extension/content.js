const createPopup = () => {
    const popupHTML = `
      <div id="safety-popup" style="
        display: none; 
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: #ffffff; 
        border-radius: 8px; 
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); 
        z-index: 2147483647; 
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        max-width: 320px; 
        animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, 0.04);
      ">
        <div style="
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 14px 16px; 
          background: #f8f9fa;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img 
              src="chrome-extension://${chrome.runtime.id}/diamond-exclamation.png" 
              alt="Alert Icon" 
              style="width: 18px; height: 18px;"
            />
            <h3 style="
              margin: 0;
              font-size: 14px;
              font-weight: 600;
              color: #1a1a1a;
            ">Safety Alert</h3>
          </div>
          <button id="close-safety-popup" style="
            background: none; 
            border: none; 
            padding: 4px;
            font-size: 18px; 
            cursor: pointer; 
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            transition: all 0.2s;
          ">×</button>
        </div>
        <div id="safety-content" style="padding: 16px;">
          <!-- Loading State -->
          <div id="loading-state" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          ">
            <div class="progress"></div>
            <span style="
              font-size: 13px;
              color: #666;
              font-weight: 500;
            ">Predicting URL Safety...</span>
          </div>
  
          <!-- Result State -->
          <div id="result-state" style="display: none;">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
            ">
                <span id="safety-result" style="
                font-size: 13px;
                color: #333;
                font-weight: 400;
              "></span>
              <span id="safety-badge" style="
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                color: white;
              "></span>
            </div>
          </div>
        </div>
      </div>
      <style>
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        #close-safety-popup:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: #333;
        }
        .progress {
          width: 33.6px;
          height: 67.2px;
          animation: progress-sze6ck 1.6s infinite backwards;
          background: linear-gradient(0deg, #474bff, #474bff 50%, transparent 50%, transparent);
          background-size: 100% 200%;
          background-repeat: no-repeat;
          border: 6.7px solid #dbdcef;
          border-radius: 16.8px;
        }
        @keyframes progress-sze6ck {
          0% {
            background-position: 0 0;
            transform: rotate(0deg);
          }
          25% {
            background-position: 0 100%;
            transform: rotate(0deg);
          }
          50% {
            background-position: 0 100%;
            transform: rotate(180deg);
          }
          75% {
            background-position: 0 200%;
            transform: rotate(180deg);
          }
          100% {
            background-position: 0 200%;
            transform: rotate(360deg);
          }
        }
      </style>
    `;
  
    // Insert popup HTML into page
    const div = document.createElement('div');
    div.innerHTML = popupHTML;
    document.body.appendChild(div);
  
    // Add close button handler
    document.getElementById('close-safety-popup').addEventListener('click', () => {
      const popup = document.getElementById('safety-popup');
      popup.style.display = 'none';
    });
  };
  
  // Create popup when content script loads
  createPopup();
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'urlSafetyCheck') {
      const popup = document.getElementById('safety-popup');
      const loadingState = document.getElementById('loading-state');
      const resultState = document.getElementById('result-state');
      const safetyBadge = document.getElementById('safety-badge');
      const resultText = document.getElementById('safety-result');
  
      if (popup) {
        // Show popup with loading state
        popup.style.display = 'block';
        loadingState.style.display = 'flex';
        resultState.style.display = 'none';
  
        // After receiving the result
        const isSafe = request.result.includes('SAFE');
        
        // Update badge and result
        safetyBadge.style.backgroundColor = isSafe ? '#16a34a' : '#dc2626';
        safetyBadge.textContent = isSafe ? 'SAFE' : 'UNSAFE';
        resultText.textContent = request.result.replace('SAFE', '').replace('UNSAFE', '').trim();
  
        // Show result state after a brief delay
        setTimeout(() => {
          loadingState.style.display = 'none';
          resultState.style.display = 'block';
        }, 1700); // Adjust this delay as needed
  
        // Auto-hide popup after result is shown
        setTimeout(() => {
          popup.style.display = 'none';
        }, 7000); // 1.5s for loading + 5s for display
      }
    }
  });