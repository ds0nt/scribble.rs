package server

import (
	"fmt"
	"os"
	"time"

	rtctokenbuilder "github.com/AgoraIO/Tools/DynamicKey/AgoraDynamicKey/go/src/RtcTokenBuilder"
)

var (
	agoraAppID          string
	agoraAppCertificate string
)

func init() {
	agoraAppID = "89f97462e28540e68a6a90760c9ca113"
	agoraAppCertificate = os.Getenv("AGORA_CERT")
}

var agoraNextUID uint32 = 1

const agoraExpireTimeInSeconds = uint32(24 * 60 * 60)

func getAgoraToken(channelName string) (uint32, string, error) {
	if len(agoraAppCertificate) == 0 {
		return 0, "", fmt.Errorf("agora credentials not configured")
	}
	uid := agoraNextUID
	agoraNextUID++

	currentTimestamp := uint32(time.Now().UTC().Unix())
	expireTimestamp := currentTimestamp + agoraExpireTimeInSeconds

	result, err := rtctokenbuilder.BuildTokenWithUID(agoraAppID, agoraAppCertificate, channelName, uid, rtctokenbuilder.RoleAttendee, expireTimestamp)
	if err != nil {
		return 0, "", err
	}
	return uid, result, nil
}
