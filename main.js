import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import "./styles.css";
import "./cursor";

const video$ = document.querySelector("video");
const canvas$ = document.querySelector("canvas");
const ctx = canvas$.getContext("2d");

const width = 320;
const height = 480;

canvas$.width = width;
canvas$.height = height;

const constraints = {
  audio: false,
  video: { width, height },
};

navigator.mediaDevices
  // `getUserMedia` возвращает промис
  .getUserMedia(constraints)
  .then((stream) => {
    video$.srcObject = stream;

    video$.onloadedmetadata = () => {
      video$.play();

      requestAnimationFrame(drawVideoFrame);
    };
  })
  .catch(console.error);

function drawVideoFrame() {
  ctx.drawImage(video$, 0, 0, width, height);
  
  requestAnimationFrame(drawVideoFrame);
}

const videoHands = document.querySelector("video");
const canvasHands = document.querySelector("canvas");
const ctxHands = canvas$.getContext("2d");

const widthHands = 320;
const heightHands = 480;
canvasHands.width = width;
canvasHands.height = height;

function onResults(results) {
  // из всего объекта результатов нас интересует только свойство `multiHandLandmarks`,
  // которое содержит массивы контрольных точек обнаруженных кистей
  if (!results.multiHandLandmarks.length) return;

  // при обнаружении 2 кистей, например, `multiHandLandmarks` будет содержать 2 массива контрольных точек
  console.log("@landmarks", results.multiHandLandmarks[0]);

  // рисуем видеокадр
  ctxHands.save();
  ctxHands.clearRect(0, 0, widthHands, heightHands);
  ctxHands.drawImage(results.image, 0, 0, widthHands, heightHands);

  // перебираем массивы контрольных точек
  // мы могли бы обойтись без итерации, поскольку у нас имеется лишь один массив,
  // но такое решение является более гибким
  for (const landmarks of results.multiHandLandmarks) {
    // рисуем точки
    drawLandmarks(ctxHands, landmarks, { color: "#FF0000", lineWidth: 2 });
    // рисуем линии
    drawConnectors(ctxHands, landmarks, HAND_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 4,
    });
  }

  ctxHands.restore();
}

const hands = new Hands({
  locateFile: (file) => `../node_modules/@mediapipe/hands/${file}`,
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
});
hands.onResults(onResults);

const camera = new Camera(videoHands, {
  onFrame: async () => {
    await hands.send({ image: videoHands });
  },
  widthHands,
  heightHands,
});
camera.start();

const videoCursor = document.querySelector("video");
const cursor$ = document.querySelector(".cursor");

const widthCursor = window.innerWidth;
const heightCursor = window.innerHeight;

const handParts = {
  wrist: 0,
  thumb: { base: 1, middle: 2, topKnuckle: 3, tip: 4 },
  indexFinger: { base: 5, middle: 6, topKnuckle: 7, tip: 8 },
  middleFinger: { base: 9, middle: 10, topKnuckle: 11, tip: 12 },
  ringFinger: { base: 13, middle: 14, topKnuckle: 15, tip: 16 },
  pinky: { base: 17, middle: 18, topKnuckle: 19, tip: 20 },
};

const hands2 = new Hands({
  locateFile: (file) => `../node_modules/@mediapipe/hands/${file}`,
});
hands2.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
});
hands2.onResults(onResults2);

const camera2 = new Camera(videoCursor, {
  onFrame: async () => {
    await hands.send({ image: videoCursor });
  },
  widthCursor,
  heightCursor,
});
camera2.start();

const getCursorCoords = (landmarks) =>
  landmarks[handParts.indexFinger.topKnuckle];

const convertCoordsToDomPosition = ({ x, y }) => ({
  x: `${x * 100}vw`,
  y: `${y * 100}vh`,
});

function updateCursorPosition(landmarks) {
  const cursorCoords = getCursorCoords(landmarks);
  if (!cursorCoords) return;

  const { x, y } = convertCoordsToDomPosition(cursorCoords);

  cursor$.style.transform = `translate(${x}, ${y})`;
}

function onResults2(handData) {
  if (!handData.multiHandLandmarks.length) return;

  updateCursorPosition(handData.multiHandLandmarks[0]);
}

