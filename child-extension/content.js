const createPopup = (id, title, initialMessage) => {
  const popupHTML = `
    <div id="${id}" style="
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
      margin-top: 20px;
      margin-top: ${id === 'safety-popup-cyberbullying' ? '120px' : '20px'};
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
          ">${title}</h3>
        </div>
        <button id="close-${id}" style="
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
      <div style="padding: 16px;">
        <!-- Loading State -->
        <div id="loading-state-${id}" style="
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
          ">${initialMessage}</span>
        </div>

        <!-- Result State -->
        <div id="result-state-${id}" style="display: none;">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
          ">
              <span id="safety-result-${id}" style="
              font-size: 13px;
              color: #333;
              font-weight: 400;
            "></span>
            <span id="safety-badge-${id}" style="
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
      #close-${id}:hover {
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
  document.getElementById(`close-${id}`).addEventListener('click', () => {
    const popup = document.getElementById(id);
    popup.style.display = 'none';
  });
};

createPopup('safety-popup-url', 'URL Safety Alert', 'Predicting URL Safety...');
createPopup('safety-popup-cyberbullying', 'Content Safety Alert', 'Analyzing content...');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getPageContent') {
    sendResponse(document.body.innerText);
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'urlSafetyCheck' || request.type === 'cyberbullyingDetected') {
    const popupId = request.type === 'urlSafetyCheck' ? 'safety-popup-url' : 'safety-popup-cyberbullying';
    const popup = document.getElementById(popupId);
    
    // Position the cyberbullying popup below the URL popup if both are showing
    if (popupId === 'safety-popup-cyberbullying') {
      const urlPopup = document.getElementById('safety-popup-url');
      if (urlPopup && urlPopup.style.display !== 'none') {
        popup.style.marginTop = '200px'; // Adjust this value as needed
      }
    }

    const loadingState = document.getElementById(`loading-state-${popupId}`);
    const resultState = document.getElementById(`result-state-${popupId}`);
    const safetyBadge = document.getElementById(`safety-badge-${popupId}`);
    const resultText = document.getElementById(`safety-result-${popupId}`);

    if (popup) {
      popup.style.display = 'block';
      loadingState.style.display = 'flex';
      resultState.style.display = 'none';

      let isSafe, resultMessage;
      if (request.type === 'urlSafetyCheck') {
        isSafe = request.result.includes('SAFE');
        resultMessage = request.result.replace('SAFE', '').replace('UNSAFE', '').trim();
      } else {
        isSafe = request.result;
        resultMessage = request.message;
      }

      safetyBadge.style.backgroundColor = isSafe ? '#16a34a' : '#dc2626';
      safetyBadge.textContent = isSafe ? 'SAFE' : 'UNSAFE';
      resultText.textContent = resultMessage;

      setTimeout(() => {
        loadingState.style.display = 'none';
        resultState.style.display = 'block';
      }, 1700);

      setTimeout(() => {
        popup.style.display = 'none';
      }, 7000);
    }
  }
});
