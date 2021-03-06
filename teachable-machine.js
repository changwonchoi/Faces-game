// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/ouD6W4gvb/";
let machine_model, webcam, ctx, labelContainer, maxPredictions;
let is_init = false;
var move;
var is_not_pause = true;

async function init() {

    if (is_init) {
        return
    } 

	const modelURL = URL + "model.json";
	const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    machine_model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = machine_model.getTotalClasses();

    // Convenience function to setup a webcam
    const size = 200;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(machine_loop);

    // append/get elements to the DOM
    const canvas = document.getElementById("webcam");
    canvas.width = size; canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) { // and class labels
    	labelContainer.appendChild(document.createElement("div"));
    }
    is_init = true;
}

async function machine_loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(machine_loop);
}

async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await machine_model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await machine_model.predict(posenetOutput);
    prediction.sort((a,b) => parseFloat(b.probability) - parseFloat(a.probability));
    labelContainer.childNodes[0].innerHTML = prediction[0].className;
    if (prediction[0].probability > 0.80) {
        move = prediction[0].className;
    }
    else {
        move = "Unknown"
    }

    if (move != "Pause" && move != "Unknown"){
        is_not_pause = true;
    }

    if (move == "Pause" && is_pause && is_not_pause && is_start){
        unpause();
    }
    
    if (move == "Pause" && !is_pause && is_not_pause && is_start){
        pause();
    }

    // finally draw the poses
    drawPose(pose);
}

function drawPose(pose) {
	if (webcam.canvas) {
		ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
        	const minPartConfidence = 0.5;
        	tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
        	tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}
