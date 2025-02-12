// import Quagga from 'quagga';

const video = document.getElementById('camera-feed');
const startButton = document.getElementById('start-camera');
const stopButton = document.getElementById('stop-camera');
const canvas = document.getElementById('canvas');
const capturedImagesContainer = document.getElementById('captured-images');
const barcodeResult = document.getElementById('barcode-result');

let captureInterval;

startButton.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(
            { 
                video: {
                width: { min: 1024, ideal: 1280, max: 1920 },
                height: { min: 576, ideal: 720, max: 1080 }, 
                }
            }
        );    
        video.srcObject = stream;

        // Start capturing images every 1 second
        captureInterval = setInterval(captureImage, 1000);

    } catch (error) {
        console.error('Error accessing the camera:', error);
        alert('Unable to access the camera. Please ensure you have granted permission.');
    }
});

stopButton.addEventListener('click', async () => {
    try {
        clearInterval(captureInterval);

    } catch (error) {
        console.error('Error accessing the camera:', error);
        alert('Unable to access the camera. Please ensure you have granted permission.');
    }
});

function captureImage() {
    // Set canvas dimensions to match the video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas image to a data URL (base64)
    const imageDataUrl = canvas.toDataURL('image/png');

    // Display the captured image on the page
    const imgElement = document.createElement('img');
    imgElement.src = imageDataUrl;
    imgElement.style.width = '200px'; // Adjust size as needed
    capturedImagesContainer.appendChild(imgElement);

    // Optionally, save the image or send it to a server
    // saveImage(imageDataUrl);

    // Parse barcode from the captured image
    parseBarcode(imageDataUrl);
}

// Optional: Function to save the image
function saveImage(imageDataUrl) {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `captured-image-${Date.now()}.png`;
    link.click();
}

function parseBarcode(imageDataUrl) {
    // Convert the data URL to a Blob
    fetch(imageDataUrl)
        .then((response) => response.blob())
        .then((blob) => {
            // Create an object URL from the Blob
            const imageUrl = URL.createObjectURL(blob);

            // Use Quagga to decode the barcode
            Quagga.decodeSingle(
                {
                    decoder: {
                        readers: ['code_128_reader', 'ean_reader', 'upc_reader',
                        'ean_8_reader',
                        'code_39_reader',
                        'code_39_vin_reader',
                        'codabar_reader',
                        'upc_e_reader',
                        'i2of5_reader',
                        '2of5_reader',
                        'code_93_reader'], // Add supported barcode types
                    },
                    debug: {
                        drawBoundingBox: false,
                        showFrequency: false,
                        drawScanline: false,
                        showPattern: false
                    },
                    locate: true,
                    src: imageUrl,
                },
                (result) => {
                    if (result && result.codeResult) {
                        barcodeResult.textContent = `Barcode: ${result.codeResult.code}`;
                    } else {
                        barcodeResult.textContent = 'No barcode detected.';
                    }
                }
            );
        })
        .catch((error) => {
            console.error('Error parsing barcode:', error);
            barcodeResult.textContent = 'Error parsing barcode.';
        });
}
  

// Stop capturing when the page is closed or refreshed
window.addEventListener('beforeunload', () => {
    clearInterval(captureInterval);
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}