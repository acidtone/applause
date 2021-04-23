var applause = new Tone.Player("assets/applause.mp3").toMaster();

function play() {
  Tone.Transport.start();
}

// sync the Players to the Transport like this
applause.sync().start(0);

const button = document.querySelector('button');
button.addEventListener('click',play);

