package communication

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/scribble-rs/scribble.rs/game"
)

//This file contains the API methods for the public API

func enterLobbyHandler(w http.ResponseWriter, r *http.Request) {
	lobby, err := getLobbyHandler(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	player := getPlayer(lobby, r)

	lobbyData := &LobbyData{
		LobbyID:                lobby.ID,
		DrawingBoardBaseWidth:  DrawingBoardBaseWidth,
		DrawingBoardBaseHeight: DrawingBoardBaseHeight,
	}

	if player == nil {
		if len(lobby.State.Players) >= lobby.Settings.MaxPlayers {
			http.Error(w, "lobby already full", http.StatusUnauthorized)
			return
		}

		matches := 0
		for _, otherPlayer := range lobby.State.Players {
			socket := otherPlayer.GetWebsocket()
			if socket != nil && remoteAddressToSimpleIP(socket.RemoteAddr().String()) == remoteAddressToSimpleIP(r.RemoteAddr) {
				matches++
			}
		}

		if matches >= lobby.Settings.ClientsPerIPLimit {
			http.Error(w, "maximum amount of player per IP reached", http.StatusUnauthorized)
			return
		}

		var playerName = getPlayernameHandler(r)
		userSession := lobby.JoinPlayer(playerName)

		// Use the players generated usersession and pass it as a cookie.
		http.SetCookie(w, &http.Cookie{
			Name:     "usersession",
			Value:    userSession,
			Path:     "/",
			SameSite: http.SameSiteStrictMode,
		})
	}

	encodingError := json.NewEncoder(w).Encode(lobbyData)
	if encodingError != nil {
		http.Error(w, encodingError.Error(), http.StatusInternalServerError)
	}
}

func createLobbyHandler(w http.ResponseWriter, r *http.Request) {
	formParseError := r.ParseForm()
	if formParseError != nil {
		http.Error(w, formParseError.Error(), http.StatusBadRequest)
		return
	}

	//Prevent resetting the form, since that would be annoying as hell.
	pageData := parseCreatePageData(r)
	lobbyParams, language, errors := parseCreateLobbyData(r)
	pageData.Errors = errors

	if len(pageData.Errors) != 0 {
		http.Error(w, strings.Join(pageData.Errors, ";"), http.StatusBadRequest)
		return
	}

	var playerName = getPlayernameHandler(r)
	player, lobby, createError := game.NewLobby(playerName, language, lobbyParams)
	if createError != nil {
		http.Error(w, createError.Error(), http.StatusBadRequest)
		return
	}

	// Use the players generated usersession and pass it as a cookie.
	http.SetCookie(w, &http.Cookie{
		Name:     "usersession",
		Value:    player.GetSession(),
		Path:     "/",
		SameSite: http.SameSiteStrictMode,
	})

	_, encodingError := fmt.Fprint(w, lobby.ID)
	if encodingError != nil {
		http.Error(w, encodingError.Error(), http.StatusInternalServerError)
	}
}
