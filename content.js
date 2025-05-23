console.log("Content script loaded.");

function checkImageAltText() {
  const images = document.querySelectorAll('img');
  const failingImages = [];

  images.forEach(image => {
    if (!image.hasAttribute('alt') || image.getAttribute('alt').trim() === '') {
      failingImages.push({
        src: image.getAttribute('src'),
        outerHTML: image.outerHTML
      });
    }
  });
  return failingImages; // Return the array instead of logging
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "checkPage") {
    const failingImagesArray = checkImageAltText();
    // Send response back to popup.js
    sendResponse({ action: "results", data: failingImagesArray });
  }
  return true; // Indicate that sendResponse will be called asynchronously
});
