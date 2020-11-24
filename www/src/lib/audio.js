
export function playWav(file) {
    let audio = new Audio(file);
    audio.type = 'audio/wav';
    audio.play();
}

export let plop = () => playWav('/resources/plop.wav')
export let yourTurn = () => playWav('/resources/your-turn.wav');
export let endTurn = () => playWav('/resources/end-turn.wav')