document.addEventListener('DOMContentLoaded', function() {
  const checkPageButton = document.getElementById('checkPageButton');
  const resultsArea = document.getElementById('resultsArea'); // Get reference here

  if (checkPageButton) {
    checkPageButton.addEventListener('click', function() {
      console.log('Check Page button clicked');
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs.length > 0) {
          const tabId = tabs[0].id;
          if (tabId) {
            chrome.tabs.sendMessage(tabId, { action: "checkPage" });
          } else {
            console.error("No valid tab ID found.");
          }
        } else {
          console.error("No active tab found.");
        }
      });
    });
  } else {
    console.error('Error: checkPageButton not found');
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "results") {
      // Clear any previous results
      resultsArea.innerHTML = '';

      const failingImages = request.data;

      if (failingImages && failingImages.length > 0) {
        const ul = document.createElement('ul');
        failingImages.forEach(image => {
          const li = document.createElement('li');
          // Using outerHTML for a more direct representation of the failing image
          li.textContent = `Failing image: ${image.outerHTML}`;
          if (image.src) {
            li.textContent += ` (SRC: ${image.src})`;
          }
          ul.appendChild(li);
        });
        resultsArea.appendChild(ul);
      } else {
        resultsArea.textContent = "No images found without alt text or with empty alt text.";
      }
    }
  });
});
