import AgoraRTC from 'agora-rtc-sdk'

let remoteContainer = document.getElementById("video-grid");

// Handle errors.
let handleError = function (err) {
    console.error("Error: ", err);
};

// Query the container to which the remote stream belong.

// Add video streams to the container.
function addVideoStream(elementId) {
    // Creates a new div for every stream
    let streamDiv = document.createElement("div");
    // Assigns the elementId to the div.
    streamDiv.id = elementId;
    // Takes care of the lateral inversion
    streamDiv.style.transform = "rotateY(180deg)";
    // Adds the div to the container.
    remoteContainer.appendChild(streamDiv);
    console.log("Adding video stream", elementId)
};

// Remove the video stream from the container.
function removeVideoStream(elementId) {
    let remoteDiv = document.getElementById(elementId);
    if (remoteDiv) remoteDiv.parentNode.removeChild(remoteDiv);
};

var client = AgoraRTC.createClient({
    mode: "rtc",
    codec: "vp8",
});


var appID = agoraAppId
var token = agoraToken
var channel = lobbyId
var uid = agoraUid

client.init(appID)

let localStream = null
let remoteStreams = []



export let videoButtons = document.getElementById("video-buttons")
export let muteMic = document.getElementById("mute-mic")
export let muteCamera = document.getElementById("mute-camera")
export let muteSpeakers = document.getElementById("mute-speakers")


let mutedAudio = false
export const muteAudio = () => {
    mutedAudio = true;
    localStream.muteAudio()

}
let mutedVideo = false
export const muteVideo = () => {
    mutedVideo = true;
    localStream.muteVideo()
    localStream.disableVideo()

}
let mutedOthers = false
export const muteOthers = () => {
    mutedOthers = true;
    remoteStreams.map(v => v.muteAudio())

}

export const unmuteAudio = () => {
    mutedAudio = false
    localStream.unmuteAudio()
}
export const unmuteVideo = () => {
    mutedVideo = false
    localStream.unmuteVideo()
    localStream.enableVideo()

}
export const unmuteOthers = () => {
    mutedOthers = false
    remoteStreams.map(v => v.unmuteAudio())
}


muteMic.onclick = e => {
    if (mutedAudio) {
        muteMic.className = ""
        // muteMic.innerHTML = "mute mic"
        muteMic.children[0].style.display = "inline"
        muteMic.children[1].style.display = "none"
        unmuteAudio()
    } else {
        muteMic.className = "muted"
        muteMic.children[0].style.display = "none"
        muteMic.children[1].style.display = "inline"
        // e.target.innerHTML = "unmute mic"
        muteAudio()
    }
}

muteCamera.onclick = e => {
    if (mutedVideo) {
        muteCamera.className = ""
        // muteCamera.innerHTML = "mute camera"
        muteCamera.children[0].style.display = "inline"
        muteCamera.children[1].style.display = "none"
        unmuteVideo()
    } else {
        muteCamera.className = "muted"
        muteCamera.children[0].style.display = "none"
        muteCamera.children[1].style.display = "inline"
        // muteCamera.innerHTML = "unmute camera"
        muteVideo()
    }
}


muteSpeakers.onclick = e => {
    if (mutedOthers) {
        muteSpeakers.className = ""
        // muteSpeakers.innerHTML = "mute speakers"
        muteSpeakers.children[0].style.display = "inline"
        muteSpeakers.children[1].style.display = "none"
        unmuteOthers()
    } else {
        muteSpeakers.className = "muted"
        muteSpeakers.children[0].style.display = "none"
        muteSpeakers.children[1].style.display = "inline"
        // muteSpeakers.innerHTML = "unmute speakers"
        muteOthers()
    }
}

// Join a channel
client.join(token, channel, uid, (uid) => {
    // Initialize the local stream
    localStream = AgoraRTC.createStream({
        audio: true,
        video: true,
    });
    // Initialize the local stream
    localStream.init(() => {
        // Play the local stream
        localStream.play("me");
        videoButtons.style.display = 'flex';
        // Publish the local stream
        client.publish(localStream, handleError);
    }, handleError);
}, handleError);


// Subscribe to the remote stream when it is published
client.on("stream-added", function (evt) {
    client.subscribe(evt.stream, handleError);
    remoteStreams.push(evt.stream)
});
// Play the remote stream when it is subsribed
client.on("stream-subscribed", function (evt) {
    let stream = evt.stream;
    let streamId = String(stream.getId());
    addVideoStream(streamId);
    stream.play(streamId);
});

// Remove the corresponding view when a remote user unpublishes.
client.on("stream-removed", function (evt) {
    remoteStreams = remoteStreams.filter(v => v != evt.stream)
    let stream = evt.stream;
    let streamId = String(stream.getId());
    stream.close();
    removeVideoStream(streamId);
});
// Remove the corresponding view when a remote user leaves the channel.
client.on("peer-leave", function (evt) {
    let stream = evt.stream;
    let streamId = String(stream.getId());
    stream.close();
    removeVideoStream(streamId);
});

{/* <script>
    const video = new Video(
        {
            //appId, token, channel are from agora
            //appID
            appID: "5f05c8ce1679426aac75f20b14e83bfc", //replace with app ID,
            //TOKEN will need to be generated by server (agora docs have a walkthrough)
            token: "0065f05c8ce1679426aac75f20b14e83bfcIABpX9EZpCdpd84l6Ou9intToL7gMJnR40r/c4O1V7IXevfI+dsAAAAAEADxMb4b00fWXgEAAQDKR9Ze", //replace with channel token,
            //Channel will be what varies from lobby to lobby (works alongside the token)
            channel: "1111", //replace with channel name (linked with token),
            mode: "live",
            codec: "h264"
        }
    );
</script> */}
