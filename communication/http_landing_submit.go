package communication

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/scribble-rs/scribble.rs/game"
)

//This file contains the API for the official web client.

// homePage servers the default page for scribble.rs, which is the page to
// create a new lobby.
func homePage(w http.ResponseWriter, r *http.Request) {
	err := lobbyCreatePage.ExecuteTemplate(w, "lobby_create.html", createDefaultLobbyCreatePageData())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func createDefaultLobbyCreatePageData() *CreatePageData {

	return &CreatePageData{
		SettingBounds: game.LobbySettingBounds,
	}
}

// CreatePageData defines all non-static data for the lobby create page.
type CreatePageData struct {
	*game.SettingBounds
	Errors []string
}

func parseCreateLobbyData(r *http.Request) (params game.LobbySettings, language string, errs []string) {
	errs = []string{}

	language = "english"
	params.DrawingTime = 90
	params.Rounds = 5
	params.MaxPlayers = 32
	params.CustomWords = []string{}
	params.CustomWordsChance = 0
	params.ClientsPerIPLimit = 32
	params.EnableVotekick = true
	return
}
func parseCreatePageData(r *http.Request) CreatePageData {
	return CreatePageData{}
}

// ssrCreateLobbyHandler allows creating a lobby, optionally returning errors that
// occurred during creation.
func ssrCreateLobbyHandler(w http.ResponseWriter, r *http.Request) {

	formParseError := r.ParseForm()
	if formParseError != nil {
		http.Error(w, formParseError.Error(), http.StatusBadRequest)
		return
	}
	playerName := getPlayernameHandler(r)
	avatarId, ok := getAvatarId(r)
	if !ok {
		userFacingError(w, "invalid avatar id")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "X-Username",
		Value:    r.Form.Get("name"),
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "X-Avatar",
		Value:    r.Form.Get("avatarId"),
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	//Prevent resetting the form, since that would be annoying as hell.
	pageData := parseCreatePageData(r)

	lobbyParams, language, errors := parseCreateLobbyData(r)
	pageData.Errors = errors
	if len(pageData.Errors) != 0 {
		err := lobbyCreatePage.ExecuteTemplate(w, "lobby_create.html", pageData)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	lobbyID := ""
	lobbyCookie, err := r.Cookie("X-LobbyId")
	if err == nil && lobbyCookie.Value != "" {
		lobbyID = lobbyCookie.Value
		// clear redirect
		http.SetCookie(w, &http.Cookie{
			Name:     "X-LobbyId",
			Value:    "",
			Path:     "/",
			SameSite: http.SameSiteLaxMode,
		})

	}

	if lobbyID == "" {
		player, lobby, createError := game.NewLobby(
			playerName,
			userSession(r),
			language,
			avatarId,
			lobbyParams,
		)
		if createError != nil {
			pageData.Errors = append(pageData.Errors, createError.Error())
			templateError := lobbyCreatePage.ExecuteTemplate(w, "lobby_create.html", pageData)
			if templateError != nil {
				userFacingError(w, templateError.Error())
			}

			return
		}
		lobbyID = lobby.ID

		// Use the players generated usersession and pass it as a cookie.
		http.SetCookie(w, &http.Cookie{
			Name:     "X-UserSession",
			Value:    player.GetSession(),
			Path:     "/",
			SameSite: http.SameSiteLaxMode,
		})
	} else {
		// lobby, err := game.GetLoadLobby(lobbyID)
		// if err != nil {
		// 	userFacingError(w, "lobby not foud")
		// }
		// lobby.JoinPlayer(playerName, "")
	}

	http.Redirect(w, r, "/ssrEnterLobby?lobby_id="+lobbyID, http.StatusFound)
}

func parsePlayerName(value string) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return trimmed, errors.New("the player name must not be empty")
	}

	return trimmed, nil
}

func parsePassword(value string) (string, error) {
	return value, nil
}

func parseLanguage(value string) (string, error) {
	toLower := strings.ToLower(strings.TrimSpace(value))
	for languageKey := range game.SupportedLanguages {
		if toLower == languageKey {
			return languageKey, nil
		}
	}

	return "", errors.New("the given language doesn't match any supported langauge")
}

func parseDrawingTime(value string) (int, error) {
	result, parseErr := strconv.ParseInt(value, 10, 64)
	if parseErr != nil {
		return 0, errors.New("the drawing time must be numeric")
	}

	if result < game.LobbySettingBounds.MinDrawingTime {
		return 0, fmt.Errorf("drawing time must not be smaller than %d", game.LobbySettingBounds.MinDrawingTime)
	}

	if result > game.LobbySettingBounds.MaxDrawingTime {
		return 0, fmt.Errorf("drawing time must not be greater than %d", game.LobbySettingBounds.MaxDrawingTime)
	}

	return int(result), nil
}

func parseRounds(value string) (int, error) {
	result, parseErr := strconv.ParseInt(value, 10, 64)
	if parseErr != nil {
		return 0, errors.New("the rounds amount must be numeric")
	}

	if result < game.LobbySettingBounds.MinRounds {
		return 0, fmt.Errorf("rounds must not be smaller than %d", game.LobbySettingBounds.MinRounds)
	}

	if result > game.LobbySettingBounds.MaxRounds {
		return 0, fmt.Errorf("rounds must not be greater than %d", game.LobbySettingBounds.MaxRounds)
	}

	return int(result), nil
}

func parseMaxPlayers(value string) (int, error) {
	result, parseErr := strconv.ParseInt(value, 10, 64)
	if parseErr != nil {
		return 0, errors.New("the max players amount must be numeric")
	}

	if result < game.LobbySettingBounds.MinMaxPlayers {
		return 0, fmt.Errorf("maximum players must not be smaller than %d", game.LobbySettingBounds.MinMaxPlayers)
	}

	if result > game.LobbySettingBounds.MaxMaxPlayers {
		return 0, fmt.Errorf("maximum players must not be greater than %d", game.LobbySettingBounds.MaxMaxPlayers)
	}

	return int(result), nil
}

func parseCustomWords(value string) ([]string, error) {
	trimmedValue := strings.TrimSpace(value)
	if trimmedValue == "" {
		return nil, nil
	}

	result := strings.Split(trimmedValue, ",")
	for index, item := range result {
		trimmedItem := strings.ToLower(strings.TrimSpace(item))
		if trimmedItem == "" {
			return nil, errors.New("custom words must not be empty")
		}
		result[index] = trimmedItem
	}

	return result, nil
}

func parseClientsPerIPLimit(value string) (int, error) {
	result, parseErr := strconv.ParseInt(value, 10, 64)
	if parseErr != nil {
		return 0, errors.New("the clients per IP limit must be numeric")
	}

	if result < game.LobbySettingBounds.MinClientsPerIPLimit {
		return 0, fmt.Errorf("the clients per IP limit must not be lower than %d", game.LobbySettingBounds.MinClientsPerIPLimit)
	}

	if result > game.LobbySettingBounds.MaxClientsPerIPLimit {
		return 0, fmt.Errorf("the clients per IP limit must not be higher than %d", game.LobbySettingBounds.MaxClientsPerIPLimit)
	}

	return int(result), nil
}

func parseCustomWordsChance(value string) (int, error) {
	result, parseErr := strconv.ParseInt(value, 10, 64)
	if parseErr != nil {
		return 0, errors.New("the custom word chance must be numeric")
	}

	if result < 0 {
		return 0, errors.New("custom word chance must not be lower than 0")
	}

	if result > 100 {
		return 0, errors.New("custom word chance must not be higher than 100")
	}

	return int(result), nil
}
