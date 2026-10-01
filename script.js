/* =========================================================
   1. LOADING SCREEN
   Animates dot fill + percentage, then swaps to a logo
   that zooms+fades out. When fully gone we show the login.
========================================================= */
(function () {
  const dotsEl        = document.getElementById('dots');
  const pctEl         = document.getElementById('loadingPct');
  const loadingContent= document.getElementById('loadingDots');
  const logoEl        = document.getElementById('loadingLogo');
  const loadingEl     = document.getElementById('loading');
  const DOTS = 8;
  
	// Local storage key.
	// Change this if you ever want to invalidate old login sessions.
	const LOGIN_KEY = 'aetheriaLoggedIn';
	
	// Check whether this browser has already logged in.
	const alreadyLoggedIn = localStorage.getItem(LOGIN_KEY) === 'true';
	const savedName = localStorage.getItem('aetheriaName');

  // Build placeholder dots
  for (let i = 0; i < DOTS; i++) {
    const d = document.createElement('div');
    d.className = 'dot';
    dotsEl.appendChild(d);
  }
  const dotEls = dotsEl.querySelectorAll('.dot');

  let progress = 0;
  const id = setInterval(() => {
    progress += 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(id);
      update();
      // Sequence: dots out -> logo in -> logo zoom-out -> fade screen -> show login
      setTimeout(() => { 
	  loadingContent.classList.add('hidden'); 
	  logoEl.classList.remove('hidden'); 
	  }, 300);
	setTimeout(() => {
		logoEl.classList.add('zoom-out');
	}, 2200);
	  
	  if (alreadyLoggedIn) { 
	  const loginOverlay = document.getElementById('loginOverlay');
	  const heroNameEl = document.getElementById('heroName');
	  if (heroNameEl && savedName) {
	  heroNameEl.textContent = savedName.toUpperCase();
	  }
	  
	  if (loginOverlay) {
		loginOverlay.remove();
	  }
	  /* * Returning visitor: * Skip the login completely. * We simply let the loader fade away and reveal the homepage. */ 
	  setTimeout(() => { loadingEl.classList.add('fade-out'); }, 2350);
	  setTimeout(() => { loadingEl.remove();
	  // Unlock scrolling 
	  document.body.style.overflow = '';
	  revealCheck();

			// ✅ START MUSIC FOR LOGGED-IN VISITORS
	      startBackgroundMusic();
	  }, 3200);
	  } else {
	  /* * First-time visitor: * Mount the login before the loader disappears. */ 
	  
      // Mount the login overlay BEFORE the loader fades out, so the
      // homepage never flashes through in between. The loader sits on top
      // (z-index 100) and fades away to reveal the already-mounted login (z-index 95).
      setTimeout(() => showLogin(), 2350);
      setTimeout(() => {
	  loadingEl.classList.add('fade-out');
	  }, 2400);
      setTimeout(() => {
		  loadingEl.remove();
	  }, 3200);
	}
      return;
    }
    update();
  }, 60);

  function update() {
    pctEl.textContent = progress;
    dotEls.forEach((el, i) => {
      const filled = (i + 1) * (100 / DOTS) <= progress + 5;
      el.classList.toggle('filled', filled);
    });
  }
})();

/* =========================================================
   2. LOGIN PROMPT
   Real (but local) validation:
   - PASSWORD must match exactly "SinBday" — change PASSWORD
     constant below to change it.
   - The displayed name on the hero ("PLACEHOLDER NAME") is
     replaced by the entered name only when the entered name
     is one of ALLOWED_NAMES. Otherwise it falls back to
     FALLBACK_NAME.
   - "Forgot Password" opens a small modal revealing the
     password. Edit the hint text in index.html (#forgotModal).
========================================================= */
const PASSWORD       = 'SinBday';                              // required password
const ALLOWED_NAMES  = ['Sin', 'Sinem', 'Sinistooshort'];      // case-insensitive whitelist
const FALLBACK_NAME  = 'Sinem';                                // shown when name not allowed

function showLogin() {
  const overlay = document.getElementById('loginOverlay');
  const form    = document.getElementById('loginForm');
  const userEl  = document.getElementById('loginUser');
  const passEl  = document.getElementById('loginPass');
  const errEl   = document.getElementById('loginError');
  const forgot  = document.getElementById('forgotBtn');
  const modal   = document.getElementById('forgotModal');
  const heroNameEl = document.getElementById('heroName');

  overlay.classList.remove('hidden');
  // Lock scroll while login is up
  document.body.style.overflow = 'hidden';

  // --- Forgot password modal --------------------------------
  forgot.addEventListener('click', () => modal.classList.remove('hidden'));
  modal.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', () => modal.classList.add('hidden'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) modal.classList.add('hidden');
  });

  // --- Copy-password button ---------------------------------
  // Writes PASSWORD to the user's clipboard. Uses the modern
  // Clipboard API and falls back to a hidden <textarea> for
  // browsers that block clipboard.writeText (file:// pages).
  const copyBtn   = document.getElementById('copyPassBtn');
  const copyLabel = document.getElementById('copyPassLabel');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const ok = await copyToClipboard(PASSWORD);
      copyLabel.textContent = ok ? 'COPIED!' : 'PRESS CTRL+C';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyLabel.textContent = 'COPY';
        copyBtn.classList.remove('copied');
      }, 1800);
    });
  }

  // --- Submit handler ---------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawName = userEl.value.trim();
    const pass    = passEl.value;

    // Password check — case sensitive on purpose
    if (pass !== PASSWORD) {
      errEl.classList.remove('hidden');
      passEl.value = '';
      passEl.focus();
      // Shake the card for feedback
      const card = document.querySelector('.login-card');
      card.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' },
         { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }],
        { duration: 280 }
      );
      return;
    }
	
	// ✅ START MUSIC HERE UPON SUCCESSFUL LOGIN
    startBackgroundMusic();

    // Decide which name to show on the hero
    const matched = ALLOWED_NAMES.find(n => n.toLowerCase() === rawName.toLowerCase());
    const finalName = matched ? matched : FALLBACK_NAME;
    if (heroNameEl) heroNameEl.textContent = finalName.toUpperCase();

    // Dismiss the overlay
    overlay.classList.add('fade-out');
	// Remember that this browser has successfully logged in.
	localStorage.setItem('aetheriaLoggedIn', 'true');
	localStorage.setItem('aetheriaName', finalName);
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
      revealCheck();
    }, 700);
  });
}

/* Tiny clipboard helper — works on http(s) AND on file:// (local) */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) { return false; }
}

/* =========================================================
   3. SMOOTH SCROLL helper (used by nav buttons)
========================================================= */
function smoothScrollTo(targetY, duration) {
  const startY = window.scrollY || window.pageYOffset;
  const distance = targetY - startY;
  const start = performance.now();
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, startY + distance * ease(t));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
document.querySelectorAll('[data-scroll]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const el = document.getElementById(btn.getAttribute('data-scroll'));
    if (!el) return;
    const targetY = el.getBoundingClientRect().top + window.scrollY - 79;
    smoothScrollTo(targetY, 1200);
  });
});

/* =========================================================
   4. ACTIVE SECTION TRACKING
========================================================= */
(function () {
  const ids = ['home', 'memories', 'letters', 'wishes', 'finale'];
  const navBtns = document.querySelectorAll('.nav-btn');
  const obs = new IntersectionObserver(
    (entries) => {
      const v = entries.filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!v) return;
      navBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-scroll') === v.target.id));
    },
    { threshold: [0.3, 0.6] }
  );
  ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
})();

/* =========================================================
   5. SCROLL REVEAL
   Adds .in-view to .reveal elements when they enter the
   viewport so the CSS transition can play.
========================================================= */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
}, { threshold: 0.15 });
function revealCheck() {
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  // Hero is already on screen — reveal immediately
  document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('in-view'));
}
revealCheck();

/* =========================================================
   6. MUTE TOGGLE + AUTO-PLAY
========================================================= */
function startBackgroundMusic() {
  const bgAudio   = document.getElementById('bgAudio');
  const iconMuted = document.getElementById('iconMuted');
  const iconUnmuted = document.getElementById('iconUnmuted');

  if (bgAudio) {
    bgAudio.muted = false;
    bgAudio.volume = 0.35;
    bgAudio.play().then(() => {
      if (iconMuted && iconUnmuted) {
        iconMuted.classList.add('hidden');
        iconUnmuted.classList.remove('hidden');
      }
    }).catch(err => {
      console.warn("Autoplay blocked by browser:", err);
    });
  }
}

/* =========================================================
   6. MUTE TOGGLE + auto-play attempt on first interaction
========================================================= */
(function () {
  const audio   = document.getElementById('bgAudio');
  const btn     = document.getElementById('muteBtn');
  const muted   = document.getElementById('iconMuted');
  const unmuted = document.getElementById('iconUnmuted');
  audio.volume = 0.35;

  const tryPlay = () => {
    audio.play().then(() => {
      audio.muted = false;
      muted.classList.add('hidden');
      unmuted.classList.remove('hidden');
    }).catch(() => {});
    window.removeEventListener('click', tryPlay);
    window.removeEventListener('scroll', tryPlay);
  };
  window.addEventListener('click',  tryPlay, { once: true });
  window.addEventListener('scroll', tryPlay, { once: true });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (audio.paused) { audio.play().catch(() => {}); audio.muted = false; }
    else audio.muted = !audio.muted;
    muted.classList.toggle('hidden', !audio.muted);
    unmuted.classList.toggle('hidden', audio.muted);
  });
})();

/* =========================================================
   7. HERO PARALLAX (mouse-following background)
========================================================= */
(function () {
  const bg = document.getElementById('heroBg');
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth  - 0.5) * 40;
    const y = (e.clientY / window.innerHeight - 0.5) * 40;
    bg.style.transform = `translate(${x}px, ${y}px) scale(1.08)`;
  });
})();

/* =========================================================
   10. CHAPTER III — CATEGORY-FILTERED CAROUSEL & DETAIL VIEW
========================================================= */
(function () {
  const ICONS = [
    { name: 'JJK', desc: 'Jujutsu Kaisen Sorcerers seem to have a desire to tell you something, I wonder what could it be..', svg: 'assets/Characters/JJK/JJK.svg'/*'<polygon points="12,2 14,9 21,9 15.5,13.5 17.5,21 12,16.5 6.5,21 8.5,13.5 3,9 10,9"/>'*/ },
    { name: 'Genshin Impact', desc: 'An Archon wishes to tell you something, but she isnt alone. What could it possibly be..?', svg: 'assets/Characters/Genshin Impact/Genshin.svg'/*'<polyline points="14.5,17.5 3,6 3,3 6,3 17.5,14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>'*/ },
    { name: 'LADS', desc: 'Some of them seem eager than the rest to tell you something, better to not keep them waiting "kitten".', svg: 'assets/Characters/LADS/Lads.svg'/*'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'*/ },
    { name: 'Wuwa', desc: 'The silent waves are wuthering towards you, one of them appears to be a sailor of a distant land.. What could they possibly want to tell you?', svg: 'assets/Characters/Wuthering Waves/Wuwa.svg'/*'<line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>'*/ },
    { name: 'HSR', desc: 'Aboard the station there are a few guests who wish to speak with you, one of them is quite a nihilist.. What is it that they want?', svg: 'assets/Characters/Honkai Star Rail/HSR.svg' /*<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2"/>'*/ },
    { name: 'Endfield', desc: 'Technological advances have allowed a few individuals to reach you, they appear to have something important to discuss. What could it be?', svg: 'assets/Characters/Endfield/endfield.svg' /*<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.3c1.4 9-6.4 11.7-8.2 17.7zM2 21c0-3 1.85-5.36 5.08-6"/>'*/ },
  ]; /*LADS find a better icon if possible, recolor JJK as a test*/

  // Distinct banner sets mapped to each category index
  const CATEGORY_BANNERS = {
    0: [ // Lumen aka JJK
      { 
	    cutout: 'assets/Characters/JJK/PassGojo3.png', 
	    img: 'assets/Characters/JJK/GojoBG.jpg', 
		name: 'Gojo Satoru', 
		tagline: 'Throughout heaven and Earth … I alone am the honored one.',
        bio: 'Satoru Gojo is a special grade jujutsu sorcerer and widely recognized as the strongest in the world.',
        subBio: 'He serves as a teacher at Tokyo Jujutsu High, where he mentors main characters including Yuji Itadori, Megumi Fushiguro, and Nobara Kugisaki.',
		birthdayMsg: `Hey, hey, hey! Happy Birthday!<br><br>Don't look so shocked. Did you really think the strongest sorcerer in the world would forget your special day? I practically have a Limitless memory when it comes to things that matter—and celebrating you definitely qualifies.<br><br>You've been working so hard lately dealing with gross curses and boring mission reports, so today is an official day off by my executive order. Principal Yaga tried to hand me a mission, but I told him I was busy doing 'vital educational mentoring.' (That means eating cake with you).<br><br>I swung by Sendai on my way back from a 'work trip' and picked up those famous, super-exclusive Kikufuku mochi just for us. Don't let Megumi or Nobara see, or they'll complain about favoritism.<br><br>Enjoy your day, stay awesome, and remember—as long as I'm around, you never have to worry about a thing. Now come find me, the cake is waiting! Happy Birthday! You're doing great, kid.`
	  },
      { 
	  cutout: 'assets/Characters/JJK/yuji-itadori1.png', 
	  img: 'assets/Characters/JJK/YujiBG.jpg', 
	  name: 'Yuji Itadori', 
	  tagline: 'Grandpa said a good death is the one where you know you helped. Thats what Im going to earn.',
	  bio: 'Yuji Itadori was born to a normal family, raised by his grandfather after his parents death. His grandfather, who was on his deathbed, imparted Yuji with a simple but profound lesson: "Help others, and die with no regrets."',
	  subBio: 'Yuji was introduced to Jujutsu High, where he trained under Satoru Gojo and met other sorcerers like Megumi Fushiguro and Nobara Kugisaki. He learned that his mission was to collect all of Sukunas fingers and ultimately eliminate the Curse, even if it meant sacrificing himself.', 
	  birthdayMsg: `HEY! Happy Birthday!!<br><br>I wanted to be the very first person to text you today! I hope you’re ready, because Fushiguro, Kugisaki, and I have been planning this for a whole week. Well... mostly me, but I forced Fushiguro to help carry the groceries!<br>You’ve been training so hard lately, and you’re getting seriously strong. But today, you gotta relax! I’m taking over the kitchen tonight and making my special recipe ginger meatballs. I promise it tastes way better than the cafeteria food. I even bought a huge cake, and Gojo-sensei swore he wouldn’t eat the whole thing before you blew out the candles (I hid it in a secret fridge just in case).<br>Seriously though, I’m really, really glad I met you. You’ve always got my back, so I promise I’ll always have yours. Let’s make today awesome! Hurry up and come down to the dorms, the food is almost ready!`
	  },
      { 
	  cutout: 'assets/Characters/JJK/Kento1.png', 
	  img: 'assets/Characters/JJK/KentoBG.jpg', 
	  name: 'Kento Nanami', 
	  tagline: 'There are moments — small ones — that remind you life can be tolerable. A sandwich at the right bakery. Toast cut to the right thickness. Hold onto those.',
	  bio: 'A grade 1 sorcerer who left jujutsu to work as a salaryman, realized corporate life was equally soul-crushing, and came back.',
      subBio: 'He mentored Yuji Itadori during the Mahito investigation and became one of the few adults Yuji genuinely trusted.', 	  
	  birthdayMsg: `Good morning. I am writing to remind you that according to your personnel file, today marks the anniversary of your birth. Happy Birthday. Jujutsu sorcery is fundamentally an accumulation of regrets and unnecessary overtime. However, today is an exception. I have personally reviewed your mission log and cleared your schedule for the next twenty-four hours. Principal Yaga and Gojo-san have been notified that you are unreachable. If Gojo attempts to drag you into any reckless 'celebrations,' you have my full permission to ignore his calls. Being a sorcerer requires immense mental fortitude, but neglecting your youth is a mistake. I have attached a few practical provisions for you. There is also a reservation under your name at a quiet bakery near the station—the bread there is excellent, and they are expecting you. Please use this day to rest properly. Your growth has been commendable, but you are still a student. Do not rush to grow up faster than you need to. We will resume your training tomorrow at precisely 08:00.`
	  },
      { 
	  cutout: 'assets/Characters/JJK/Nobara2.png', 
	  img: 'assets/Characters/JJK/NobaraBG.jpg', 
	  name: 'Nobara Kugisaki', 
	  tagline: 'Im not the kind of woman whod sacrifice everything for a man',
	  bio: 'A first-year at Tokyo Jujutsu High from the countryside who came to Tokyo as much for the city life as for the sorcery.',
      subBio: 'Nobaras fighting philosophy is straightforward: hit hard, take hits harder, and make the enemy regret ever making this personal. Her willingness to endure self-inflicted damage for tactical advantage made Nanami rate her as having genuine grade 1 potential.', 	  
	  birthdayMsg: `HAPPY BIRTHDAY!!! 🥳✨ Alright, look. I saw the outfit you were planning on wearing today, and as your official best friend, I am legally staging an intervention. It is your birthday! You are not spending it slouching around the Tokyo Jujutsu Tech dorms looking like an extra in a horror movie! I already dragged Itadori out of bed at 6:00 AM to hold my bags, and Fushiguro is acting like a grumpy chauffeur, so the whole squad is ready. We are heading straight into the city. I found this amazing boutique that has the exact jacket you’ve been staring at for months. And don't even think about looking at the price tag—Gojo-sensei handed over his black card earlier after I threatened to hammer a straw doll of his favorite sunglasses. You’ve been doing amazing on our missions lately, and I’m proud to fight alongside someone with actual taste. So hurry up, put on some nice shoes, and meet us at the gate! Today, we take over Tokyo. Happy Birthday, babe!`
	  }
    ],
    1: [ // Valor aka Genshin
      { 
	  cutout: 'assets/Characters/Genshin Impact/Furina1.png', 
	  img: 'assets/Characters/Genshin Impact/FurinaBG.png', 
	  name: 'Furina', 
	  tagline: 'The world is just a stage. Its better to laugh than to cry because laughter is of human nature. Laugh at it all, dont worry. Lets enjoy today',
	  bio: 'Undoubtedly, Furina has been much loved by the people of Fontaine from the moment she became the Hydro Archon. Her charismatic parlance, lively wit, and elegant bearing — all bear witness to her godly charms. ',
      subBio: 'But perhaps the thing that she is most revered for is her unrivaled sense of drama. As the protagonist of a famous play at the Opera Epiclese once put it, "Life is like the theater — you never can tell when the twist will come."', 	  
	  birthdayMsg: "Happy Birthday! Here, please take this ticket as your gift. It's a VIP seat to see Happy Day, just don't forget to show up to the performance! Hmm? What's `Happy Day`? *sigh* Well, I wanted to keep it a surprise... But it's an opera that I've rehearsed personally. It's about a big group of people that gather together to celebrate a certain very important person. You understand now, right? Just don't forget to come!"
	  },
      { 
	  cutout: 'assets/Characters/Genshin Impact/neuvillette3.png', 
	  img: 'assets/Characters/Genshin Impact/NeuviBG.jpg', 
	  name: 'Neuvillette', 
	  tagline: 'Ah, its past noon. You must be looking forward to your afternoon tea or coffee break? I certainly am.',
	  bio: 'Neuvillette is a solitary person. Fontainians who have tried to get close to him have, without exception, been politely rejected. To this day, no one even knows his first name, since he has always asked that he be referred to by his last name.',
      subBio: 'He believes that close personal ties will lead to suspicions about the justness of ones judgments, while he must remain a symbol of absolute justice.', 	  
	  birthdayMsg: "Ah, so it's your birthday. Happy birthday. I do not know if rain is in the forecast today, but let me see what I can do."
	  },
      { 
	  cutout: 'assets/Characters/Genshin Impact/Arlecchino3.png', 
	  img: 'assets/Characters/Genshin Impact/Arlecchino.png', 
	  name: 'Arlecchino', 
	  tagline: 'Fate grants favors to no one. Only those who would fight it with every ounce of their being may earn the right to challenge it.',
	  bio: 'I am The Knave, Arlecchino, Fourth of the Fatui Harbingers. The children of the House of the Hearth call me "Father."',
      subBio: 'I do hope our partnership proves to be a pleasant one, although I would imagine that should be fairly easy. After all, theres no cause for contention between us at the moment... wouldnt you agree?', 	  
	  birthdayMsg: "This memo states that today is your birthday. Is that true? Birthdays should be lively occasions. It's always nice to have an excuse to set formal matters aside every now and then, whether it's for the purpose of celebrating yourself or others. Come. I've prepared a feast for you at the House of the Hearth. Let's not keep the children waiting."
	  }
    ],
    2: [ // Ember aka Love and Deep Space
      { 
	  cutout: 'assets/Characters/LADS/Sylus.png', 
	  img: 'assets/Characters/LADS/SylusBG.jpg', 
	  name: 'Sylus', 
	  tagline: 'Not everyone is born with the privilege of being a normal person.',
	  bio: 'Sylus is an expert mechanic, engineering, software, and electrical work. In the Secret Times Bloodnight Blaze, Sylus describe Sinny`s scent as steamy and sweet, which reminds him of cherry wine.',
      subBio: 'Sylus likes to gift and buy Sinny things as a sign of affection just like animal presenting trophies to their match.', 	  
	  birthdayMsg: "Remember that place where I picked you up and brought you back to Onychinus? it has an organ. And while it is old, its timbre is the best. What? It's a present just for you. Anyway you'll understand how enchanting the song is once you listen to it. Happy birthday Dear"
	  },
      { 
	  cutout: 'assets/Characters/LADS/Valko.png', 
	  img: 'assets/Characters/LADS/ValkoBG.gif', 
	  name: 'Valko', 
	  tagline: 'A wild unbound will, surrendered only to you.',
	  bio: 'Not much is known about him but rumors say he has a wolf tail and wolf ears.',
      subBio: 'What we know though.. is that he will protect his pack no matter what.',	  
	  birthdayMsg: `Hey Sinny, the clock just struck 12. And that means... its your special day. Call me old fashioned but I just wanted to make sure I was the first one to say it to you. I know things have felt heavy lately. But I see how fiercely youve been standing your ground. And holding onto what's right. You have a heart that never compromises and I couldnt be prouder to stand by your side... As your mate. So for today? Drop all your worries, the world can wait. Let your wolf pamper you, hold you close, and give you all the peace you deserve. No matter how long the storm lasts, Im right here with you. Holding down the fort. Happy Birthday. I love you, today, and every day that follows. 
(https://youtu.be/zo0mL8_NyH4)`
	  },
      { 
	  cutout: 'assets/Characters/LADS/Xavier.png', 
	  img: 'assets/Characters/LADS/XavierBG.jpg', 
	  name: 'Xavier', 
	  tagline: 'My light only shines over you.',
	  bio: 'Xavier is a calm and caring individual. Noted by both Sinny and others, Xavier does not exude many facial expressions. Often, instead, opting for a neutral expression with little to no change in his tone of voice.',
      subBio: 'However, in his dates and memories, Xavier exhibits more emotion with Sinny, often teasing her and showcasing his affection and care for her in private.',	  
	  birthdayMsg: "Today is your birthday so the bakery, aka me, is preparing a little something special. I wanted to bake a cake for you, but I also dont want to accidentally mess up.. Of course Im confident in my baking skills. Youre the one whos always been skeptical. Hmm? All you want is a 'happy birthday' to you? Sure I can do that. Youre the birthday girl after all. Happy birthday Sinny (https://youtu.be/Sja1cEWWkU4)"
	  }
    ],
    3: [ // Frost aka Wuthering Waves
      { 
	  cutout: 'assets/Characters/Wuthering Waves/Scar.webp', 
	  img: 'assets/Characters/Wuthering Waves/ScarBG.jpg', 
	  name: 'Scar', 
	  tagline: 'If you need to hear it from me, then… Yes, I am Scar. The “cruel and twisted maniac”.',
	  bio: 'Scar is an Overseer of the Fractsidus, his strong belief is that to attain the next level of human evolution, individuals must absorb the Tacet Discord into themselves, engaging in a transformative struggle. ',
      subBio: 'To him, the Tacet Discords brought forth by the Lament represent a self-regulating system of evolution.', 	  
	  birthdayMsg: "24, a whole year older. A whole year closer to... whatever comes next. I know you hate birthdays, you told me once when I asked about it months ago. I ordered cake, your favorite. Happy birthday."
	  },
      { 
	  cutout: 'assets/Characters/Wuthering Waves/Phrolova2.png', 
	  img: 'assets/Characters/Wuthering Waves/BGPhr.png', 
	  name: 'Phrolova',
	  tagline: 'The silent and somber Overseer of the Fractsidus, Phrolova carries an endless sadness that envelops everyone around her.',
	  bio: 'She is a particularly powerful Resonator and a former Overseer of the Fractsidus. Her forte can manipulate and transfigure the frequencies of humans, Echoes, and Tacet Discords alike.',
      subBio: 'A life filled with unexpected suffering, grief, and betrayal led this former musician to align with the Fractsidus, in which she seeks to rekindle a past from which she was the sole survivor.', 	  
	  birthdayMsg: `Your birthday? Today, you say? Oh... Well, if you're expecting a present or some kind wishes, then simply wait here. A long wait can be considered a gift in itself.`
	  },
      { 
	  cutout: 'assets/Characters/Wuthering Waves/Brant3.png', 
	  img: 'assets/Characters/Wuthering Waves/BrantBG.jpg', 
	  name: 'Brant', 
	  tagline: 'The curtains pull back and Im here to hunt for every laugh! Brant, at your service. A pleasure to make your acquaintance.',
	  bio: 'He is the captain of the Troupe of Fools, exuding a carefree, easygoing charm and charisma, unbound by convention.',
      subBio: 'However, beneath his flamboyant persona lies a kind heart deeply devoted to ensuring his crews safety and freedom.', 	  
	  birthdayMsg: "Happy birthday, my dear friend! Got any plans today? How about slipping away with me for a little adventure? I'll even let you take the helm. Here, hold on tight—together, we'll sail into the far horizon!"
	  }
    ],
    4: [ // Zephyr aka Honkai Star Rail
      { 
	  cutout: 'assets/Characters/Honkai Star Rail/Kafka3.png', 
	  img: 'assets/Characters/Honkai Star Rail/KafkaBG.jpg', 
	  name: 'Kafka', 
	  tagline: 'You wont remember a thing except me.',
	  bio: 'A member of the Stellaron Hunters who is calm, collected, and beautiful. Her record on the wanted list of the Interastral Peace Corporation only lists her name and her hobby.',
      subBio: 'People have always imagined her to be elegant, respectable, and in pursuit of things of beauty even in combat.', 	  
	  birthdayMsg: `Hello, Sinny. Today is your 24th Birthday. Listen: you are going to have a simple yet unforgettable birthday.
I'm always watching over you. You are doing well. At every stop in the past, you have found the most wonderful path amidst the tangled threads of fate.
It is a pity that I can't always stay by your side. But I promise, we will meet again at the next crossroad of destiny.
When that time comes, I will say it to you in person: happy birthday.`
	  },
      { 
	  cutout: 'assets/Characters/Honkai Star Rail/Sparkle.png', 
	  img: 'assets/Characters/Honkai Star Rail/SparkleBG.jpg', 
	  name: 'Sparkle', 
	  tagline: 'Im not exactly a person loaded with cool skills, and dreaming big isnt really my thing. But, ya know, my latest thing is... getting myself into the Genius Society! Ha, Im so ready to give it a go. Reckon anyone will buy it?',
	  bio: 'A member of the Masked Fools. Inscrutable and unscrupulous. A dangerous master of theatrics engrossed in playing roles.',
      subBio: 'A woman of countless masks and many faces. Wealth, status, power... None of this matters to Sparkle. The only thing that can lure her interest is "amusement."', 	  
	  birthdayMsg: `Oh? Look who just turned another year older! Happy birthday, my dear Sinny!<br><br>Did you think I’d forget? Please, I’ve been counting down the seconds! For your special day, I thought about giving you a perfectly normal, boring old gift... but where is the fun in that? Normalcy is such a dreadful tragedy, don't you think?<br>So instead, I'm gifting you a little bit of chaos. Let’s twist reality, tear up the script, and turn this next year of your life into an absolute masterpiece of a show!<br>Remember, the universe is just a stage, and today, you’re the main character. Just don't let the spotlight blind you before our next little game. I'll be watching from the wings~<br><br>XOXO,<br>Sparkle 🃏`
	  },
      { 
	  cutout: 'assets/Characters/Honkai Star Rail/Aventurine2.png', 
	  img: 'assets/Characters/Honkai Star Rail/AventurineBG.jpg', 
	  name: 'Aventurine', 
	  tagline: 'Go ahead, use me as you wish, even stab me in the back if you see fit. Exploitation and treachery are simply tools of the trade. But remember, I dont make deals that dont pay off... So, I hope you dont disappoint me',
	  bio: 'Kakavasha, better known as Aventurine, a senior manager in the IPC Strategic Investment Department and one of the Ten Stonehearts.',
      subBio: 'His Cornerstone is the "Aventurine of Stratagems." He possesses an air of frivolity and doesnt shy away from taking risks. His constant smile makes it difficult for people to discern his true feelings.', 	  
	  birthdayMsg: `Hello, my dear friend.<br><br>I hear today is a milestone worth celebrating for you. A little bird told me—or perhaps it was just luck guiding my intuition—that it’s your birthday.<br>Life is the ultimate gamble, but walking a path through the vast universe with a crew like yours? I’d say you’ve already hit the jackpot. Still, every good player deserves a bonus on their special day. I’ve attached a little something to help you chip into your next big venture. Don't worry about the cost; consider it an investment in our friendship.<br>Go out, have fun, and play your cards right today. And remember—whenever you want to test your luck, your humble servant Aventurine is always ready to match your wager.<br>Happy Birthday, Sinny. May the chips always fall in your favor.`
	  }
    ],
    5: [ // Verdant aka Endfield 
      { 
	  cutout: 'assets/Characters/Endfield/camille2.png', 
	  img: 'assets/Characters/Endfield/CamilleBG.jpg', 
	  name: 'Camille', 
	  tagline: 'Out of the deepest shadows, a drop of blood is drawn once more.',
	  bio: 'Camille Arno, a Keeper from Seš`qa specializing in handling violent incidents caused by or targeted at the Sarkaz.',
      subBio: 'As one of the most elite Keepers, he has mastered blood-related Originium Arts and is especially skilled at countering all manner of sinister witchcraft.', 	  
	  birthdayMsg: `Hey, Sinny.<br><br>Don't look so surprised. Even in a place as chaotic and rugged as Talos-II, I can keep track of a date when it matters. I know today is the day you officially stepped into this world, and that’s a milestone worth pausing for.<br>Most days, we’re out here fighting through the shadows, burning through the past, and carving out a future step by step. But today? The battlefield can wait a few hours. I’ve arranged for a few extra resources to be sent directly to your office—nothing too flashy, just some high-grade essentials to make sure your equipment stays as sharp as your mind.<br>You've got a heavy burden on those shoulders, but remember you've got people ready to light the way ahead with you. If you have some free time later tonight, let’s grab a drink away from the noise. I'll even let you choose the toast.<br>Happy Birthday, Sinny. Stay sharp, and don't let the fire go out.`
	  },
      { 
	  cutout: 'assets/Characters/Endfield/Endministrators.png', 
	  img: 'assets/Characters/Endfield/EndministratorBG.jpg', 
	  name: 'Endministrators', 
	  tagline: 'The Endministrator of Endfield Industries.',
	  bio: 'In the recorded history of Talos-II, the Endministrator stands as a key guardian who protected civilization on this planet and saved humanity from multiple catastrophic disasters.',
      subBio: 'The Endmins heroic deeds have given rise to many stories, tales, and even rumors.', 	  
	  birthdayMsg: `To the one currently awake.<br><br>If this automated archive is playing, it means the calendar cycle has synchronized with the date of your activation. Happy Birthday.<br>Talos-II is a harsh, unyielding world. It eats away at memories, collapses civilizations, and demands everything you have just to keep the lights on for Endfield Industries. When you look in the mirror, the weight of a thousand forgotten eras rests on your shoulders. You are a myth to the people outside, an anchor to your operators, and a savior to a world on the brink.<br>But today, step away from the tactical maps and the endless construction grids. Strip away the title of 'The Endministrator' for just a few moments. Remember that beneath the legendary reputation, you are still a living soul navigating the unknown. You have survived every hazard this planet has thrown at you.<br>The road ahead is long, and the Blight never truly rests. But as long as you keep moving forward, Talos-II has a future. Take care of yourself today. You are the only one who can.`
	  },
      { 
	  cutout: 'assets/Characters/Endfield/liino.png', 
	  img: 'assets/Characters/Endfield/liinoBG.jpg', 
	  name: 'Liino', 
	  tagline: 'Twinkle-twinkle! My latest performance is about to start!',
	  bio: 'Liino is a breakout idol from the Talos-II General Chamber of Commerce. Loved by the public ever since her debut, she is known as the "Morning Star of La Fantoma.',
      subBio: 'Renowned for her exquisite singing and unique performance style, her concerts often challenge norms and defy industry conventions.', 	  
	  birthdayMsg: `Hi, Sinny!<br><br>Guess who? That's right, it's Talos-II's number one Morning Star! I made sure to clear my entire schedule with the General Chamber of Commerce today. No press, no corporate suits, and absolutely no boring rehearsals. Why? Because it's your birthday, silly!<br>You know, the Engineering guys were complaining about me hogging the high-end audio gear aboard the Dijiang earlier... but once I told them I was recording a super-secret, completely exclusive birthday song for the Savior of Endfield, they practically gave me the keys to the room!<br>You work way too hard managing this planet, so consider this your official directive from your favorite idol: sit back, relax, and let me bring the music to you. I’ve attached a few special premium supplies to help you celebrate. If you need a private encore later, you know exactly where to find me.<br>Happy Birthday, Sinny! Keep shining bright, because you're the star that guides my stage.`
	  }
    ]
  };

  let active = 0;
  let start = 0;
  let selectedBanner = null;

  const btnsEl = document.getElementById('iconBtns');
  const showEl = document.getElementById('iconShowcase');
  const trackEl = document.getElementById('carouselTrack');
  const carouselContainer = trackEl.closest('.carousel');

  function svgIcon(svg) {
    // If it starts with '<', it's raw SVG markup rather than a file path
    if (svg.trim().startsWith('<')) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
    }
    // Otherwise, treat it as an image file path
    return `<img src="${svg}" alt="icon" style="width: 52px; height: 52px; object-fit: contain; display: inline-block;" />`;
  }

  function renderBtns() {
    btnsEl.innerHTML = '';
    ICONS.forEach((ic, i) => {
      const b = document.createElement('button');
      b.className = 'icon-btn' + (i === active ? ' active' : '');
      b.innerHTML = svgIcon(ic.svg);
      b.addEventListener('click', () => {
        active = i;
        start = 0;
        selectedBanner = null;
        renderBtns();
        renderShowcase('forward'); /*new forward*/
        renderCarousel('forward'); /*new forward*/
      });
      btnsEl.appendChild(b);
    });
  }
  
function openBirthdayModal(name, message) {
  let modal = document.getElementById('birthdayModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'birthdayModal';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; z-index: 9999; opacity: 0; transition: opacity 0.3s ease;
    `;
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background: oklch(0.18 0.02 260); border: 1px solid oklch(0.3 0.03 260); padding: 2.5rem; border-radius: 12px; max-width: 480px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); transform: scale(0.95); transition: transform 0.3s ease;">
      <h3 style="margin-top: 0; color: oklch(0.96 0.01 90); font-size: 1.5rem; margin-bottom: 1rem;">${name}'s Letter</h3>
      <p style="color: oklch(0.9 0.02 90 / 0.9); line-height: 1.7; font-size: 1rem; white-space: pre-line; margin-bottom: 2rem;">${message}</p>
      <button id="closeModal" style="background: oklch(0.3 0.03 260); color: white; border: none; padding: 0.5rem 1.2rem; border-radius: 6px; cursor: pointer; float: right;">Close</button>
    </div>
  `;

  setTimeout(() => {
    modal.style.opacity = '1';
    modal.firstElementChild.style.transform = 'scale(1)';
  }, 10);

  const close = () => {
    modal.style.opacity = '0';
    modal.firstElementChild.style.transform = 'scale(0.95)';
    setTimeout(() => modal.remove(), 300);
  };

  modal.querySelector('#closeModal').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
}

  function renderShowcase(direction = 'forward') { /*new: direction = 'forward'*/
    const ic = ICONS[active];
	/*new*/ showEl.className = 'icon-showcase ' + (direction === 'backward' ? 'anim-slide-backward' : 'anim-slide-forward');
	
    if (selectedBanner) {
	const cutoutSrc = selectedBanner.cutout || selectedBanner.img;
	const bgSrc = selectedBanner.bg || selectedBanner.img;
	
	// Fallback defaults if a property is missing on a specific character
      const tagline = selectedBanner.tagline || '';
      const bio = selectedBanner.bio || '';
      const subBio = selectedBanner.subBio || '';
	  
      showEl.innerHTML = `
	  <div class="showcase-bg-wrapper">
          <img src="${bgSrc}" alt="${selectedBanner.name}">
        </div>
        <div class="showcase-character-cutout">
          <img src="${cutoutSrc}" alt="${selectedBanner.name}">
        </div>
        <button id="backBtn" class="back-btn">‹ BACK</button>
        <div class="icon-showcase-body" style="padding-top: 3.5rem;">
          <p style="font-size: 0.9rem; color: oklch(0.96 0.01 90 / 0.7); margin-bottom: 0.75rem; font-style: italic;">
            ${tagline}
          </p>
          <div class="icon-divider" style="margin-bottom: 1.25rem;"></div>
          <h3 class="icon-name" style="display: flex; align-items: center; gap: 1rem; font-size: 2.4rem;">
            ${svgIcon(ic.svg)}
            ${selectedBanner.name}
          </h3>
          <p class="icon-desc" style="margin-top: 1.25rem; line-height: 1.6; color: oklch(0.96 0.01 90 / 0.85);">
            ${bio}
          </p>
          <p class="icon-desc" style="margin-top: 0.8rem; line-height: 1.5; color: oklch(0.96 0.01 90 / 0.65); font-size: 0.9rem;">
            ${subBio}
          </p>
          ${selectedBanner.birthdayMsg ? `
            <button id="birthdayBtn" style="margin-top: 1.5rem; background: oklch(0.57 0.28 295.8); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem; transition: opacity 0.2s;">
              View Birthday Message
		  </button>`:''}
        </div>`;
      
      document.getElementById('backBtn').addEventListener('click', () => {
        selectedBanner = null;
        renderShowcase('backward'); /*new: direction = 'backward'*/
        renderCarousel('backward'); /*new: direction = 'backward'*/
      });
	  
	  // Birthday Modal Trigger
      const birthdayBtn = document.getElementById('birthdayBtn');
      if (birthdayBtn) {
        birthdayBtn.addEventListener('click', () => {
          openBirthdayModal(selectedBanner.name, selectedBanner.birthdayMsg);
        });
      }
    } else {
		const bgMarkup = ic.svg.trim().startsWith('<')
        ? `<svg xmlns="http://www.w3.org/2000/svg" class="icon-bg-large" width="416" height="416" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${ic.svg}</svg>`
        : `<img src="${ic.svg}" class="icon-bg-large" alt="icon" style="width: 416px; height: 416px; object-fit: contain;" />`;
		
      showEl.innerHTML = `
        ${bgMarkup}
        <div class="icon-showcase-body">
          <div class="icon-divider"></div>
          <h3 class="icon-name">${ic.name}</h3>
          <p class="icon-desc">${ic.desc} Let's find out</p>
        </div>`;
    }
	setTimeout(() => {
      showEl.classList.remove('anim-slide-forward', 'anim-slide-backward');
    }, 450);
  }

    /*showEl.style.animation = 'none';
    void showEl.offsetWidth;
    showEl.style.animation = '';
  }*/

  function renderCarousel(direction = 'forward') { /*direction = 'forward'*/
    const currentBanners = CATEGORY_BANNERS[active] || CATEGORY_BANNERS[0];
    const N = currentBanners.length;
    const controlsEl = carouselContainer.querySelector('.carousel-controls');
	
	/**/ trackEl.className = 'carousel-track ' + (direction === 'backward' ? 'anim-slide-backward' : 'anim-slide-forward');

    if (selectedBanner) {
      trackEl.innerHTML = `
        <div class="single-card-view">
          <img src="${selectedBanner.img}" alt="${selectedBanner.name}" loading="lazy">
          <p class="carousel-label">${selectedBanner.name}</p>
        </div>
      `;
      if (controlsEl) controlsEl.style.display = 'none';
    } else {
      if (controlsEl) controlsEl.style.display = 'flex';
      trackEl.innerHTML = '';
      
      for (let i = 0; i < 4; i++) {
        const dataIdx = ((start + i) % N + N) % N;
        const b = currentBanners[dataIdx];
        const isFade = (i === 3);
        const item = document.createElement('div');
        item.className = 'carousel-item ' + (isFade ? 'fade' : 'expandable');
        item.innerHTML = `
          <img src="${b.img}" alt="${b.name}" loading="lazy">
          <p class="carousel-label">${b.name}</p>`;
        
        if (!isFade) {
          item.addEventListener('click', () => {
            selectedBanner = b;
            renderShowcase('forward'); /**/
            renderCarousel('forward'); /**/
          });
        }
        trackEl.appendChild(item);
      }
    }
	/**/setTimeout(() => {
      trackEl.classList.remove('anim-slide-forward', 'anim-slide-backward');
    }, 450);/**/
  }
  

  // Bind controls safely
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (!selectedBanner) {
        const currentBanners = CATEGORY_BANNERS[active] || CATEGORY_BANNERS[0];
        start = (start - 1 + currentBanners.length) % currentBanners.length;
        renderCarousel();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!selectedBanner) {
        const currentBanners = CATEGORY_BANNERS[active] || CATEGORY_BANNERS[0];
        start = (start + 1) % currentBanners.length;
        renderCarousel();
      }
    });
  }

  renderBtns();
  renderShowcase();
  renderCarousel();
})();

/* =========================================================
   11. ENVELOPE ANIMATIONS & YOUTUBE MODAL
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const envelopeCards = document.querySelectorAll('.envelope-card');
  const videoModal = document.getElementById('videoModal');
  const youtubeIframe = document.getElementById('youtubeIframe');
  const closeBtn = document.getElementById('closeBtn');

  // Safety Check: If the modal HTML is missing, warn in console instead of crashing
  if (!videoModal || !youtubeIframe || !closeBtn) {
    console.error("Envelope Error: Video modal elements are missing from index.html! Ensure the <div id='videoModal'> was pasted.");
    return; // Stops the script from crashing the rest of your site
  }

  let activeEnvelope = null;

  envelopeCards.forEach(card => {
    card.addEventListener('click', () => {
      // Prevent re-triggering while already opening
      if (card.classList.contains('open')) return;

      activeEnvelope = card;

      // 1. Trigger Flap & Blank Paper Animations
      card.classList.add('open');

      // 2. Wait 1200ms for animations to finish, then show video
      setTimeout(() => {
        const videoId = card.getAttribute('data-video-id');
        if (videoId) openVideoModal(videoId);
      }, 1200);
    });
  });

  function openVideoModal(videoId) {
    youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
    videoModal.classList.add('active');
  }

  function closeModal() {
    videoModal.classList.remove('active');
    youtubeIframe.src = ''; // Stop audio

    if (activeEnvelope) {
      setTimeout(() => {
        activeEnvelope.classList.remove('open');
        activeEnvelope = null;
      }, 300);
    }
  }

  closeBtn.addEventListener('click', closeModal);

  videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) {
      closeModal();
    }
  });
});