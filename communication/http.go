package communication

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/markbates/pkger"
)

func setupRoutes() *http.ServeMux {
	mux := http.NewServeMux()
	//Endpoints for official webclient
	mux.Handle("/resources/", http.StripPrefix("/resources/", http.FileServer(pkger.Dir("/resources"))))
	mux.HandleFunc("/", homePage)
	mux.HandleFunc("/ssrEnterLobby", ssrEnterLobbyHandler)
	mux.HandleFunc("/ssrCreateLobby", ssrCreateLobbyHandler)

	//The websocket is shared between the public API and the official client
	mux.HandleFunc("/v1/ws", wsEndpoint)

	//These exist only for the public API. We version them in order to ensure
	//backwards compatibility as far as possible.
	mux.HandleFunc("/v1/lobby", createLobbyHandler)
	mux.HandleFunc("/v1/lobby/player", enterLobbyHandler)
	return mux
}

// Serve runs http server on the port
func Serve(port int) error {
	routes := setupRoutes()
	return http.ListenAndServe(fmt.Sprintf(":%d", port), routes)
}

//userFacingError will return the occurred error as a custom html page to the caller.
func userFacingError(w http.ResponseWriter, errorMessage string) {
	err := errorPage.ExecuteTemplate(w, "error.html", errorMessage)
	//This should never happen, but if it does, something is very wrong.
	if err != nil {
		panic(err)
	}
}

func remoteAddressToSimpleIP(input string) string {
	address := input
	lastIndexOfDoubleColon := strings.LastIndex(address, ":")
	if lastIndexOfDoubleColon != -1 {
		address = address[:lastIndexOfDoubleColon]
	}

	return strings.TrimSuffix(strings.TrimPrefix(address, "["), "]")
}
