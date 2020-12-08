package server

import (
	"html/template"
	"io/ioutil"

	"github.com/markbates/pkger"
)

var (
	errorPage       *template.Template
	lobbyCreatePage *template.Template
	lobbyPage       *template.Template
)

//In this init hook we initialize all templates that could at some point be
//needed during the server runtime. If any of the templates can't be loaded, we
//panic.
func init() {
	var parseError error
	// Error Page
	errorPage, parseError = template.New("error.html").Parse(readTemplateFile("error.html"))
	if parseError != nil {
		panic(parseError)
	}
	errorPage, parseError = errorPage.New("header.html").Parse(readTemplateFile("header.html"))
	if parseError != nil {
		panic(parseError)
	}

	// Create Lobby Page
	lobbyCreatePage, parseError = template.New("lobby_create.html").Parse(readTemplateFile("lobby_create.html"))
	if parseError != nil {
		panic(parseError)
	}
	lobbyCreatePage, parseError = lobbyCreatePage.New("header.html").Parse(readTemplateFile("header.html"))
	if parseError != nil {
		panic(parseError)
	}

	// Main Game Page
	lobbyPage, parseError = template.New("lobby.html").Parse(readTemplateFile("lobby.html"))
	if parseError != nil {
		panic(parseError)
	}
	lobbyPage, parseError = lobbyPage.New("header.html").Parse(readTemplateFile("header.html"))
	if parseError != nil {
		panic(parseError)
	}

}

func readTemplateFile(name string) string {
	templateHandle, pkgerError := pkger.Open("/templates/" + name)
	if pkgerError != nil {
		panic(pkgerError)
	}
	defer templateHandle.Close()

	bytes, readError := ioutil.ReadAll(templateHandle)
	if readError != nil {
		panic(readError)
	}

	return string(bytes)
}
