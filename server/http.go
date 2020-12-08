package server

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/markbates/pkger"
)

func makeServeMux() *http.ServeMux {
	mux := http.NewServeMux()
	//Endpoints for official webclient
	mux.Handle("/resources/", http.StripPrefix("/resources/", http.FileServer(pkger.Dir("/resources"))))
	mux.HandleFunc("/", homePage)
	mux.HandleFunc("/ssrEnterLobby", ssrEnterLobbyHandler)
	mux.HandleFunc("/ssrCreateLobby", ssrCreateLobbyHandler)

	//The websocket is shared between the public API and the official client
	mux.HandleFunc("/v1/ws", wsEndpoint)

	return mux
}

// Serve runs http server on the port
func Serve(port int) error {
	mux := makeServeMux()
	return http.ListenAndServe(fmt.Sprintf(":%d", port), mux)
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
