import "./style.css";
import koKR from "./locales/ko-KR.json";
import enUS from "./locales/en-US.json";
import { SpeechManager } from "./main/speech";
import { IRecvMessage } from "./work/worker-types";
import FrameWorker from "./work/worker?worker";
import { I18n } from "i18n-js";
import { BOSSES } from "./bosses/index";
import type { BossConfig } from "./bosses/types";

const i18n = new I18n({
    en: enUS,
    "ko-KR": koKR,
});
i18n.availableLocales = ["en", "ko-KR"];
// i18n.locale = "ko-KR";

const bossOptions = BOSSES.map((b, i) => `<option value="${i}">${b.name}</option>`).join("");

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <video id="video" autoplay playsinline></video>
  <video id="pip_video" autoplay playsinline></video>
  <h2>${i18n.translate("how-to-use")}</h2>
  <ol>
      <li>${i18n.translate("how-to-use-desc-1")}</li>
      <li><button id="streaming_button">${i18n.translate("screen-share")}</button> ${i18n.translate("how-to-use-desc-2")}</li>
      <canvas id="output_canvas" width="250" height="250"></canvas>
      <button id="pip_button">${i18n.translate("pip-mode")}</button>
      <li>
        ${i18n.translate("how-to-use-desc-3")}
        &nbsp;
        <select id="boss_select">${bossOptions}</select>
      </li>
      <li>${i18n.translate("how-to-use-desc-4")}</li>
  </ol>
  <div id="monitoring">
      <span id="monitoring_button">${i18n.translate("screen-preview")}</span>
      <canvas id="canvas" width="800" height="150" ></canvas>
  </div>
`;

// Spaghetti starts here
const monitoringButton = document.getElementById("monitoring_button") as HTMLButtonElement;
const monitoring = document.getElementById("monitoring") as HTMLDivElement;
const streamingButton = document.getElementById("streaming_button") as HTMLButtonElement;
const pipVideo = document.getElementById("pip_video") as HTMLVideoElement;
const pipButton = document.getElementById("pip_button") as HTMLButtonElement;
const video = document.getElementById("video") as HTMLVideoElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const outputCanvas = document.getElementById("output_canvas") as HTMLCanvasElement;
const outputCtx = outputCanvas.getContext("2d") as CanvasRenderingContext2D;
const bossSelect = document.getElementById("boss_select") as HTMLSelectElement;
const outputCanvasBg = new Image();
outputCanvasBg.src = new URL("./assets/output_canvas_bg.png", import.meta.url).href;
const unmuteImg = new Image();
unmuteImg.src = new URL("./assets/unmute_img.png", import.meta.url).href;
const muteImg = new Image();
muteImg.src = new URL("./assets/mute_img.png", import.meta.url).href;

const synth = window.speechSynthesis;
const speechManager = synth ? new SpeechManager(synth, i18n.locale) : null;

// Number of milliseconds to throttle each frame
const throttleRate = 100;

let worker: Worker;
let timeRect: number[] | null;
let hpRect: number[] | null;
let timeResult: number | null;
let hpResult: number | null;
let timeStamp: number;
let time: number | null;
let hp: number | null;

let isStreaming = false;
let fmaSoon = false;

let selectedBoss: BossConfig = BOSSES[0];
let patternTime = selectedBoss.defaultPatternTime;
let patternHp = 100;
let difficulty = 0;

function resetBossState() {
    timeRect = null;
    hpRect = null;
    timeResult = null;
    hpResult = null;
    time = null;
    hp = null;
    fmaSoon = false;
    patternTime = selectedBoss.defaultPatternTime;
    patternHp = 100;
    difficulty = 0;
}

if (typeof Worker !== undefined && navigator.mediaDevices) {
    worker = new FrameWorker();
    worker.onmessage = (result: MessageEvent<IRecvMessage>) => {
        setTimeout((() => {
            const now = Date.now();
            timeRect = result.data.timeRect;
            hpRect = result.data.hpRect;
            timeResult = result.data.time;
            hpResult = result.data.hp;
            if (hpResult) {
                hp = hpResult;
            }
            if (timeResult && timeResult != time) {
                timeStamp = now;
                time = timeResult;
            }
            if (time && hp && result.data.pattern > 0.1) {
                patternTime = Math.round(time + 2 - (now - timeStamp) / 1000);
                patternHp = hp;
            }
            main();
            sendStream();
            ctx.strokeStyle = "#00FF00";
            ctx.lineWidth = 2;
            if (timeRect) {
                ctx.strokeRect(timeRect[0], timeRect[1], timeRect[2], timeRect[3]);
            }
            if (hpRect) {
                ctx.strokeRect(hpRect[0], hpRect[1], hpRect[2], hpRect[3]);
            }
            let patternRect = result.data.patternRect;
            if (patternRect) {
                for (let i = 0; i < patternRect.length; i++) {
                    ctx.strokeRect(patternRect[i][0], patternRect[i][1], patternRect[i][2], patternRect[i][3]);
                }
            }
        }), throttleRate);
    };
    video.addEventListener("play", sendStream);
    outputCanvas.addEventListener("click", function (e) {
        const rect = outputCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let xDivide = 70;
        let xBound = 115;
        if (i18n.locale.includes("ko")) {
            xDivide = 45;
            xBound = 90;
        }
        if (x < xBound && y < 40) {
            const clicked = Math.floor(x / xDivide);
            if (clicked < selectedBoss.difficulties.length) {
                difficulty = clicked;
            }
        } else if (100 < x && x < 145 && 200 < y && y < 245) {
            speechManager?.toggleMute();
        }
    });
    bossSelect.addEventListener("change", function () {
        selectedBoss = BOSSES[parseInt(bossSelect.value)];
        resetBossState();
    });
    pipButton.addEventListener("click", function () {
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        } else {
            pipVideo.requestPictureInPicture();
        }
    });
    streamingButton.addEventListener("click", startStream);
    monitoringButton.addEventListener("click", function () {
        if (canvas.style.display === "none") {
            canvas.style.display = "block";
        } else {
            canvas.style.display = "none";
        }
    });
} else {
    document.body.innerHTML = "";
    alert(i18n.translate("browser-not-supported"));
}

function startStream() {
    if (isStreaming) {
        return;
    }
    navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: true,
    }).then((mediaStream) => {
        isStreaming = true;
        video.srcObject = mediaStream;
        outputCanvas.style.display = monitoring.style.display = "block";
        if (document.pictureInPictureEnabled) {
            pipButton.style.display = "block";
            pipVideo.srcObject = outputCanvas.captureStream();
        }
        const videoTrack = mediaStream.getVideoTracks()[0];
        videoTrack.addEventListener("ended", () => {
            isStreaming = false;
            video.srcObject = null;
            outputCanvas.style.display = monitoring.style.display = canvas.style.display = "none";
            if (document.pictureInPictureEnabled) {
                if (document.pictureInPictureElement) document.exitPictureInPicture();
                pipButton.style.display = "none";
                pipVideo.srcObject = null;
            }
        });
    });
}

function sendStream() {
    if (!isStreaming) {
        return;
    }
    let canvasWidth = video.videoWidth;
    let canvasHeight = Math.floor(video.videoHeight / 4);
    if (canvasWidth && canvasHeight) {
        if (canvas.width != canvasWidth || canvas.height != canvasHeight) {
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const frameBuffer = ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer;
    worker.postMessage(
        {
            fmaSoon,
            frameBuffer,
            frameWidth: canvas.width,
            frameHeight: canvas.height,
            timeRect,
            hpRect,
            detectRedPattern: selectedBoss.detectRedPattern,
        },
        [frameBuffer]
    );
}

function main() {
    outputCtx.drawImage(outputCanvasBg, 0, 0, outputCanvas.width, outputCanvas.height);
    outputCtx.textBaseline = "top";
    outputCtx.textAlign = "left";
    if (speechManager) {
        outputCtx.drawImage(!speechManager.isMuted() ? unmuteImg : muteImg, 108, 208, 32, 32);
    }

    // Draw difficulty selector for the selected boss
    outputCtx.font = "15pt Nanum Gothic";
    const spacing = i18n.locale.includes("ko") ? 50 : 70;
    selectedBoss.difficulties.forEach((d, i) => {
        outputCtx.fillStyle = difficulty === i ? "#FFFFFF" : "#FFFFFF40";
        outputCtx.fillText(d.label, 5 + i * spacing, 12);
    });

    if (!time) {
        return;
    }

    // HP-based bosses additionally require hp to be detected
    if (!hp && !selectedBoss.fixedPattern) {
        return;
    }

    const currentDiff = selectedBoss.difficulties[difficulty];
    let currTime = time - Math.floor((Date.now() - timeStamp) / 1000);

    outputCtx.textAlign = "center";
    let estimatedTime: number[];

    if (selectedBoss.fixedPattern) {
        // Pure time-based mechanic: calculate next event from current fight timer
        const { firstEventAt, intervalSeconds } = selectedBoss.fixedPattern;
        const elapsedSinceFirst = firstEventAt - currTime;
        const n = Math.max(0, Math.ceil(elapsedSinceFirst / intervalSeconds));
        estimatedTime = [firstEventAt - n * intervalSeconds];
    } else {
        // HP-threshold based mechanic (Hilla style)
        let patternCycle = 0;
        for (const threshold of currentDiff.hpThresholds) {
            if (patternHp < threshold) patternCycle++;
        }

        // Uncertain when HP is exactly on a threshold boundary
        const uncertain = currentDiff.hpThresholds.some(t => Math.round(patternHp) === t);

        estimatedTime = [patternTime - currentDiff.patternIntervals[patternCycle]];
        if (uncertain && patternCycle + 1 < currentDiff.patternIntervals.length) {
            const altInterval = currentDiff.patternIntervals[patternCycle + 1];
            const nextEstimatedTime = estimatedTime[0] + (currentDiff.patternIntervals[patternCycle] - altInterval);
            if (currTime - nextEstimatedTime >= 0) {
                estimatedTime.push(nextEstimatedTime);
            }
        }
    }

    for (let i = 0; i < estimatedTime.length; i++) {
        if (estimatedTime[i] < 0) {
            continue;
        }
        const remainingTime = Math.max(0, currTime - estimatedTime[i]);
        if (i === estimatedTime.length - 1) {
            if (!hpRect && time > 2 && (hp ?? 0) > 2) {
                speechManager?.speak(i18n.translate("hp-not-recognized"), true);
            } else if (remainingTime > 0) {
                if (remainingTime <= 10 && !fmaSoon) {
                    fmaSoon = true;
                } else if (remainingTime > 10 && fmaSoon) {
                    fmaSoon = false;
                }
                if (remainingTime <= 10) {
                    speechManager?.speak(remainingTime.toString());
                } else if ((remainingTime < 60 && remainingTime % 10 === 0) || remainingTime % 30 === 0) {
                    const minutes = Math.floor(remainingTime / 60);
                    const seconds = remainingTime - minutes * 60;
                    let txt = `${minutes > 0 ? minutes + i18n.translate("time.min") + " " : ""}${seconds > 0 ? seconds + i18n.translate("time.sec") + " " : ""}`;
                    if (i18n.locale.includes("en")) {
                        const minutesString = minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : '';
                        const secondsString = seconds > 0 ? `${seconds} second${seconds > 1 ? 's' : ''}` : '';
                        txt = `${minutesString}${minutes > 0 && seconds > 0 ? ' and ' : ''}${secondsString}`;
                    }
                    txt += ` ${i18n.translate("remaining")}.`;
                    if (estimatedTime.length > 1) {
                        txt += ` ${i18n.translate("might-come-late")}`;
                    }
                    speechManager?.speak(txt);
                }
            }
        }
        outputCtx.font = (estimatedTime.length > 1 ? 20 : 30) + "pt Nanum Gothic";
        outputCtx.fillStyle = remainingTime > 10 ? "#000000" : "#FF0000";
        outputCtx.strokeStyle = "#FFFFFF";
        outputCtx.lineWidth = 1;
        let txt = remainingTime + i18n.translate("time.sec");
        outputCtx.fillText(txt, 125, 145 + (estimatedTime.length > 1 ? (i === 0 ? 25 : -55) : 0));
        outputCtx.strokeText(txt, 125, 145 + (estimatedTime.length > 1 ? (i === 0 ? 25 : -55) : 0));
        outputCtx.font = (estimatedTime.length > 1 ? 30 : 35) + "pt Nanum Gothic";
        outputCtx.fillStyle = "#FFFFFF";
        outputCtx.strokeStyle = "#000000";
        outputCtx.lineWidth = 2;
        const minutes = Math.floor(estimatedTime[i] / 60);
        const seconds = estimatedTime[i] - minutes * 60;
        txt = `${minutes < 10 ? "0" : ""}${minutes}${i18n.translate("time.min")} ${seconds < 10 ? "0" : ""}${seconds}${i18n.translate("time.sec")}`;
        outputCtx.fillText(txt, 125, 90 + (estimatedTime.length > 1 ? (i === 0 ? 35 : -45) : 0));
        outputCtx.strokeText(txt, 125, 90 + (estimatedTime.length > 1 ? (i === 0 ? 35 : -45) : 0));
    }

    outputCtx.font = "10pt Nanum Gothic";
    outputCtx.textAlign = "left";
    outputCtx.fillStyle = !timeResult ? "#FFFFFF40" : "#FFFFFF";
    outputCtx.fillText(i18n.translate("remaining-time"), 5, 215);
    currTime = Math.max(0, currTime);
    const minutes = Math.floor(currTime / 60);
    const seconds = currTime - minutes * 60;
    outputCtx.fillText(`${minutes < 10 ? "0" : ""}${minutes}${i18n.translate("time.min")} ${seconds < 10 ? "0" : ""}${seconds}${i18n.translate("time.sec")}`, 5, 230);
    outputCtx.textAlign = "right";
    outputCtx.fillStyle = !hpResult ? "#FFFFFF40" : "#FFFFFF";
    outputCtx.fillText(i18n.translate("remaining-hp"), 245, 215);
    outputCtx.fillText((hp ?? "-") + "%", 245, 230);
}
