package game

// GetLobby returns a Lobby that has a matching ID or no Lobby if none could
// be found.
func GetLobby(id string) *Lobby {
	for _, l := range lobbies {
		if l.ID == id {
			return l
		}
	}

	return nil
}

func (l *Lobby) HasConnectedPlayers() bool {
	for _, p := range l.Players {
		if p.Connected {
			return true
		}
	}

	return false
}

// GetPlayer searches for a player, identifying them by usersession.
func (l *Lobby) GetPlayer(userSession string) *Player {
	for _, player := range l.Players {
		if player.userSession == userSession {
			return player
		}
	}

	return nil
}

func (l *Lobby) GetAvailableWordHints(player *Player) []*WordHint {
	//The draw simple gets every character as a word-hint. We basically abuse
	//the hints for displaying the word, instead of having yet another GUI
	//element that wastes space.
	if player.State == PlayerStateDrawing || player.State == PlayerStateStandby {
		return l.WordHintsShown
	} else {
		return l.WordHints
	}
}

func (l *Lobby) canDraw(player *Player) bool {
	return l.Drawer == player && l.CurrentWord != ""
}

func (l *Lobby) isAnyoneStillGuessing() bool {
	for _, otherPlayer := range l.Players {
		if otherPlayer.State == PlayerStateGuessing && otherPlayer.Connected {
			return true
		}
	}

	return false
}
