package game

import (
	"io/ioutil"
	"math/rand"
	"strings"
	"time"

	"github.com/markbates/pkger"
)

var (
	wordListCache = make(map[string][]string)
	languageMap   = map[string]string{
		"english": "words_en",
		"french":  "words_fr",
	}
)

func readWordList(chosenLanguage string) ([]string, error) {
	langFileName := languageMap[chosenLanguage]
	list, available := wordListCache[langFileName]
	if available {
		return list, nil
	}

	wordListFile, err := pkger.Open("/resources/words/" + langFileName)
	if err != nil {
		panic(err)
	}
	defer wordListFile.Close()

	data, err := ioutil.ReadAll(wordListFile)
	if err != nil {
		return nil, err
	}

	tempWords := strings.Split(string(data), "\n")
	var words []string
	for _, word := range tempWords {
		word = strings.TrimSpace(word)
		if strings.HasSuffix(word, "#i") {
			continue
		}

		lastIndexNumberSign := strings.LastIndex(word, "#")
		if lastIndexNumberSign == -1 {
			words = append(words, word)
		} else {
			words = append(words, word[:lastIndexNumberSign])
		}
	}

	wordListCache[langFileName] = words

	return words, nil
}

// GetRandomWords gets 3 random words for the passed Lobby. The words will be
// chosen from the custom words and the default dictionary, depending on the
// settings specified by the Lobby-Owner.
func (l *Lobby) GetRandomWords() []string {
	rand.Seed(time.Now().Unix())
	wordsNotToPick := l.alreadyUsedWords
	wordOne := l.getRandomWordWithCustomWordChance(wordsNotToPick, l.Settings.CustomWords, l.Settings.CustomWordsChance)
	wordsNotToPick = append(wordsNotToPick, wordOne)
	wordTwo := l.getRandomWordWithCustomWordChance(wordsNotToPick, l.Settings.CustomWords, l.Settings.CustomWordsChance)
	wordsNotToPick = append(wordsNotToPick, wordTwo)
	wordThree := l.getRandomWordWithCustomWordChance(wordsNotToPick, l.Settings.CustomWords, l.Settings.CustomWordsChance)

	return []string{
		wordOne,
		wordTwo,
		wordThree,
	}
}

func (l *Lobby) getRandomWordWithCustomWordChance(wordsAlreadyUsed []string, customWords []string, customWordChance int) string {
	if rand.Intn(100)+1 <= customWordChance {
		return l.getUnusedCustomWord(wordsAlreadyUsed, customWords)
	}

	return l.getUnusedRandomWord(wordsAlreadyUsed)
}

func (l *Lobby) getUnusedCustomWord(wordsAlreadyUsed []string, customWords []string) string {
OUTER_LOOP:
	for _, word := range customWords {
		for _, usedWord := range wordsAlreadyUsed {
			if usedWord == word {
				continue OUTER_LOOP
			}
		}

		return word
	}

	return l.getUnusedRandomWord(wordsAlreadyUsed)
}

func (l *Lobby) getUnusedRandomWord(wordsAlreadyUsed []string) string {
	//We attempt to find a random word for a hundred times, afterwards we just use any.
	randomnessAttempts := 0
	var word string
OUTER_LOOP:
	for {
		word = l.words[rand.Int()%len(l.words)]
		for _, usedWord := range wordsAlreadyUsed {
			if usedWord == word {
				if randomnessAttempts == 100 {
					break OUTER_LOOP
				}

				randomnessAttempts++
				continue OUTER_LOOP
			}
		}
		break
	}

	return word
}
